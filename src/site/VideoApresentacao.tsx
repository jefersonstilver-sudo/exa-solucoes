import React, { useEffect, useRef, useState } from 'react';
import { videoSite } from './comum';

/**
 * Vídeo de apresentação do topo do site: começa sozinho e sem som (regra dos navegadores),
 * com controles mínimos por cima — som, pausar, voltar 10 s, barra de progresso e tela cheia.
 * No iPhone a tela cheia usa o player nativo (webkitEnterFullscreen).
 */
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const Ic = {
  somOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="m22 9-6 6M16 9l6 6" /></svg>,
  somOn: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>,
  play: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>,
  pause: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>,
  voltar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>,
  cheia: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
};

export const VideoApresentacao: React.FC<{ src: string; poster?: string; rotulo: string }> = ({ src, poster, rotulo }) => {
  const v = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);
  const [tocando, setTocando] = useState(true);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [mostrar, setMostrar] = useState(true);
  const esconder = useRef<number>();

  const acordar = () => {
    setMostrar(true);
    window.clearTimeout(esconder.current);
    esconder.current = window.setTimeout(() => setMostrar(false), 2600);
  };
  useEffect(() => { acordar(); return () => window.clearTimeout(esconder.current); }, []);

  // pausa quando sai da tela (economiza bateria e dados) e volta quando aparece de novo, se estava tocando
  useEffect(() => {
    const el = v.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) el.pause();
      else if (el.dataset.querTocar !== '0') el.play().catch(() => {});
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const alternarSom = () => {
    const el = v.current; if (!el) return;
    el.muted = !el.muted;
    if (!el.muted) { el.volume = 1; if (el.paused) el.play().catch(() => {}); }
    setMudo(el.muted); acordar();
  };
  const alternarPlay = () => {
    const el = v.current; if (!el) return;
    if (el.paused) { el.dataset.querTocar = '1'; el.play().catch(() => {}); }
    else { el.dataset.querTocar = '0'; el.pause(); }
    acordar();
  };
  const voltar10 = () => { const el = v.current; if (el) { el.currentTime = Math.max(0, el.currentTime - 10); acordar(); } };
  const telaCheia = () => {
    const el = v.current as any; if (!el) return;
    const caixa = el.parentElement as any;
    const doc = document as any;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) { (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc); return; }
    if (caixa.requestFullscreen) caixa.requestFullscreen().catch(() => el.webkitEnterFullscreen?.());
    else if (caixa.webkitRequestFullscreen) caixa.webkitRequestFullscreen();
    else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen(); // iPhone: player nativo
  };
  const buscar = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const el = v.current; if (!el || !dur) return;
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    el.currentTime = Math.min(dur, Math.max(0, ((x - r.left) / r.width) * dur));
    acordar();
  };

  const pct = dur ? (t / dur) * 100 : 0;
  return (
    <div className="vap" data-mostrar={mostrar || !tocando} onMouseMove={acordar}>
      <video
        ref={v}
        src={videoSite(src)}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={rotulo}
        onClick={() => { if (!mostrar && tocando) { acordar(); return; } alternarPlay(); }}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onVolumeChange={() => setMudo(!!v.current?.muted)}
        onLoadedMetadata={() => setDur(v.current?.duration || 0)}
        onTimeUpdate={() => setT(v.current?.currentTime || 0)}
      />
      {mudo && (
        <button type="button" className="vap-som" onClick={alternarSom} aria-label="Ativar o som">
          {Ic.somOff}<span>Toque para ouvir</span>
        </button>
      )}
      <div className="vap-barra">
        <div className="vap-prog" onClick={buscar} onTouchMove={buscar} role="slider" aria-label="Posição do vídeo" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} tabIndex={0}
          onKeyDown={(e) => { const el = v.current; if (!el) return; if (e.key === 'ArrowRight') el.currentTime = Math.min(dur, el.currentTime + 5); if (e.key === 'ArrowLeft') el.currentTime = Math.max(0, el.currentTime - 5); }}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="vap-btns">
          <button type="button" onClick={alternarPlay} aria-label={tocando ? 'Pausar' : 'Tocar'}>{tocando ? Ic.pause : Ic.play}</button>
          <button type="button" onClick={voltar10} aria-label="Voltar 10 segundos">{Ic.voltar}</button>
          <span className="vap-tempo">{fmt(t)} / {fmt(dur)}</span>
          <button type="button" onClick={alternarSom} aria-label={mudo ? 'Ativar o som' : 'Tirar o som'} style={{ marginLeft: 'auto' }}>{mudo ? Ic.somOff : Ic.somOn}</button>
          <button type="button" onClick={telaCheia} aria-label="Tela cheia">{Ic.cheia}</button>
        </div>
      </div>
    </div>
  );
};

export default VideoApresentacao;
