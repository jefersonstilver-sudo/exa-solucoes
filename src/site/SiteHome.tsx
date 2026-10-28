import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CabecalhoSite, RodapeSite, BarraCelular, VideoLeve, IconeWhats, waSofia, useFonteSite, useTituloPagina } from './comum';
import { usePrediosPublicos } from './usePrediosPublicos';
import { supabase } from '@/integrations/supabase/client';

/** Home do site público — Opção 2 aprovada (28/10/2026). Leve: só CSS, vídeos tocam quando aparecem. */

const CLIENTES = [
  { nome: 'Del Fuego', seg: 'Pizzeria e Pastas', arq: 'del-fuego' },
  { nome: 'Oral Implant', seg: 'Odontologia', arq: 'oral-implant' },
  { nome: 'Cine Cataratas', seg: 'Cinema', arq: 'cine-cataratas' },
  { nome: 'Óticas Samir', seg: 'Ótica', arq: 'oticas-samir' },
  { nome: 'Wizard', seg: 'Escola de idiomas', arq: 'wizard' },
  { nome: 'Kammer Soho', seg: 'Construtora', arq: 'kammer-soho' },
  { nome: 'Neo Hair', seg: 'Clínica capilar', arq: 'neo-hair' },
  { nome: 'Lolita', seg: 'Moda', arq: 'lolita' },
];

const CAPITULOS = [
  { title: 'Notícias de Foz e do Brasil', text: 'Todo dia, com o Portal da Cidade e a CNN Brasil. O conteúdo muda sempre, então a tela nunca fica repetida.', hl: { left: '1%', top: '1%', width: '98%', height: '46%' } },
  { title: 'A ponte ao vivo, o clima e a hora', text: 'A câmera da Ponte da Amizade e a previsão do tempo. O morador confere antes de sair de casa.', hl: { left: '51%', top: '48.5%', width: '47.5%', height: '33%' } },
  { title: 'Os avisos do prédio', text: 'Assembleia, manutenção, falta de água. O síndico publica pelo WhatsApp, e todo morador vê.', hl: { left: '1.5%', top: '48.5%', width: '48%', height: '50%' } },
  { title: 'E a sua marca, entre eles', text: 'Seu vídeo passa no alto da tela, em sequência com as notícias, o dia todo, todos os dias.', hl: { left: '1%', top: '1%', width: '98%', height: '46%' } },
];

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TURNOS = [
  { label: 'Manhã', hora: '08:15', text: 'Bom dia, vizinho.', bg: '#9E1014' },
  { label: 'Tarde', hora: '14:40', text: 'Passa aqui na volta.', bg: '#1C1C20' },
  { label: 'Noite', hora: '19:30', text: 'Peça agora pelo QR.', bg: '#EA251D' },
];

const FAQ = () => [
  { q: 'Quantos prédios vocês têm?', a: 'A rede está em prédios residenciais de Foz do Iguaçu e cresce todo mês. Você escolhe em quais aparecer e vê o preço de cada um na página de prédios.' },
  { q: 'Não tenho fotos nem vídeos. E agora?', a: 'A EXA cria o vídeo com você. Basta a sua logo e o que você quer destacar. São até 5 vídeos novos por mês.' },
  { q: 'Quanto custa?', a: 'Cada prédio tem o seu valor mensal, que aparece na página de prédios. Planos de 3, 6 e 12 meses têm desconto. Você monta a sua lista no site e envia para a Sofia no WhatsApp, que fecha com você.' },
  { q: 'O vídeo tem som?', a: 'Não. A tela do elevador é muda, então o vídeo é feito para funcionar só com imagem e texto grande.' },
  { q: 'Como sei que o meu anúncio está passando?', a: 'Na sua área de anunciante você vê a tela de cada prédio ao vivo.' },
];

type ClienteReal = { nome: string; segmento: string | null; video: string };

