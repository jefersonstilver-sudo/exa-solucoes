// Previa temporaria de um aviso criado pelo Nando (link de 10 minutos enviado no WhatsApp).
// Mostra o aviso exatamente como fica no quadro de avisos do elevador (mesmo desenhador do painel).
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Previa = {
  ok: boolean; erro?: string; tipo?: 'nando' | 'imagem' | 'pdf'; titulo?: string; segundos?: number;
  inicio?: string; fim?: string | null; predio?: string; outros?: number; dados?: unknown; url?: string | null; expira_em?: string;
};

declare global {
  interface Window {
    NandoAviso?: { montar: (caixa: HTMLElement, dados: unknown) => { remover: () => void; escalar: () => void } };
    pdfjsLib?: any;
  }
}

function carregarScript(src: string) {
  return new Promise<void>((ok, erro) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = () => ok(); s.onerror = () => erro(new Error(src));
    document.head.appendChild(s);
  });
}
function carregarCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}
const fmt = (d?: string | null) => d
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  : null;

export default function NandoPrevia() {
  const token = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [p, setP] = useState<Previa | null>(null);
  const [resta, setResta] = useState<number>(0);
  const caixa = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.title = 'Prévia do aviso · Nando · EXA';
    supabase.functions.invoke('nando-previa', { body: { t: token } })
      .then(({ data, error }) => {
        if (error || !data) setP({ ok: false, erro: 'Essa prévia expirou ou o link está incompleto. Peça um novo link ao Nando.' });
        else setP(data as Previa);
      });
  }, [token]);

  useEffect(() => {
    if (!p?.expira_em) return;
    const t = setInterval(() => setResta(Math.max(0, Math.round((new Date(p.expira_em!).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [p?.expira_em]);

  useEffect(() => {
    if (!p?.ok || !caixa.current) return;
    let aviso: { remover: () => void; escalar: () => void } | null = null;
    const onResize = () => aviso?.escalar();
    (async () => {
      if (p.tipo === 'nando') {
        carregarCss('/nando/aviso-nando.css');
        await carregarScript('/nando/aviso-nando.js');
        if (caixa.current && window.NandoAviso) aviso = window.NandoAviso.montar(caixa.current, p.dados);
        window.addEventListener('resize', onResize);
      } else if (p.tipo === 'pdf' && p.url && canvas.current) {
        await carregarScript('https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js');
        const lib = window.pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
        const doc = await lib.getDocument({ url: p.url, isEvalSupported: false }).promise;
        const pg = await doc.getPage(1);
        const v = pg.getViewport({ scale: 2 });
        const cv = canvas.current; cv.width = v.width; cv.height = v.height;
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise;
      }
    })().catch((e) => console.error('previa', e));
    return () => { aviso?.remover(); window.removeEventListener('resize', onResize); };
  }, [p]);

  const min = Math.floor(resta / 60), seg = String(resta % 60).padStart(2, '0');

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top,#3b0d4f 0%,#120617 60%)', color: '#fff', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px' }}>
      <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.6, fontWeight: 700 }}>PRÉVIA DO AVISO</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 2px', textAlign: 'center' }}>{p?.ok ? p.titulo : 'Nando · EXA Mídia'}</h1>
      {p?.ok && <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 18 }}>{p.predio}</div>}

      {!p && <div style={{ marginTop: 80, opacity: 0.7 }}>Carregando…</div>}
      {p && !p.ok && <div style={{ marginTop: 60, maxWidth: 360, textAlign: 'center', lineHeight: 1.5, opacity: 0.85 }}>{p.erro}</div>}

      {p?.ok && (
        <>
          {/* moldura do quadro de avisos do elevador (mesma proporcao da tela) */}
          <div style={{ width: 'min(86vw, 380px)', aspectRatio: '502 / 882', borderRadius: 18, padding: 6, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
            <div ref={caixa} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 13, overflow: 'hidden', background: '#140a1c' }}>
              {p.tipo === 'imagem' && p.url && (
                <>
                  <img src={p.url} alt="" style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(24px) brightness(.6)' }} />
                  <img src={p.url} alt="Aviso" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </>
              )}
              {p.tipo === 'pdf' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#1a1022' }}>
                  <canvas ref={canvas} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 22, width: 'min(86vw, 380px)', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '14px 16px', fontSize: 14, lineHeight: 1.7 }}>
            <div>⏱️ {p.outros ? <><b>{p.segundos}s</b> na tela a cada rodízio (com {p.outros} outro{p.outros > 1 ? 's' : ''} aviso{p.outros > 1 ? 's' : ''})</> : <>Fica <b>fixo na tela</b> (único aviso do prédio)</>}</div>
            <div>▶️ Começa: <b>{fmt(p.inicio) || 'assim que publicar'}</b></div>
            <div>⏹️ Sai: <b>{fmt(p.fim) || 'sem data de saída'}</b></div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, opacity: 0.7, textAlign: 'center', maxWidth: 340 }}>
            Gostou? Responda o Nando no WhatsApp com <b>"pode publicar"</b> ou peça os ajustes.
            <br />Este link expira em {min}:{seg}.
          </div>
        </>
      )}
    </div>
  );
}
