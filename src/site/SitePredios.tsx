import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CabecalhoSite, RodapeSite, BarraCelular, VideoLeve, IconeWhats, waSofia, useFonteSite, useTituloPagina } from './comum';
import { usePrediosPublicos } from './usePrediosPublicos';
import { useCart } from '@/contexts/SimpleCartContext';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { getImageUrl, type BuildingStore } from '@/services/buildingStoreService';
import { calculateBuildingsPrice, type PlanDuration } from '@/utils/buildingPriceUtils';

/** Prédios e preços (rota /loja) — Opção 2 com preço por prédio e a lista ligada ao checkout de sempre. */

const PLANOS: { m: PlanDuration; label: string; nota: string }[] = [
  { m: 1, label: 'Mensal', nota: 'sem fidelidade' },
  { m: 3, label: 'Trimestral', nota: 'com desconto' },
  { m: 6, label: 'Semestral', nota: 'com desconto' },
  { m: 12, label: 'Anual', nota: 'maior desconto' },
];
type Ordem = 'publico' | 'preco' | 'turistas' | 'az';

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: n % 1 ? 2 : 0 });
const num = (n: number) => Math.round(n).toLocaleString('pt-BR');

export default function SitePredios() {
  useFonteSite();
  useTituloPagina('Prédios e preços · EXA Mídia', 'Escolha os prédios de Foz do Iguaçu onde a sua marca vai aparecer. Veja telas, público e o preço por mês de cada um.');
  const navigate = useNavigate();
  const { predios, carregando, totalPredios, totalTelas } = usePrediosPublicos();
  const { cartItems, addToCart, removeFromCart, isItemInCart } = useCart() as any;
  const [ordem, setOrdem] = useState<Ordem>('publico');
  const [busca, setBusca] = useState('');
  const [plano, setPlano] = useState<PlanDuration>(3);
  const [aberto, setAberto] = useState<BuildingStore | null>(null);
  const [verMapa, setVerMapa] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const r = predios.filter((p) => !q || `${p.nome} ${p.bairro} ${p.endereco}`.toLowerCase().includes(q));
    const s = [...r];
    if (ordem === 'publico') s.sort((a, b) => (b.publico_estimado || 0) - (a.publico_estimado || 0));
    if (ordem === 'preco') s.sort((a, b) => (a.preco_base || 0) - (b.preco_base || 0));
    if (ordem === 'turistas') s.sort((a, b) => Number(!!b.tem_airbnb) - Number(!!a.tem_airbnb) || (b.publico_estimado || 0) - (a.publico_estimado || 0));
    if (ordem === 'az') s.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return s;
  }, [predios, busca, ordem]);

  const naLista: BuildingStore[] = useMemo(() => {
    const ids = new Set<string>((cartItems || []).map((i: any) => i.panel?.id));
    return predios.filter((p) => ids.has(p.id));
  }, [cartItems, predios]);
  const ordemNaLista = (id: string) => naLista.findIndex((p) => p.id === id) + 1;

  const preco = useMemo(() => calculateBuildingsPrice(naLista as any, plano), [naLista, plano]);
  const telasLista = naLista.reduce((s, p) => s + (p.quantidade_telas || 1), 0);
  const publicoLista = naLista.reduce((s, p) => s + (p.publico_estimado || 0), 0);

  const alternar = (p: BuildingStore) => {
    if (isItemInCart(p.id)) removeFromCart(p.id);
    else addToCart(adaptBuildingToPanel(p), 30);
  };
  const waLista = waSofia(`Oi Sofia! Montei minha lista no site e quero anunciar nestes prédios: ${naLista.map((p) => p.nome).join(', ')}.`);
  const continuar = () => navigate('/selecionar-plano');

  const pinos = predios.filter((p) => p.latitude && p.longitude).map((p) => ({
    p, x: ((p.longitude + 54.596) / 0.028) * 100, y: ((p.latitude + 25.505) / -0.058) * 100,
  })).filter((m) => m.x > 1 && m.x < 99 && m.y > 1 && m.y < 99);

  const Mapa = ({ alto }: { alto?: boolean }) => (
    <div style={{ position: 'relative', aspectRatio: alto ? '.6' : '.62', borderRadius: 20, background: '#E2E0DA', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #D2D0CB' }} aria-label="Mapa dos prédios">
      <svg viewBox="0 0 100 155" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <path d="M-2 0 C 6 30, 2 60, 8 90 S 4 140, 14 160 L -2 160 Z" fill="#C9D6DC" />
        <path d="M48 0 C 46 50, 44 100, 47 155" stroke="#fff" strokeWidth="2" fill="none" />
        <path d="M0 70 C 40 72, 70 66, 100 60" stroke="#fff" strokeWidth="2" fill="none" />
      </svg>
      <span style={{ position: 'absolute', left: '56%', top: '50%', fontSize: 11, fontWeight: 800, color: '#77756F' }}>Centro</span>
      {pinos.map(({ p, x, y }) => {
        const n = ordemNaLista(p.id);
        return (
          <button key={p.id} type="button" onClick={() => setAberto(p)} aria-label={p.nome} title={p.nome}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', width: n ? 22 : 14, height: n ? 22 : 14, borderRadius: '50%', border: 0, padding: 0, cursor: 'pointer', background: '#EA251D', color: '#fff', font: '800 10px Manrope,sans-serif', boxShadow: '0 0 0 3px rgba(234,37,29,.22)' }}>
            {n || ''}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="exa-site com-barra" style={{ background: '#EFEEEB' }}>
      <CabecalhoSite acao={<a className="b br" href="#lista" style={{ minHeight: 42, padding: '0 18px', fontSize: 15 }}>Minha lista · {naLista.length}</a>} />

      <section style={{ background: '#0B0B0D', color: '#fff', paddingBlock: '40px 36px' }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 className="t" style={{ fontSize: 'clamp(34px,5vw,48px)' }}>Escolha os seus prédios.</h1>
          <p style={{ margin: 0, color: '#9C9A96', fontSize: 15, fontWeight: 700 }}>
            {carregando ? 'Carregando prédios…' : `${totalPredios} prédios no ar em Foz do Iguaçu · ${totalTelas} telas · preço por mês de cada um`}
          </p>
        </div>
      </section>

      <section style={{ paddingBlock: '28px 120px' }}>
        <div className="w predios-grid">
          {/* lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <label style={{ position: 'relative', flex: '1 1 220px' }}>
                <span className="sr-only">Buscar prédio ou bairro</span>
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prédio ou bairro"
                  style={{ width: '100%', minHeight: 44, borderRadius: 999, border: '1.5px solid #D2D0CB', background: '#fff', padding: '0 18px', font: '600 15px Manrope,sans-serif' }} />
              </label>
              {([['publico', 'Mais público'], ['preco', 'Menor preço'], ['turistas', 'Com turistas'], ['az', 'A a Z']] as [Ordem, string][]).map(([id, label]) => (
                <button key={id} type="button" className="chip" aria-pressed={ordem === id} onClick={() => setOrdem(id)}
                  style={{ minHeight: 40, fontSize: 14, background: ordem === id ? '#0B0B0D' : '#fff', color: ordem === id ? '#fff' : '#0B0B0D', border: `1.5px solid ${ordem === id ? '#0B0B0D' : '#D2D0CB'}` }}>{label}</button>
              ))}
              <button type="button" className="chip so-celular" onClick={() => setVerMapa((v) => !v)}
                style={{ minHeight: 40, fontSize: 14, background: '#fff', border: '1.5px solid #D2D0CB' }}>{verMapa ? 'Ver lista' : 'Ver no mapa'}</button>
            </div>

            {verMapa && <div className="so-celular" style={{ display: 'block', maxWidth: 420, margin: '0 auto', width: '100%' }}><Mapa alto /></div>}

            {carregando && <p style={{ color: '#5A5852' }}>Carregando prédios…</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,250px),1fr))', gap: 16 }}>
              {lista.map((p) => {
                const on = isItemInCart(p.id);
                const foto = p.imagem_principal ? getImageUrl(p.imagem_principal) : '';
                return (
                  <article key={p.id} style={{ display: 'flex', flexDirection: 'column', borderRadius: 18, background: '#fff', overflow: 'hidden', border: `1.5px solid ${on ? '#EA251D' : '#E2E0DA'}` }}>
                    <button type="button" onClick={() => setAberto(p)} aria-label={`Ver detalhes de ${p.nome}`}
                      style={{ position: 'relative', aspectRatio: '4/3', background: 'linear-gradient(180deg,#24242A,#3A1416)', border: 0, padding: 0, cursor: 'pointer', display: 'block', width: '100%', overflow: 'hidden' }}>
                      {foto && <img src={foto} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      {p.tem_airbnb && <span style={{ position: 'absolute', left: 12, top: 12, background: '#fff', color: '#0B0B0D', padding: '5px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Tem turistas</span>}
                    </button>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong className="t" style={{ fontSize: 20, lineHeight: 1.15 }}>{p.nome}</strong>
                        <span style={{ fontSize: 14, color: '#5A5852' }}>{p.bairro}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, fontSize: 13, color: '#5A5852' }}>
                        <span><strong style={{ display: 'block', fontSize: 17, color: '#0B0B0D' }}>{p.quantidade_telas || 1}</strong>{(p.quantidade_telas || 1) > 1 ? 'telas' : 'tela'}</span>
                        <span><strong style={{ display: 'block', fontSize: 17, color: '#0B0B0D' }}>{p.publico_estimado ? num(p.publico_estimado) : '—'}</strong>pessoas/mês</span>
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ lineHeight: 1.1 }}><strong style={{ fontSize: 22, letterSpacing: '-.02em' }}>{reais(p.preco_base || 0)}</strong><span style={{ fontSize: 13, color: '#5A5852' }}>/mês</span></span>
                        <button className="b" type="button" onClick={() => alternar(p)} aria-pressed={on}
                          style={{ minHeight: 44, padding: '0 16px', fontSize: 15, background: on ? '#0B0B0D' : '#fff', color: on ? '#fff' : '#0B0B0D', border: `1.5px solid ${on ? '#0B0B0D' : '#D2D0CB'}` }}>{on ? 'Na lista ✓' : 'Adicionar'}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!carregando && !lista.length && <p style={{ color: '#5A5852' }}>Nenhum prédio com essa busca.</p>}
          </div>

          {/* mapa + lista (coluna da direita) */}
          <aside id="lista" className="predios-lado" aria-label="Sua lista de prédios">
            <div className="so-desktop"><Mapa /></div>
            <div style={{ borderRadius: 22, background: '#0B0B0D', color: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 className="t" style={{ fontSize: 28 }}>Sua lista</h2>
              {!naLista.length && <p style={{ margin: 0, color: '#9C9A96', fontSize: 16 }}>Toque em “Adicionar” nos prédios ou nos pinos do mapa.</p>}
              {!!naLista.length && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflow: 'auto' }}>
                  {naLista.map((p) => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', fontSize: 15, borderBottom: '1px solid #1C1C20', paddingBottom: 8 }}>
                      <span>{p.nome} <span style={{ color: '#77756F' }}>· {reais(p.preco_base || 0)}</span></span>
                      <button type="button" onClick={() => removeFromCart(p.id)} aria-label={`Remover ${p.nome}`} style={{ background: 'none', border: 0, color: '#9C9A96', cursor: 'pointer', font: 'inherit', minHeight: 32 }}>Remover</button>
                    </li>
                  ))}
                </ul>
              )}
              <div role="group" aria-label="Plano" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                {PLANOS.map((pl) => {
                  const on = pl.m === plano;
                  return (
                    <button key={pl.m} type="button" aria-pressed={on} onClick={() => setPlano(pl.m)}
                      style={{ textAlign: 'left', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', font: 'inherit', background: on ? '#fff' : '#141418', color: on ? '#0B0B0D' : '#fff', border: `1.5px solid ${on ? '#fff' : '#2A2A30'}` }}>
                      <strong style={{ display: 'block', fontSize: 15 }}>{pl.label}</strong>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{pl.nota}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, borderTop: '1px solid #1C1C20', paddingTop: 14 }}>
                <div><span className="t" style={{ display: 'block', fontSize: 28, color: '#EA251D' }}>{naLista.length}</span><span style={{ fontSize: 13, color: '#9C9A96' }}>prédios</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 28 }}>{telasLista}</span><span style={{ fontSize: 13, color: '#9C9A96' }}>telas</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 28 }}>{publicoLista ? num(publicoLista) : '—'}</span><span style={{ fontSize: 13, color: '#9C9A96' }}>pessoas/mês</span></div>
              </div>
              {!!naLista.length && (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#9C9A96' }}>{plano === 1 ? 'Por mês' : `Por mês no plano de ${plano} meses`}</span>
                  <span className="t" style={{ fontSize: 30 }}>{reais(preco.pricePerMonth)}</span>
                </div>
              )}
              {!!naLista.length && plano > 1 && <p style={{ margin: 0, fontSize: 13, color: '#9C9A96' }}>Total {reais(preco.totalPrice)} em {plano} meses · economia de {reais(preco.savings || 0)}. Vídeo incluso.</p>}
              <button className="b br" type="button" onClick={continuar} disabled={!naLista.length} style={{ width: '100%', opacity: naLista.length ? 1 : 0.5 }}>Continuar para o pedido</button>
              <a className="b" href={naLista.length ? waLista : waSofia()} style={{ width: '100%', background: '#141418', color: '#fff', border: '1.5px solid #2A2A30' }}><IconeWhats />Fechar com a Sofia no WhatsApp</a>
              <p style={{ margin: 0, fontSize: 13, color: '#9C9A96' }}>No pedido você confirma o plano, cria a conta e paga por PIX, boleto ou cartão. A Sofia também fecha pelo WhatsApp e cria o vídeo com você.</p>
            </div>
          </aside>
        </div>
      </section>

      <RodapeSite />

      <BarraCelular>
        <span style={{ lineHeight: 1.2, color: '#fff' }}>
          <strong>{naLista.length} na lista</strong>
          <span style={{ display: 'block', fontSize: 12, color: '#9C9A96' }}>{naLista.length ? `${reais(preco.pricePerMonth)}/mês · ${telasLista} telas` : 'Adicione prédios'}</span>
        </span>
        <button className="b br" type="button" onClick={continuar} disabled={!naLista.length} style={{ minHeight: 46, opacity: naLista.length ? 1 : 0.5 }}>Continuar</button>
      </BarraCelular>

      {aberto && (
        <div role="dialog" aria-modal="true" aria-label={aberto.nome} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(11,11,13,.55)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" style={{ flex: 1, background: 'none', border: 0, cursor: 'pointer' }} />
          <div style={{ width: 'min(100%,480px)', height: '100%', overflow: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', aspectRatio: '16/11', background: 'linear-gradient(180deg,#24242A,#3A1416)' }}>
              {aberto.imagem_principal && <img src={getImageUrl(aberto.imagem_principal)} alt={`Fachada do ${aberto.nome}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" style={{ position: 'absolute', right: 14, top: 14, width: 44, height: 44, borderRadius: '50%', border: 0, background: '#fff', cursor: 'pointer', font: '800 20px Manrope,sans-serif' }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 className="t" style={{ fontSize: 36 }}>{aberto.nome}</h2>
                <p style={{ margin: '4px 0 0', color: '#5A5852' }}>{aberto.endereco || aberto.bairro} · Foz do Iguaçu</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '16px 12px', borderBlock: '1px solid #E2E0DA', paddingBlock: 18 }}>
                <div><span className="t" style={{ display: 'block', fontSize: 34, color: '#EA251D' }}>{reais(aberto.preco_base || 0)}</span><span style={{ fontSize: 13, color: '#5A5852' }}>por mês</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 34 }}>{aberto.quantidade_telas || 1}</span><span style={{ fontSize: 13, color: '#5A5852' }}>{(aberto.quantidade_telas || 1) > 1 ? 'telas' : 'tela'} no elevador</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 34 }}>{aberto.publico_estimado ? num(aberto.publico_estimado) : '—'}</span><span style={{ fontSize: 13, color: '#5A5852' }}>pessoas por mês</span></div>
                <div><span className="t" style={{ display: 'block', fontSize: 22 }}>{aberto.bairro}</span><span style={{ fontSize: 13, color: '#5A5852' }}>bairro</span></div>
              </div>
              {aberto.tem_airbnb && <p style={{ margin: 0, padding: '12px 14px', borderRadius: 12, background: '#EFEEEB', fontSize: 14 }}><strong>Tem apartamentos de temporada.</strong> A tela também é vista por turistas hospedados no prédio.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: 16, alignItems: 'center' }}>
                <div style={{ borderRadius: 10, background: '#0B0B0D', padding: 5, aspectRatio: '9/16' }}>
                  <VideoLeve src="/site/tela-real.mp4" poster="/site/tela-real.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, display: 'block' }} aria-label="O que passa nesta tela" />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#5A5852' }}>Nesta tela passam os avisos do prédio, notícias de Foz e do Brasil, a câmera da ponte e os anúncios. O seu vídeo entra na janela do alto.</p>
              </div>
              <button className="b" type="button" onClick={() => alternar(aberto)}
                style={{ background: isItemInCart(aberto.id) ? '#0B0B0D' : '#EA251D', color: '#fff' }}>{isItemInCart(aberto.id) ? 'Na lista ✓ (tirar)' : 'Adicionar à lista'}</button>
              <Link to="/" className="lk" style={{ alignSelf: 'flex-start', fontSize: 15 }}>Como funciona a EXA</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
