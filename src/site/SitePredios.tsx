import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CabecalhoSite, RodapeSite, VideoLeve, IconeWhats, waSofia, useFonteSite, useTituloPagina } from './comum';
import { usePrediosPublicos } from './usePrediosPublicos';
import { useCart } from '@/contexts/SimpleCartContext';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { getImageUrl, type BuildingStore } from '@/services/buildingStoreService';
import { calculateBuildingsPrice, type PlanDuration } from '@/utils/buildingPriceUtils';
import loadGoogleMaps from '@/utils/googleMapsLoader';

const MapaPredios = lazy(() => import('./MapaPredios'));

/**
 * Prédios e preços (rota /loja). Mistura do layout antigo (lista + mapa do Google lado a lado, busca pelo endereço)
 * com o visual novo. NÃO vende pelo site: a lista vai para a Sofia no WhatsApp, que fecha o atendimento.
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

export default function SitePredios() {
  useFonteSite();
  useTituloPagina('Prédios e preços · EXA Mídia', 'Veja os prédios de Foz do Iguaçu com tela EXA no elevador, no mapa, com o preço por mês de cada um. Monte a sua lista e a Sofia fecha com você pelo WhatsApp.');
  const { predios, carregando } = usePrediosPublicos();
  const { cartItems, addToCart, removeFromCart, isItemInCart } = useCart() as any;
  const [ordem, setOrdem] = useState<Ordem>('moradores');
  const [busca, setBusca] = useState('');
  const [endereco, setEndereco] = useState('');
  const [meuLocal, setMeuLocal] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoEnd, setBuscandoEnd] = useState(false);
  const [erroEnd, setErroEnd] = useState('');
  const [plano, setPlano] = useState<PlanDuration>(3);
  const [aberto, setAberto] = useState<BuildingStore | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const [mapaCel, setMapaCel] = useState(false);

  // Esc fecha janelas; trava a rolagem do fundo quando há janela aberta
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(null); setGaveta(false); setMapaCel(false); } };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  const algumaJanela = !!aberto || gaveta || mapaCel;
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

  const alternar = useCallback((p: BuildingStore) => {
    if (isItemInCart(p.id)) removeFromCart(p.id, { silencioso: true });
    else addToCart(adaptBuildingToPanel(p as any), 30, { silencioso: true });
  }, [isItemInCart, removeFromCart, addToCart]);
  const abrir = useCallback((p: BuildingStore) => setAberto(p), []);
  const abrirDoMapaCel = useCallback((p: BuildingStore) => { setMapaCel(false); setAberto(p); }, []);

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
    ? `Oi Sofia! Montei minha lista no site da EXA e quero anunciar nestes ${naLista.length} ${naLista.length > 1 ? 'prédios' : 'prédio'}:\n${naLista.map((p) => `• ${p.nome} (${reais(p.preco_base || 0)}/mês)`).join('\n')}\n\nPlano: ${planoLabel}. Valor que apareceu no site: ${reais(preco.pricePerMonth)}/mês${plano > 1 ? ` (total ${reais(preco.totalPrice)})` : ''}.${meuLocal && endereco ? `\nMeu negócio fica em: ${endereco}.` : ''}\nPode me ajudar a fechar?`
    : 'Oi Sofia, vim pela página de prédios do site e quero anunciar.';

  return (
    <div className="exa-site" style={{ background: '#F4F3F0', minHeight: '100vh' }}>
      <CabecalhoSite acao={
        <button type="button" className="b br" onClick={() => setGaveta(true)} style={{ minHeight: 42, padding: '0 18px', fontSize: 15 }}>
          Minha lista{naLista.length ? ` · ${naLista.length}` : ''}
        </button>
      } />

      {/* topo + busca pelo endereço (como no layout antigo) */}
      <section style={{ background: '#0B0B0D', color: '#fff', paddingBlock: '32px 30px' }}>
        <div className="w" style={{ maxWidth: 1400, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 className="t" style={{ fontSize: 'clamp(30px,4.4vw,48px)' }}>Escolha os prédios da sua marca.</h1>
            <p style={{ margin: '8px 0 0', color: '#9C9A96', fontSize: 15, fontWeight: 700 }}>
              {carregando ? 'Carregando prédios…' : 'Prédios residenciais de Foz do Iguaçu · preço por mês de cada um'}
            </p>
          </div>
          <form onSubmit={buscarEndereco} className="busca-end" role="search">
            <label htmlFor="end" className="sr-only">Endereço do seu negócio</label>
            <input id="end" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço do seu negócio, para ver os prédios mais perto" autoComplete="street-address" />
            <button type="submit" className="b br" disabled={buscandoEnd}>{buscandoEnd ? 'Buscando…' : 'Ver os mais perto'}</button>
          </form>
          {erroEnd && <p style={{ margin: 0, color: '#FFB3AE', fontSize: 14 }}>{erroEnd}</p>}
          {meuLocal && !erroEnd && (
            <p style={{ margin: 0, fontSize: 14, color: '#C9C7C2' }}>
              Mostrando os prédios mais perto de “{endereco}”.{' '}
              <button type="button" onClick={limparEndereco} style={{ background: 'none', border: 0, color: '#fff', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', minHeight: 0, minWidth: 0, padding: 0, font: 'inherit' }}>Limpar</button>
            </p>
          )}
        </div>
      </section>

      <section style={{ paddingBlock: '24px 140px' }}>
        <div className="w loja-grid" style={{ maxWidth: 1400 }}>
          {/* lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <label style={{ flex: '1 1 200px' }}>
                <span className="sr-only">Filtrar por nome ou bairro</span>
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por nome ou bairro" className="campo" />
              </label>
              <select aria-label="Ordenar" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="campo" style={{ flex: '0 0 auto', width: 'auto', fontWeight: 700 }}>
                {meuLocal && <option value="perto">Mais perto de mim</option>}
                <option value="moradores">Mais moradores</option>
                <option value="preco">Menor preço</option>
                <option value="turistas">Com turistas</option>
                <option value="az">A a Z</option>
              </select>
            </div>
            {carregando && <p style={{ color: '#5A5852', margin: 0 }}>Carregando prédios…</p>}
            <div className="pcards">
              {lista.map(({ p, km }) => {
                const on = idsLista.has(p.id);
                const foto = p.imagem_principal ? getImageUrl(p.imagem_principal) : '';
                return (
                  <article key={p.id} className="pcard" style={{ borderColor: on ? '#EA251D' : undefined }}>
                    <button type="button" className="pcard-foto" onClick={() => abrir(p)} aria-label={`Ver detalhes de ${p.nome}`}>
                      {foto ? <img src={foto} alt="" loading="lazy" decoding="async" /> : <span className="pcard-sem">{p.nome}</span>}
                      <span style={{ position: 'absolute', left: 12, top: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {km !== null && <span className="selo selo-escuro">{fmtKm(km)} de você</span>}
                        {p.tem_airbnb && <span className="selo">Tem turistas</span>}
                      </span>
                    </button>
                    <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div>
                        <strong className="t" style={{ fontSize: 19, lineHeight: 1.2, display: 'block' }}>{p.nome}</strong>
                        <span style={{ fontSize: 14, color: '#5A5852' }}>{p.bairro}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#5A5852' }}>
                        <span><strong style={{ color: '#0B0B0D', fontSize: 15 }}>{telas(p)}</strong> {telas(p) > 1 ? 'telas' : 'tela'}</span>
                        {!!p.publico_estimado && <span><strong style={{ color: '#0B0B0D', fontSize: 15 }}>{num(p.publico_estimado)}</strong> moradores</span>}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ lineHeight: 1.1 }}>
                          <strong style={{ fontSize: 22, letterSpacing: '-.02em' }}>{reais(p.preco_base || 0)}</strong><span style={{ fontSize: 13, color: '#5A5852' }}>/mês</span>
                        </span>
                        <button className="b" type="button" onClick={() => alternar(p)} aria-pressed={on}
                          style={{ minHeight: 44, padding: '0 18px', fontSize: 15, background: on ? '#0B0B0D' : '#EA251D', color: '#fff' }}>{on ? 'Na lista ✓' : 'Adicionar'}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!carregando && !lista.length && <p style={{ color: '#5A5852' }}>Nenhum prédio com esse filtro.</p>}
          </div>

          {/* mapa do Google fixo ao lado (computador) */}
          <aside className="loja-mapa" aria-label="Mapa dos prédios">
            {!mapaCel && (
              <Suspense fallback={<div style={{ height: '100%', background: '#E2E0DA' }} />}>
                <MapaPredios predios={predios} naLista={idsLista} selecionado={aberto?.id} onAbrir={abrir} meuLocal={meuLocal} altura="100%" />
              </Suspense>
            )}
          </aside>
        </div>
      </section>

      <RodapeSite />
      <div style={{ height: 90 }} aria-hidden="true" />

      {/* barra flutuante da lista */}
      {!algumaJanela && (
        <div className="lista-flutuante" role="region" aria-label="Sua lista">
          <button type="button" className="lf-mapa" onClick={() => setMapaCel(true)} aria-label="Ver no mapa">
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
            <span>Mapa</span>
          </button>
          <button type="button" className="lf-lista" onClick={() => setGaveta(true)}>
            <span className="lf-num">{naLista.length}</span>
            <span style={{ textAlign: 'left', lineHeight: 1.25, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 15 }}>{naLista.length ? `${naLista.length} ${naLista.length > 1 ? 'prédios' : 'prédio'} na lista` : 'Sua lista está vazia'}</strong>
              <span style={{ fontSize: 13, color: '#C9C7C2' }}>{naLista.length ? `${reais(preco.pricePerMonth)}/mês · ${planoLabel}` : 'Adicione prédios para ver o valor'}</span>
            </span>
            <span className="lf-seta" aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* mapa em tela cheia (celular) */}
      {mapaCel && (
        <div role="dialog" aria-modal="true" aria-label="Mapa dos prédios" style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#0B0B0D', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', padding: '4px 6px' }}>
            <strong>Toque no preço para ver o prédio</strong>
            <button type="button" className="b bw" onClick={() => setMapaCel(false)} style={{ minHeight: 42, padding: '0 18px', fontSize: 15 }}>Fechar</button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Suspense fallback={null}>
              <MapaPredios predios={predios} naLista={idsLista} selecionado={aberto?.id} onAbrir={abrirDoMapaCel} meuLocal={meuLocal} altura="100%" />
            </Suspense>
          </div>
        </div>
      )}

      {/* gaveta da lista → Sofia */}
      {gaveta && (
        <div role="dialog" aria-modal="true" aria-label="Sua lista de prédios" className="gaveta-fundo">
          <button type="button" className="gaveta-fora" onClick={() => setGaveta(false)} aria-label="Fechar" />
          <div className="gaveta">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 className="t" style={{ fontSize: 30 }}>Sua lista</h2>
              <button type="button" onClick={() => setGaveta(false)} aria-label="Fechar" className="x">×</button>
            </div>
            {!naLista.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, color: '#5A5852' }}>Toque em “Adicionar” nos prédios ou nas etiquetas de preço do mapa.</p>
                <button type="button" className="b bk" onClick={() => setGaveta(false)}>Ver os prédios</button>
              </div>
            ) : (
              <>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {naLista.map((p) => (
                    <li key={p.id} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
                      <span style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: '#E2E0DA', display: 'block' }}>
                        {p.imagem_principal && <img src={getImageUrl(p.imagem_principal)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</strong>
                        <span style={{ fontSize: 13, color: '#5A5852' }}>{p.bairro} · {reais(p.preco_base || 0)}/mês</span>
                      </span>
                      <button type="button" onClick={() => removeFromCart(p.id, { silencioso: true })} aria-label={`Tirar ${p.nome} da lista`} className="tirar">Tirar</button>
                    </li>
                  ))}
                </ul>

                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: '#5A5852' }}>Por quanto tempo?</p>
                  <div className="planos" role="group" aria-label="Plano">
                    {PLANOS.map((pl) => {
                      const on = pl.m === plano;
                      const v = precoPor(pl.m);
                      return (
                        <button key={pl.m} type="button" aria-pressed={on} onClick={() => setPlano(pl.m)} className={on ? 'on' : ''}>
                          <strong>{pl.label}</strong>
                          <span>{reais(v.pricePerMonth)}/mês</span>
                          {pl.m > 1 && v.savings > 0 && <em>economia de {reais(v.savings)}</em>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, borderBlock: '1px solid #E2E0DA', paddingBlock: 14 }}>
                  <div><span className="t" style={{ display: 'block', fontSize: 26, color: '#EA251D' }}>{naLista.length}</span><span style={{ fontSize: 13, color: '#5A5852' }}>{naLista.length > 1 ? 'prédios' : 'prédio'}</span></div>
                  <div><span className="t" style={{ display: 'block', fontSize: 26 }}>{telasLista}</span><span style={{ fontSize: 13, color: '#5A5852' }}>{telasLista > 1 ? 'telas' : 'tela'}</span></div>
                  <div><span className="t" style={{ display: 'block', fontSize: 26 }}>{moradoresLista ? num(moradoresLista) : '—'}</span><span style={{ fontSize: 13, color: '#5A5852' }}>moradores</span></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 15, color: '#5A5852' }}>{plano === 1 ? 'Por mês' : `Por mês, no plano de ${plano} meses`}</span>
                  <span className="t" style={{ fontSize: 32 }}>{reais(preco.pricePerMonth)}</span>
                </div>
                {plano > 1 && <p style={{ margin: '-8px 0 0', fontSize: 14, color: '#5A5852' }}>Total de {reais(preco.totalPrice)} em {plano} meses.</p>}
              </>
            )}
            <a className="b wa" href={waSofia(msgSofia)} target="_blank" rel="noopener noreferrer" style={{ width: '100%', minHeight: 58, marginTop: 'auto' }}>
              <IconeWhats />{naLista.length ? 'Enviar minha lista para a Sofia' : 'Falar com a Sofia'}
            </a>
            <p style={{ margin: 0, fontSize: 13, color: '#77756F' }}>A Sofia recebe a sua lista no WhatsApp, confirma a disponibilidade, ajuda com o vídeo e fecha com você. Os valores do site são de referência.</p>
          </div>
        </div>
      )}

      {/* detalhe do prédio */}
      {aberto && (
        <div role="dialog" aria-modal="true" aria-label={aberto.nome} className="gaveta-fundo" style={{ zIndex: 70 }}>
          <button type="button" className="gaveta-fora" onClick={() => setAberto(null)} aria-label="Fechar" />
          <div className="gaveta" style={{ padding: 0, gap: 0 }}>
            <div style={{ position: 'relative', aspectRatio: '16/11', background: 'linear-gradient(180deg,#24242A,#3A1416)', flex: 'none' }}>
              {aberto.imagem_principal && <img src={getImageUrl(aberto.imagem_principal)} alt={`Fachada do ${aberto.nome}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="x" style={{ position: 'absolute', right: 14, top: 14 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 className="t" style={{ fontSize: 32 }}>{aberto.nome}</h2>
                <p style={{ margin: '4px 0 0', color: '#5A5852' }}>{aberto.endereco || aberto.bairro}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '16px 12px', borderBlock: '1px solid #E2E0DA', paddingBlock: 16 }}>
                <div><span className="t" style={{ display: 'block', fontSize: 28, color: '#EA251D' }}>{reais(aberto.preco_base || 0)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>por mês (mensal)</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 28 }}>{telas(aberto)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>{telas(aberto) > 1 ? 'telas' : 'tela'} no elevador</span></div>
                {!!aberto.publico_estimado && <div><span className="t" style={{ display: 'block', fontSize: 28 }}>{num(aberto.publico_estimado)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>moradores</span></div>}
                <div><span className="t" style={{ display: 'block', fontSize: 20 }}>{aberto.bairro}</span><span style={{ fontSize: 13, color: '#5A5852' }}>bairro</span></div>
              </div>
              {aberto.tem_airbnb && <p style={{ margin: 0, padding: '12px 14px', borderRadius: 12, background: '#F4F3F0', fontSize: 14 }}><strong>Tem apartamentos de temporada.</strong> A tela também é vista por turistas hospedados no prédio.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr)', gap: 16, alignItems: 'center' }}>
                <div style={{ borderRadius: 10, background: '#0B0B0D', padding: 5, aspectRatio: '9/16' }}>
                  <VideoLeve src="/site/tela-real.mp4" poster="/site/tela-real.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, display: 'block' }} aria-label="Exemplo do que passa nesta tela" />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#5A5852' }}>Na tela passam os avisos do prédio, notícias de Foz e do Brasil e os anúncios. O seu vídeo entra na janela do alto.</p>
              </div>
              <button className="b" type="button" onClick={() => alternar(aberto)} style={{ background: idsLista.has(aberto.id) ? '#0B0B0D' : '#EA251D', color: '#fff' }}>
                {idsLista.has(aberto.id) ? 'Na lista ✓ · tirar' : 'Adicionar à lista'}
              </button>
              {idsLista.has(aberto.id) && <button className="b bw" type="button" onClick={() => { setAberto(null); setGaveta(true); }} style={{ border: '1.5px solid #D2D0CB' }}>Ver minha lista</button>}
              <Link to="/" className="lk" style={{ alignSelf: 'flex-start', fontSize: 15 }}>Como funciona a EXA</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