/** Vídeos reais que estão no ar nos pedidos ativos (função site-clientes-videos). */
function useClientesReais() {
  const [lista, setLista] = useState<ClienteReal[] | null>(null);
  useEffect(() => {
    let vivo = true;
    supabase.functions.invoke('site-clientes-videos', { body: {} })
      .then(({ data }) => { if (vivo) setLista(Array.isArray(data?.clientes) ? data.clientes : []); })
      .catch(() => { if (vivo) setLista([]); });
    return () => { vivo = false; };
  }, []);
  return lista;
}

export default function SiteHome() {
  useFonteSite();
  useTituloPagina('EXA Mídia · Sua marca no elevador dos prédios de Foz do Iguaçu', 'Telas nos elevadores de prédios residenciais de Foz do Iguaçu. Escolha os prédios, veja o preço e a Sofia cria o seu vídeo.');
  const { predios } = usePrediosPublicos();

  const agora = new Date();
  const [cap, setCap] = useState(0);
  const [auto, setAuto] = useState(true);
  const [dia, setDia] = useState(agora.getDay());
  const [turno, setTurno] = useState(agora.getHours() < 12 ? 0 : agora.getHours() < 18 ? 1 : 2);
  const trilho = useRef<HTMLDivElement>(null);
  const reais = useClientesReais();
  // enquanto carrega (ou se a função falhar) mostra os anúncios gravados das telas
  const clientes = reais && reais.length
    ? reais.map((c) => ({ nome: c.nome, seg: c.segmento || 'No ar agora', src: c.video, poster: undefined as string | undefined }))
    : CLIENTES.map((c) => ({ nome: c.nome, seg: c.seg, src: `/site/cliente-${c.arq}.mp4`, poster: `/site/cliente-${c.arq}.jpg` }));

  useEffect(() => {
    let reduz = false;
    try { reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* */ }
    if (reduz || !auto) return;
    const t = setInterval(() => setCap((c) => (c + 1) % CAPITULOS.length), 4500);
    return () => clearInterval(t);
  }, [auto]);

  // âncoras (#como, #faq) vindas de outras páginas
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  const mover = (dir: number) => {
    const t = trilho.current;
    if (!t) return;
    const card = t.querySelector('.cc') as HTMLElement | null;
    const passo = card ? card.getBoundingClientRect().width + 16 : 300;
    const max = t.scrollWidth - t.clientWidth;
    let nx = t.scrollLeft + dir * passo;
    if (dir > 0 && t.scrollLeft >= max - 4) nx = 0;
    if (dir < 0 && t.scrollLeft <= 4) nx = max;
    t.scrollTo({ left: nx, behavior: 'smooth' });
  };

  const pinos = useMemo(() => predios
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({ nome: p.nome, x: ((p.longitude + 54.596) / 0.028) * 100, y: ((p.latitude + 25.505) / -0.058) * 100, grande: (p.quantidade_telas || 1) > 1 }))
    .filter((p) => p.x > 2 && p.x < 98 && p.y > 2 && p.y < 98), [predios]);

  const tt = TURNOS[turno];
  const resumo = 'Prédios residenciais de Foz do Iguaçu';

  return (
    <div className="exa-site com-barra">
      <CabecalhoSite />

      {/* 1 HERO */}
      <section id="topo" style={{ background: '#0B0B0D', color: '#fff', paddingBlock: '80px 104px' }}>
        <div className="w hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
            <h1 className="t h1">Sua marca no elevador de quem compra de você. Todo dia.</h1>
            <p className="sub" style={{ color: '#C9C7C2', fontSize: 21 }}>
              Telas nos elevadores de prédios residenciais de Foz do Iguaçu. Você escolhe os prédios, vê o preço e a Sofia cria o seu vídeo. Ele entra no ar no mesmo dia.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 26px', alignItems: 'center' }}>
              <Link className="b br" to="/loja">Ver prédios e preços</Link>
              <a className="lk" href={waSofia()} style={{ color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconeWhats />Falar com a Sofia</a>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: '#8E8C87' }}>{resumo}</p>
          </div>
          <figure className="monw" style={{ margin: '0 auto', width: '100%', maxWidth: 360, position: 'relative' }}>
            <div className="mon boot"><div className="scr">
              <video src="/site/tela-real.mp4" poster="/site/tela-real.jpg" autoPlay muted loop playsInline preload="metadata" aria-label="Gravação real de uma tela EXA" />
            </div></div>
            <span className="corner c1" aria-hidden="true" /><span className="corner c2" aria-hidden="true" />
            <figcaption style={{ marginTop: 30, fontSize: 13, color: '#77756F', textAlign: 'center' }}>Gravação real de uma tela EXA</figcaption>
          </figure>
        </div>
      </section>

      {/* 2 CLIENTES */}
      <section className="sec" style={{ paddingBottom: 72 }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="t h2" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>Alguns dos nossos clientes</h2>
              <p style={{ margin: 0, fontSize: 16, color: '#77756F' }}>Os anúncios que estão passando agora nas telas da EXA.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="arr" type="button" onClick={() => mover(-1)} aria-label="Clientes anteriores"><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
              <button className="arr" type="button" onClick={() => mover(1)} aria-label="Próximos clientes"><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <div className="track" ref={trilho} role="list" aria-label="Clientes da EXA">
            {clientes.map((c) => (
              <figure className="cc" role="listitem" key={c.nome}>
                <div className="fr"><VideoLeve src={c.src} poster={c.poster} preload="metadata" aria-label={`Anúncio ${c.nome}`} /></div>
                <figcaption style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <strong style={{ fontSize: 17, fontWeight: 800 }}>{c.nome}</strong>
                  <span style={{ fontSize: 14, color: '#77756F' }}>{c.seg}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 3 POR QUE O MORADOR OLHA */}
      <section id="como" className="sec" style={{ background: '#0B0B0D', color: '#fff' }}>
        <div className="w story">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="mon" style={{ width: '100%', maxWidth: 340 }}><div className="scr">
              <VideoLeve src="/site/tela-real.mp4" poster="/site/tela-real.jpg" aria-hidden="true" />
              <span className="hl" style={CAPITULOS[cap].hl} />
            </div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <h2 className="t h2" style={{ marginBottom: 22 }}>O morador olha porque a tela é útil.</h2>
            {CAPITULOS.map((c, i) => {
              const on = i === cap;
              return (
                <button key={c.title} className="chap" type="button" aria-pressed={on} onClick={() => { setCap(i); setAuto(false); }}
                  style={{ borderLeftColor: on ? '#EA251D' : '#2A2A30', opacity: on ? 1 : 0.45 }}>
                  <strong style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{c.title}</strong>
                  <span style={{ color: '#C9C7C2', fontSize: 17, maxWidth: '30em' }}>{c.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 NÃO TEM VÍDEO */}
      <section className="sec" style={{ background: '#EFEEEB' }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 className="t h2">Não tem vídeo? A gente faz.</h2>
            <p className="sub">A Sofia, atendente da EXA no WhatsApp, cria o vídeo com você. Sem agência, sem câmera, sem arquivo no formato errado.</p>
          </div>
          <ol className="steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li className="st">
              <span style={{ fontWeight: 800, color: '#EA251D', fontSize: 15 }}>1 · Conte o que quer anunciar</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <span className="bub" style={{ alignSelf: 'flex-end', background: '#DCF8C6' }}>Pior que eu não tenho fotos e vídeos.</span>
                <span className="bub" style={{ alignSelf: 'flex-start', background: '#F4F3F0' }}>Sem problema! Me manda sua logo e me conta o que você quer destacar.</span>
              </div>
            </li>
            <li className="st">
              <span style={{ fontWeight: 800, color: '#EA251D', fontSize: 15 }}>2 · Receba o vídeo pronto</span>
              <span style={{ fontSize: 17, color: '#3A3A42' }}>Em 10 a 15 minutos, com a sua marca e animação. Você pede até 3 ajustes em cada vídeo.</span>
              <div style={{ marginTop: 'auto', borderRadius: 12, overflow: 'hidden', aspectRatio: '6/5', background: '#0B0B0D' }}>
                <VideoLeve src="/site/cliente-del-fuego.mp4" poster="/site/cliente-del-fuego.jpg" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} aria-label="Anúncio real criado para a Del Fuego" />
              </div>
            </li>
            <li className="st">
              <span style={{ fontWeight: 800, color: '#EA251D', fontSize: 15 }}>3 · Aprovou, está no ar</span>
              <span style={{ fontSize: 17, color: '#3A3A42' }}>No mesmo dia, nos prédios que você escolheu. O QR code do anúncio leva o morador direto ao seu WhatsApp ou Instagram.</span>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, background: '#F4F3F0', padding: 16 }}>
                <span className="live" style={{ width: 12, height: 12, borderRadius: '50%', background: '#1F9D55', flex: 'none' }} />
                <span style={{ fontSize: 15, fontWeight: 800 }}>No ar · {predios.slice(0, 3).map((p) => p.nome).join(', ') || 'Vila Appia, Saint Peter, Luiz XV'}</span>
              </div>
            </li>
          </ol>
          <p style={{ margin: 0, fontSize: 16, color: '#55545A' }}>Até 5 vídeos novos por mês, criados pela EXA.</p>
        </div>
      </section>

      {/* 5 TODO DIA */}
      <section className="sec">
        <div className="w two">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <h2 className="t h2">Fale com ele todo dia. Do jeito certo para cada hora.</h2>
            <p className="sub">Um vídeo para a manhã, outro para a noite. Uma oferta na quarta, outra no fim de semana. A marca nunca vira paisagem.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="chips" role="group" aria-label="Dia da semana">
                {[1, 2, 3, 4, 5, 6, 0].map((i) => (
                  <button key={i} className="chip" type="button" aria-pressed={i === dia} onClick={() => setDia(i)}
                    style={{ background: i === dia ? '#0B0B0D' : '#EFEEEB', color: i === dia ? '#fff' : '#0B0B0D' }}>{DIAS_CURTOS[i]}</button>
                ))}
              </div>
              <div className="chips" role="group" aria-label="Turno">
                {TURNOS.map((u, i) => (
                  <button key={u.label} className="chip" type="button" aria-pressed={i === turno} onClick={() => setTurno(i)}
                    style={{ background: i === turno ? '#EA251D' : '#EFEEEB', color: i === turno ? '#fff' : '#0B0B0D' }}>{u.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <div className="mon" style={{ width: '100%', maxWidth: 330, boxShadow: '0 0 0 1px #2A2A30,0 50px 90px -50px rgba(11,11,13,.6)' }}>
              <div className="scr" style={{ display: 'flex', flexDirection: 'column', background: '#0B0B0D' }}>
                <div style={{ aspectRatio: '1080/890', width: '100%', background: tt.bg, color: '#fff', padding: '9%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'background .5s' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>{DIAS[dia]} · {tt.label}</span>
                  <span className="t" style={{ fontSize: 34 }}>{tt.text}</span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800 }}>Sua marca aqui</span>
                    <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 6, background: '#fff', backgroundImage: 'repeating-linear-gradient(90deg,#0B0B0D 0 4px,transparent 4px 8px),repeating-linear-gradient(0deg,#0B0B0D 0 4px,transparent 4px 8px)', backgroundBlendMode: 'multiply', border: '4px solid #fff' }} />
                  </span>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4%', padding: '4%' }}>
                  <div style={{ borderRadius: 6, background: '#fff', color: '#0B0B0D', padding: '8%', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#EA251D' }}>Avisos do prédio</span>
                    <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>Limpeza da caixa d'água</span>
                    <span style={{ fontSize: 10, lineHeight: 1.3 }}>Quinta, das 8h às 12h.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6%' }}>
                    <div style={{ flex: 1, borderRadius: 6, background: 'linear-gradient(160deg,#3B4A57,#1C1C20)', padding: '8%', display: 'flex', alignItems: 'flex-end', color: '#fff' }}><span style={{ fontSize: 10, fontWeight: 800 }}>Ponte da Amizade · ao vivo</span></div>
                    <div style={{ flex: 1, borderRadius: 6, background: '#1C1C20', padding: '8%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff' }}>
                      <span style={{ fontSize: 22, fontWeight: 800 }}>{tt.hora}</span>
                      <span style={{ fontSize: 10, color: '#9C9A96' }}>{DIAS[dia]} · 27°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 TELA AO VIVO */}
      <section className="sec" style={{ background: '#EFEEEB' }}>
        <div className="w two">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <h2 className="t h2">Veja a sua tela ao vivo.</h2>
            <p className="sub">Na sua área de anunciante, cada prédio abre a tela como ela está agora: o seu anúncio, a programação da semana, as notícias e a câmera da ponte.</p>
            <div><Link className="lk" to="/login">Entrar na minha área</Link></div>
          </div>
          <div role="img" aria-label="Área do anunciante com a tela de um prédio ao vivo"
            style={{ borderRadius: 20, background: '#fff', boxShadow: '0 40px 80px -40px rgba(11,11,13,.35),0 0 0 1px #E4E2DD', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,190px)' }}>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', background: '#0B0B0D' }}>
              <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <strong style={{ fontSize: 15 }}>{predios[0]?.nome || 'Vila Appia'}</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, background: '#EA251D', borderRadius: 99, padding: '4px 10px' }}><span className="live" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />Ao vivo</span>
              </div>
              <div className="mon" style={{ width: '100%', maxWidth: 200, boxShadow: 'none', padding: '4%' }}><div className="scr"><VideoLeve src="/site/tela-real.mp4" poster="/site/tela-real.jpg" aria-hidden="true" /></div></div>
            </div>
            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              <strong style={{ fontSize: 13, color: '#77756F', marginBottom: 6 }}>Seus prédios</strong>
              {(predios.length ? predios.slice(0, 4).map((p) => p.nome) : ['Vila Appia', 'Saint Peter', 'Luiz XV', 'Foz Residence']).map((n, i) => (
                <span key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: i === 0 ? '#EFEEEB' : undefined, fontWeight: i === 0 ? 800 : 500 }}>{n}<span style={{ color: '#1F9D55' }} aria-hidden="true">●</span></span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7 PRÉDIOS */}
      <section className="sec">
        <div className="w two">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <h2 className="t h2">Escolha os prédios mais perto de você.</h2>
            <p className="sub">Do Centro ao Jardim Central, da Vila Yolanda às Três Fronteiras. Veja cada prédio no mapa, com quantas telas tem e o preço por mês.</p>
            <div><Link className="b br" to="/loja">Ver prédios e preços</Link></div>
          </div>
          <div style={{ justifySelf: 'center', width: '100%', maxWidth: 380 }}>
            <div style={{ position: 'relative', aspectRatio: '1/1.55', borderRadius: 24, background: '#EFEEEB', overflow: 'hidden' }} role="img" aria-label="Mapa de Foz do Iguaçu com os prédios da rede EXA">
              <svg viewBox="0 0 100 155" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
                <path d="M-2 0 C 6 30, 2 60, 8 90 S 4 140, 14 160 L -2 160 Z" fill="#D3DEE3" />
                <path d="M0 150 C 30 146, 60 152, 102 147 L102 160 L0 160 Z" fill="#D3DEE3" />
                <path d="M48 0 C 46 50, 44 100, 47 155" stroke="#fff" strokeWidth="2" fill="none" />
                <path d="M0 70 C 40 72, 70 66, 100 60" stroke="#fff" strokeWidth="2" fill="none" />
              </svg>
              <span style={{ position: 'absolute', left: '56%', top: '52%', fontSize: 12, fontWeight: 800, color: '#8E8C87' }}>Centro</span>
              <span style={{ position: 'absolute', left: '58%', top: '16%', fontSize: 12, fontWeight: 800, color: '#8E8C87' }}>Jardim Central</span>
              <span style={{ position: 'absolute', left: '60%', top: '85%', fontSize: 12, fontWeight: 800, color: '#8E8C87' }}>Vila Yolanda</span>
              {pinos.map((p) => <span key={p.nome} className={p.grande ? 'pin big' : 'pin'} style={{ left: `${p.x}%`, top: `${p.y}%` }} title={p.nome} />)}
            </div>
          </div>
        </div>
      </section>

      {/* 8 QUANTO CUSTA */}
      <section className="sec" style={{ background: '#0B0B0D', color: '#fff', textAlign: 'center' }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center', maxWidth: 820 }}>
          <h2 className="t h2">Quanto custa?</h2>
          <p style={{ margin: 0, fontSize: 21, color: '#C9C7C2', maxWidth: '30em' }}>Cada prédio tem o seu preço por mês, com o vídeo incluso. Planos de 3, 6 e 12 meses saem mais baratos. Você vê os preços aqui e fecha com a Sofia no WhatsApp.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <Link className="b br" to="/loja">Ver o preço de cada prédio</Link>
            <a className="b bw" href={waSofia('Oi Sofia, quanto custa anunciar?')}>Perguntar à Sofia</a>
          </div>
        </div>
      </section>

      {/* 9 SOBRE */}
      <section className="sec" style={{ paddingBottom: 72 }}>
        <div className="w two" style={{ alignItems: 'start' }}>
          <h2 className="t h2" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>Uma empresa de Foz.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#3A3A42' }}>A EXA Mídia é da Indexa Mídia LTDA, com escritório na Av. Paraná, 974, no Centro. A equipe técnica, comercial e de tecnologia está aqui na cidade.</p>
            <p style={{ margin: 0, color: '#3A3A42' }}>As notícias da tela são feitas em parceria com o Portal da Cidade e com conteúdo da CNN Brasil.</p>
          </div>
        </div>
      </section>

      {/* 10 FAQ */}
      <section id="faq" className="sec" style={{ borderTop: '1px solid #ECEBE7' }}>
        <div className="w faq">
          <h2 className="t h2" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>Dúvidas de quem vai anunciar</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FAQ().map((f, i, arr) => (
              <details key={f.q} open={i === 0} style={{ borderTop: '1px solid #E4E2DD', borderBottom: i === arr.length - 1 ? '1px solid #E4E2DD' : undefined, paddingBlock: 22 }}>
                <summary>{f.q}</summary>
                <p style={{ margin: '12px 0 0', color: '#55545A' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11 CTA FINAL */}
      <section className="sec" style={{ background: '#EA251D', color: '#fff', textAlign: 'center' }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <h2 className="t" style={{ fontSize: 'clamp(40px,7vw,80px)', maxWidth: '12em' }}>Sua marca no elevador ainda hoje.</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Link className="b bw" to="/loja">Escolher prédios</Link>
            <a className="b bk" href={waSofia()}>Falar com a Sofia</a>
          </div>
        </div>
      </section>

      <section style={{ paddingBlock: 44, borderBottom: '1px solid #ECEBE7' }}>
        <div className="w" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 22, letterSpacing: '-.02em', fontWeight: 800 }}>É síndico? A tela no seu prédio é sem custo.</strong>
          <Link className="lk" to="/sou-sindico">Saiba como funciona</Link>
        </div>
      </section>

      <RodapeSite />

      <BarraCelular>
        <Link className="b br" to="/loja" style={{ flex: 1, minHeight: 50 }}>Ver prédios e preços</Link>
        <a className="b wa" href={waSofia()} aria-label="Falar com a Sofia no WhatsApp" style={{ minHeight: 50, padding: '0 16px' }}><IconeWhats /></a>
      </BarraCelular>
    </div>
  );
}
