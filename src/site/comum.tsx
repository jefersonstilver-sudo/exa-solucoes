import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './site.css';

/** Contatos e links do site público. */
export const SOFIA_WA = '5545991415920';
export const NANDO_WA = '554591132351';
export const waSofia = (texto = 'Oi Sofia, vim pelo site e quero anunciar') => `https://wa.me/${SOFIA_WA}?text=${encodeURIComponent(texto)}`;
export const waNando = (texto = 'Quero a EXA no meu prédio') => `https://wa.me/${NANDO_WA}?text=${encodeURIComponent(texto)}`;

/** Carrega a fonte Manrope uma vez (só nas páginas do site público). */
export function useFonteSite() {
  useEffect(() => {
    if (document.getElementById('fonte-manrope')) return;
    const l = document.createElement('link');
    l.id = 'fonte-manrope';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap';
    document.head.appendChild(l);
  }, []);
}

/**
 * Vídeo leve: sem som, só baixa e toca quando aparece na tela (e pausa quando sai).
 * Com "reduzir movimento" ativado no aparelho, mostra só a imagem.
 */
export const VideoLeve: React.FC<React.VideoHTMLAttributes<HTMLVideoElement> & { src: string; poster?: string }> = ({ src, poster, ...rest }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let reduz = false;
    try { reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* sem suporte */ }
    if (reduz || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) v.setAttribute('src', src);
        v.muted = true;
        v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    }, { rootMargin: '200px' });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return <video ref={ref} poster={poster} muted loop playsInline preload="none" {...rest} />;
};

const IconeWhats = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);
export { IconeWhats };

/** Promoção de novembro/2026: R$ 99 por prédio por mês. Só aparece de 1 a 30/11/2026 (horário de Brasília). */
export const PROMO_PRECO = 99;
export function promoNovembroAtiva(agora: Date = new Date()): boolean {
  const sp = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return sp.getFullYear() === 2026 && sp.getMonth() === 10;
}
export const TarjaPromo: React.FC = () => {
  if (!promoNovembroAtiva()) return null;
  return (
    <a className="tarja-promo" href={waSofia('Oi Sofia! Vi a promoção de novembro de R$ 99 por prédio e quero saber mais.')} target="_blank" rel="noopener noreferrer">
      <strong>Só em novembro:</strong> R$ {PROMO_PRECO} por prédio, por mês. <span>Falar com a Sofia →</span>
    </a>
  );
};

export const CabecalhoSite: React.FC<{ claro?: boolean; acao?: React.ReactNode; semPromo?: boolean }> = ({ claro, acao, semPromo }) => (
  <header className={`hdr ${claro ? 'hdr-claro' : ''}`} style={claro ? undefined : { backdropFilter: 'saturate(1.4) blur(14px)' }}>
    {!semPromo && <TarjaPromo />}
    <div className="w in">
      <Link to="/" aria-label="EXA, início">
        <img src={claro ? '/site/exa-preto.svg' : '/site/exa-branco.svg'} alt="EXA" width={64} height={28} style={{ height: 26, width: 'auto', display: 'block' }} />
      </Link>
      <nav className="nav" aria-label="Principal">
        <Link className="nl" to="/#como">Como funciona</Link>
        <Link className="nl" to="/loja">Prédios</Link>
        <Link className="nl" to="/sou-sindico">Sou síndico</Link>
        <Link className="nl sempre" to="/login" style={{ alignItems: 'center', gap: 6 }}>
          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
          Entrar
        </Link>
        {acao ?? <a className="b br" href={waSofia()} style={{ minHeight: 42, padding: '0 18px', fontSize: 15 }}>Falar com a Sofia</a>}
      </nav>
    </div>
  </header>
);

export const RodapeSite: React.FC = () => (
  <footer style={{ background: '#0B0B0D', color: '#9C9A96', paddingBlock: '64px 32px' }}>
    <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
      <div className="foot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <img src="/site/exa-branco.svg" alt="EXA" width={60} height={26} style={{ height: 26, width: 'auto', alignSelf: 'flex-start' }} loading="lazy" />
          <p style={{ margin: 0, maxWidth: '24em', fontSize: 16 }}>Telas nos elevadores dos prédios residenciais de Foz do Iguaçu.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}>
          <strong style={{ color: '#fff' }}>Anunciantes</strong>
          <Link to="/loja">Prédios e preços</Link>
          <Link to="/#faq">Dúvidas</Link>
          <Link to="/midia-kit">Mídia kit</Link>
          <Link to="/login">Entrar</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}>
          <strong style={{ color: '#fff' }}>Síndicos</strong>
          <Link to="/sou-sindico">Tela no meu prédio</Link>
          <a href="/paineldosindico">Painel do Síndico</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}>
          <strong style={{ color: '#fff' }}>Contato</strong>
          <a href={waSofia()}>Sofia · (45) 99141-5920</a>
          <a href={waNando()}>Nando (síndicos) · (45) 9113-2351</a>
          <a href="mailto:comercial@examidia.com.br">comercial@examidia.com.br</a>
          <a href="https://instagram.com/examidia">@examidia</a>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, borderTop: '1px solid #1C1C20', paddingTop: 22 }}>
        © {new Date().getFullYear()} EXA Mídia · Indexa Mídia LTDA · CNPJ 38.142.638/0001-30 · Av. Paraná, 974, sala 301, Foz do Iguaçu ·{' '}
        <Link to="/politica-privacidade" style={{ color: '#9C9A96' }}>Privacidade</Link> · <Link to="/termos-uso" style={{ color: '#9C9A96' }}>Termos</Link>
      </p>
    </div>
  </footer>
);

/** Barra fixa no celular com a ação principal da página. */
export const BarraCelular: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mbar" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: 'rgba(11,11,13,.96)', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))' }}>
    {children}
  </div>
);

/** Título da aba e descrição (sem biblioteca extra). */
export function useTituloPagina(titulo: string, descricao?: string) {
  useEffect(() => {
    document.title = titulo;
    if (descricao) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
      m.setAttribute('content', descricao);
    }
  }, [titulo, descricao]);
}
