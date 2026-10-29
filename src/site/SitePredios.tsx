import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCorNavegador } from '@/lib/corNavegador';
import { CabecalhoSite, RodapeSite, VideoLeve, IconeWhats, waSofia, useFonteSite, useTituloPagina, promoNovembroAtiva, PROMO_PRECO } from './comum';
import { usePrediosPublicos } from './usePrediosPublicos';
import { useCart } from '@/contexts/SimpleCartContext';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { getImageUrl, type BuildingStore } from '@/services/buildingStoreService';
import { calculateBuildingsPrice, type PlanDuration } from '@/utils/buildingPriceUtils';
import loadGoogleMaps from '@/utils/googleMapsLoader';

const MapaPredios = lazy(() => import('./MapaPredios'));

/**
 * Prédios e preços (rota /loja). Grade enxuta (3 colunas no computador, 2 no celular), mapa do Google
 * só quando o cliente pede, lista sempre inteira na tela. NÃO vende pelo site: a lista vai para a Sofia no WhatsApp.
 */

const PLANOS: { m: PlanDuration; label: string }[] = [
  { m: 1, label: 'Mensal' }, { m: 3, label: '3 meses' }, { m: 6, label: '6 meses' }, { m: 12, label: '12 meses' },
];
type Ordem = 'perto' | 'moradores' | 'preco' | 'turistas' | 'az';
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const num = (n: number) => Math.round(n).toLocaleString('pt-BR');
const kmEntre = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const fmtKm = (k: number) => (k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1).replace('.', ',')} km`);
const telas = (p: BuildingStore) => p.quantidade_telas || 1;
const IcoMapa = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
);

export default function SitePredios() {
  useFonteSite();
  useCorNavegador({ fundo: '#0B0B0D' }); // topo e rodapé escuros: o "puxar além" e a área atrás da barra do Safari também
  useTituloPagina('Prédios e preços · EXA Mídia', 'Veja os prédios de Foz do Iguaçu com tela EXA no elevador e o preço por mês de cada um. Monte a sua lista e a Sofia fecha com você pelo WhatsApp.');
  const { predios, carregando } = usePrediosPublicos();
  const { cartItems, addToCart, removeFromCart, isItemInCart } = useCart() as any;
  const promo = promoNovembroAtiva();
  const [ordem, setOrdem] = useState<Ordem>('moradores');
  const [busca, setBusca] = useState('');
  const [endereco, setEndereco] = useState('');
  const [meuLocal, setMeuLocal] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoEnd, setBuscandoEnd] = useState(false);
  const [erroEnd, setErroEnd] = useState('');
  const [plano, setPlano] = useState<PlanDuration>(3);
  const [aberto, setAberto] = useState<BuildingStore | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const [mapa, setMapa] = useState(false);

  // Esc fecha a janela de cima; trava a rolagem do fundo quando há janela aberta
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (aberto) setAberto(null); else if (gaveta) setGaveta(false); else setMapa(false);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [aberto, gaveta]);
  const algumaJanela = !!aberto || gaveta || mapa;
  useEffect(() => {
    if (!algumaJanela) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, [algumaJanela]);

  const idsLista = useMemo(() => new Set<string>((cartItems || []).map((i: any) => i.panel?.id)), [cartItems]);
  const naLista: BuildingStore[] = useMemo(() => predios.filter((p) => idsLista.has(p.id)), [idsLista, predios]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const r = predios
      .filter((p) => !q || `${p.nome} ${p.bairro} ${p.endereco}`.toLowerCase().includes(q))
      .map((p) => ({ p, km: meuLocal && p.latitude && p.longitude ? kmEntre(meuLocal, { lat: p.latitude, lng: p.longitude }) : null }));
    if (ordem === 'perto') r.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    if (ordem === 'moradores') r.sort((a, b) => (b.p.publico_estimado || 0) - (a.p.publico_estimado || 0));
    if (ordem === 'preco') r.sort((a, b) => (a.p.preco_base || 0) - (b.p.preco_base || 0));
    if (ordem === 'turistas') r.sort((a, b) => Number(!!b.p.tem_airbnb) - Number(!!a.p.tem_airbnb) || (b.p.publico_estimado || 0) - (a.p.publico_estimado || 0));
    if (ordem === 'az') r.sort((a, b) => a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
    return r;
  }, [predios, busca, ordem, meuLocal]);

  const precoPor = useCallback((m: PlanDuration) => calculateBuildingsPrice(naLista as any, m), [naLista]);
  const preco = useMemo(() => precoPor(plano), [precoPor, plano]);
  const telasLista = naLista.reduce((s, p) => s + telas(p), 0);
  const moradoresLista = naLista.reduce((s, p) => s + (p.publico_estimado || 0), 0);
  const promoMes = naLista.length * PROMO_PRECO;

  const alternar = useCallback((p: BuildingStore) => {
    if (isItemInCart(p.id)) removeFromCart(p.id, { silencioso: true });
    else addToCart(adaptBuildingToPanel(p as any), 30, { silencioso: true });
  }, [isItemInCart, removeFromCart, addToCart]);
  const abrir = useCallback((p: BuildingStore) => setAberto(p), []);

  const buscarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endereco.trim()) return;
    setBuscandoEnd(true); setErroEnd('');
    try {
      const maps = await loadGoogleMaps();
      const geo = new maps.Geocoder();
      const { results } = await geo.geocode({ address: `${endereco}, Foz do Iguaçu - PR`, region: 'br' });
      const loc = results?.[0]?.geometry?.location;
      if (!loc) throw new Error('sem resultado');
      setMeuLocal({ lat: loc.lat(), lng: loc.lng() });
      setOrdem('perto');
    } catch {
      setErroEnd('Não encontrei esse endereço. Tente com o nome da rua e o número.');
    } finally { setBuscandoEnd(false); }
  };
  const limparEndereco = () => { setMeuLocal(null); setEndereco(''); setErroEnd(''); setOrdem('moradores'); };

  const planoLabel = PLANOS.find((x) => x.m === plano)?.label || '';
  const msgSofia = naLista.length
    ? `Oi Sofia! Montei minha lista no site da EXA e quero anunciar nestes ${naLista.length} ${naLista.length > 1 ? 'prédios' : 'prédio'}:\n${naLista.map((p) => `• ${p.nome.trim()} (${reais(p.preco_base || 0)}/mês)`).join('\n')}\n\n${promo ? `Quero a promoção de novembro: R$ ${PROMO_PRECO} por prédio (${reais(promoMes)}/mês).` : `Plano: ${planoLabel}. Valor que apareceu no site: ${reais(preco.pricePerMonth)}/mês${plano > 1 ? ` (total ${reais(preco.totalPrice)})` : ''}.`}${meuLocal && endereco ? `\nMeu negócio fica em: ${endereco}.` : ''}\nPode me ajudar a fechar?`
    : 'Oi Sofia, vim pela página de prédios do site e quero anunciar.';

  return (
    <div className="exa-site" style={{ background: '#F4F3F0', minHeight: '100vh' }}>
      <CabecalhoSite acao={
        <button type="button" className="b br" onClick={() => setGaveta(true)} style={{ minHeight: 42, padding: '0 18px', fontSize: 15 }}>
          Minha lista{naLista.length ? ` · ${naLista.length}` : ''}
        </button>
      } />

      {/* topo enxuto + busca pelo endereço */}
      <section style={{ background: '#0B0B0D', color: '#fff', paddingBlock: '28px 26px' }}>
        <div className="w" style={{ maxWidth: 1240, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h1 className="t" style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Escolha os prédios da sua marca.</h1>
            <p style={{ margin: '6px 0 0', color: '#9C9A96', fontSize: 15, fontWeight: 700 }}>Prédios residenciais de Foz do Iguaçu · preço por mês de cada um</p>
          </div>
          <form onSubmit={buscarEndereco} className="busca-end" role="search">
            <label htmlFor="end" className="sr-only">Endereço do seu negócio</label>
            <input id="end" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço do seu negócio" autoComplete="street-address" />
            <button type="submit" className="b br" disabled={buscandoEnd}>{buscandoEnd ? 'Buscando…' : <><span className="so-pc">Ver os mais perto</span><span className="so-cel">Buscar</span></>}</button>
          </form>
          {erroEnd && <p style={{ margin: 0, color: '#FFB3AE', fontSize: 14 }}>{erroEnd}</p>}
          {meuLocal && !erroEnd && (
            <p style={{ margin: 0, fontSize: 14, color: '#C9C7C2' }}>
              Mais perto de “{endereco}” primeiro.{' '}
              <button type="button" onClick={limparEndereco} style={{ background: 'none', border: 0, color: '#fff', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0, font: 'inherit' }}>Limpar</button>
            </p>
          )}
        </div>
      </section>

      <section style={{ paddingBlock: '20px 120px' }}>
        <div className="w" style={{ maxWidth: 1240, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="loja-barra">
            <label className="lb-filtro">
              <span className="sr-only">Filtrar por nome ou bairro</span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por nome ou bairro" className="campo" />
            </label>
            <select aria-label="Ordenar" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="campo lb-ordem">
              {meuLocal && <option value="perto">Mais perto</option>}
              <option value="moradores">Mais moradores</option>
              <option value="preco">Menor preço</option>
              <option value="turistas">Com turistas</option>
              <option value="az">A a Z</option>
            </select>
            <button type="button" className="lb-mapa" onClick={() => setMapa(true)}><IcoMapa /><span className="so-pc">Ver no mapa</span><span className="so-cel">Mapa</span></button>
          </div>

          {carregando && <p style={{ color: '#5A5852', margin: 0 }}>Carregando prédios…</p>}
          <div className="pcards">
            {lista.map(({ p, km }) => {
              const on = idsLista.has(p.id);
              const foto = p.imagem_principal ? getImageUrl(p.imagem_principal) : '';
              return (
                <article key={p.id} className={`pcard${on ? ' on' : ''}`}>
                  <button type="button" className="pcard-foto" onClick={() => abrir(p)} aria-label={`Ver detalhes de ${p.nome}`}>
                    {foto ? <img src={foto} alt="" loading="lazy" decoding="async" /> : <span className="pcard-sem">{p.nome}</span>}
                    <span className="pcard-selos">
                      {km !== null && <span className="selo selo-escuro">{fmtKm(km)}</span>}
                      {p.tem_airbnb && <span className="selo">Turistas</span>}
                    </span>
                  </button>
                  <div className="pcard-corpo">
                    <strong className="pcard-nome">{p.nome}</strong>
                    <span className="pcard-info">{p.bairro} · {telas(p)} {telas(p) > 1 ? 'telas' : 'tela'}{p.publico_estimado ? ` · ${num(p.publico_estimado)} moradores` : ''}</span>
                    <span className="pcard-preco">
                      {promo
                        ? <><s>{reais(p.preco_base || 0)}</s> <strong>{reais(PROMO_PRECO)}</strong><small>/mês</small></>
                        : <><strong>{reais(p.preco_base || 0)}</strong><small>/mês</small></>}
                    </span>
                    <button className="pcard-add" type="button" onClick={() => alternar(p)} aria-pressed={on}>{on ? 'Na lista ✓' : 'Adicionar'}</button>
                  </div>
                </article>
              );
            })}
          </div>
          {!carregando && !lista.length && <p style={{ color: '#5A5852' }}>Nenhum prédio com esse filtro.</p>}
        </div>
      </section>

      <RodapeSite />

      {/* barra flutuante: mapa + lista */}
      {!algumaJanela && (
        <div className="lista-flutuante" role="region" aria-label="Sua lista">
          <button type="button" className="lf-mapa" onClick={() => setMapa(true)} aria-label="Ver no mapa"><IcoMapa /><span>Mapa</span></button>
          <button type="button" className="lf-lista" onClick={() => setGaveta(true)}>
            <span className="lf-num">{naLista.length}</span>
            <span style={{ textAlign: 'left', lineHeight: 1.25, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 15 }}>{naLista.length ? `${naLista.length} ${naLista.length > 1 ? 'prédios' : 'prédio'} na lista` : 'Sua lista está vazia'}</strong>
              <span style={{ fontSize: 13, color: '#C9C7C2' }}>{naLista.length ? (promo ? `${reais(promoMes)}/mês na promoção` : `${reais(preco.pricePerMonth)}/mês · ${planoLabel}`) : 'Adicione prédios para ver o valor'}</span>
            </span>
            <span className="lf-seta" aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* mapa: só abre quando o cliente pede */}
      {mapa && (
        <div role="dialog" aria-modal="true" aria-label="Mapa dos prédios" className="mapa-fundo">
          <button type="button" className="gaveta-fora" onClick={() => setMapa(false)} aria-label="Fechar o mapa" />
          <div className="mapa-janela">
            <div className="mapa-topo">
              <strong>Toque no preço para ver o prédio</strong>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!!naLista.length && <button type="button" className="mapa-lista" onClick={() => { setMapa(false); setGaveta(true); }}>Minha lista · {naLista.length}</button>}
                <button type="button" onClick={() => setMapa(false)} aria-label="Fechar o mapa" className="x">×</button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Suspense fallback={<div style={{ height: '100%', borderRadius: 18, background: '#E2E0DA' }} />}>
                <MapaPredios predios={predios} naLista={idsLista} selecionado={aberto?.id} onAbrir={abrir} meuLocal={meuLocal} altura="100%" />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* lista → Sofia. Cabe sempre na tela: só os prédios rolam, o total e o botão ficam fixos */}
      {gaveta && (
        <div role="dialog" aria-modal="true" aria-label="Sua lista de prédios" className="gaveta-fundo">
          <button type="button" className="gaveta-fora" onClick={() => setGaveta(false)} aria-label="Fechar" />
          <div className="gaveta gaveta-lista">
            <div className="gl-topo">
              <h2 className="t" style={{ fontSize: 26 }}>Sua lista{naLista.length ? ` · ${naLista.length}` : ''}</h2>
              <button type="button" onClick={() => setGaveta(false)} aria-label="Fechar" className="x">×</button>
            </div>
            {!naLista.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 22px' }}>
                <p style={{ margin: 0, color: '#5A5852' }}>Toque em “Adicionar” nos prédios ou nas etiquetas de preço do mapa.</p>
                <button type="button" className="b bk" onClick={() => setGaveta(false)}>Ver os prédios</button>
              </div>
            ) : (
              <ul className="gl-itens">
                {naLista.map((p) => (
                  <li key={p.id}>
                    <span className="gl-foto">{p.imagem_principal && <img src={getImageUrl(p.imagem_principal)} alt="" loading="lazy" />}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong className="gl-nome">{p.nome}</strong>
                      <span className="gl-sub">{p.bairro} · {promo ? <><s>{reais(p.preco_base || 0)}</s> {reais(PROMO_PRECO)}</> : reais(p.preco_base || 0)}/mês</span>
                    </span>
                    <button type="button" onClick={() => removeFromCart(p.id, { silencioso: true })} aria-label={`Tirar ${p.nome} da lista`} className="tirar">Tirar</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="gl-rodape">
              {!!naLista.length && (
                <>
                  {promo ? (
                    <div className="gl-promo">
                      <strong>Promoção de novembro</strong>
                      <span>R$ {PROMO_PRECO} por prédio, por mês.</span>
                    </div>
                  ) : (
                    <div className="planos" role="group" aria-label="Plano">
                      {PLANOS.map((pl) => {
                        const on = pl.m === plano;
                        const v = precoPor(pl.m);
                        return (
                          <button key={pl.m} type="button" aria-pressed={on} onClick={() => setPlano(pl.m)} className={on ? 'on' : ''}>
                            <strong>{pl.label}</strong>
                            <span>{reais(v.pricePerMonth)}/mês</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="gl-resumo">
                    <span>{telasLista} {telasLista > 1 ? 'telas' : 'tela'}{moradoresLista ? ` · ${num(moradoresLista)} moradores` : ''}</span>
                  </div>
                  <div className="gl-total">
                    <span>{promo ? 'Por mês' : plano === 1 ? 'Por mês' : `Por mês, em ${plano} meses`}</span>
                    <strong className="t">{reais(promo ? promoMes : preco.pricePerMonth)}</strong>
                  </div>
                  {!promo && plano > 1 && <p className="gl-nota">Total de {reais(preco.totalPrice)} · economia de {reais(preco.savings)}</p>}
                </>
              )}
              <a className="b wa" href={waSofia(msgSofia)} target="_blank" rel="noopener noreferrer" style={{ width: '100%', minHeight: 54 }}>
                <IconeWhats />{naLista.length ? 'Enviar minha lista para a Sofia' : 'Falar com a Sofia'}
              </a>
              <p className="gl-nota">A Sofia confirma a disponibilidade, ajuda com o vídeo e fecha com você no WhatsApp.</p>
            </div>
          </div>
        </div>
      )}

      {/* detalhe do prédio */}
      {aberto && (
        <div role="dialog" aria-modal="true" aria-label={aberto.nome} className="gaveta-fundo" style={{ zIndex: 80 }}>
          <button type="button" className="gaveta-fora" onClick={() => setAberto(null)} aria-label="Fechar" />
          <div className="gaveta" style={{ padding: 0, gap: 0 }}>
            <div style={{ position: 'relative', aspectRatio: '16/10', background: 'linear-gradient(180deg,#24242A,#3A1416)', flex: 'none' }}>
              {aberto.imagem_principal && <img src={getImageUrl(aberto.imagem_principal)} alt={`Fachada do ${aberto.nome}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="x" style={{ position: 'absolute', right: 14, top: 14 }}>×</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 className="t" style={{ fontSize: 30 }}>{aberto.nome}</h2>
                <p style={{ margin: '4px 0 0', color: '#5A5852', fontSize: 15 }}>{aberto.endereco || aberto.bairro}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px 12px', borderBlock: '1px solid #E2E0DA', paddingBlock: 14 }}>
                <div>
                  <span className="t" style={{ display: 'block', fontSize: 26, color: '#EA251D' }}>{reais(promo ? PROMO_PRECO : aberto.preco_base || 0)}</span>
                  <span style={{ fontSize: 13, color: '#5A5852' }}>{promo ? <>por mês em novembro (era {reais(aberto.preco_base || 0)})</> : 'por mês (mensal)'}</span>
                </div>
                <div><span className="t" style={{ display: 'block', fontSize: 26 }}>{telas(aberto)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>{telas(aberto) > 1 ? 'telas' : 'tela'} no elevador</span></div>
                {!!aberto.publico_estimado && <div><span className="t" style={{ display: 'block', fontSize: 26 }}>{num(aberto.publico_estimado)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>moradores</span></div>}
                <div><span className="t" style={{ display: 'block', fontSize: 19 }}>{aberto.bairro}</span><span style={{ fontSize: 13, color: '#5A5852' }}>bairro</span></div>
              </div>
              {aberto.tem_airbnb && <p style={{ margin: 0, padding: '12px 14px', borderRadius: 12, background: '#F4F3F0', fontSize: 14 }}><strong>Tem apartamentos de temporada.</strong> A tela também é vista por turistas hospedados no prédio.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr)', gap: 14, alignItems: 'center' }}>
                <div style={{ borderRadius: 10, background: '#0B0B0D', padding: 5, aspectRatio: '9/16' }}>
                  <VideoLeve src="/site/tela-real.mp4" poster="/site/tela-real.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, display: 'block' }} aria-label="Exemplo do que passa nesta tela" />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#5A5852' }}>Na tela passam os avisos do prédio, notícias de Foz e do Brasil e os anúncios. O seu vídeo entra na janela do alto.</p>
              </div>
              <button className="b" type="button" onClick={() => alternar(aberto)} style={{ background: idsLista.has(aberto.id) ? '#0B0B0D' : '#EA251D', color: '#fff', minHeight: 52 }}>
                {idsLista.has(aberto.id) ? 'Na lista ✓ · tirar' : 'Adicionar à lista'}
              </button>
              {idsLista.has(aberto.id) && <button className="b bw" type="button" onClick={() => { setAberto(null); setMapa(false); setGaveta(true); }} style={{ border: '1.5px solid #D2D0CB', minHeight: 52 }}>Ver minha lista</button>}
              <Link to="/" className="lk" style={{ alignSelf: 'flex-start', fontSize: 15 }}>Como funciona a EXA</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
