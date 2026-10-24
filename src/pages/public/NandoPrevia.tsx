// Previa temporaria de um aviso criado pelo Nando (link de 10 minutos enviado no WhatsApp).
// Mostra o aviso exatamente como fica no quadro de avisos do elevador (mesmo desenhador do painel).
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Secao = { opcao: number; rotulo: string; tipo: 'nando' | 'imagem' | 'pdf'; cartoes: unknown[]; url: string | null; credito?: string | null };
type Previa = {
  secoes?: Secao[];
  ok: boolean; erro?: string; tipo?: 'nando' | 'imagem' | 'pdf' | 'proposta'; titulo?: string; segundos?: number;
  inicio?: string; fim?: string | null; predio?: string; destinos?: string[]; outros?: number; opcoes?: { opcao: number; rotulo?: string; dados: unknown; credito?: string | null }[]; serie?: boolean; dados?: unknown; url?: string | null; expira_em?: string;
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
    if (!p?.ok) return;
    let aviso: { remover: () => void; escalar: () => void } | null = null;
    const onResize = () => aviso?.escalar();
    (async () => {
      if (p.secoes?.length) {
        carregarCss('/nando/aviso-nando.css');
        await carregarScript('/nando/aviso-nando.js');
        const montados: { remover: () => void; escalar: () => void }[] = [];
        for (const s of p.secoes) {
          if (s.tipo === 'nando') s.cartoes.forEach((d, i) => {
            const el = document.getElementById(`na-s${s.opcao}-${i}`);
            if (el && window.NandoAviso) montados.push(window.NandoAviso.montar(el, d));
          });
          if (s.tipo === 'pdf' && s.url) {
            await carregarScript('https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js');
            const lib = window.pdfjsLib;
            lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
            const doc = await lib.getDocument({ url: s.url, isEvalSupported: false }).promise;
            const pg = await doc.getPage(1);
            const v = pg.getViewport({ scale: 1.6 });
            const cv = document.getElementById(`na-pdf-${s.opcao}`) as HTMLCanvasElement | null;
            if (cv) { cv.width = v.width; cv.height = v.height; await pg.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise; }
          }
        }
        aviso = { remover: () => montados.forEach((m) => m.remover()), escalar: () => montados.forEach((m) => m.escalar()) };
        window.addEventListener('resize', onResize);
      } else if (p.tipo === 'nando') {
        carregarCss('/nando/aviso-nando.css');
        await carregarScript('/nando/aviso-nando.js');
        const lista = p.opcoes?.length ? p.opcoes : [{ opcao: 1, dados: p.dados }];
        const montados = lista.map((o) => {
          const el = document.getElementById(`na-op-${o.opcao}`);
          return el && window.NandoAviso ? window.NandoAviso.montar(el, o.dados) : null;
        }).filter(Boolean) as { remover: () => void; escalar: () => void }[];
        aviso = { remover: () => montados.forEach((m) => m.remover()), escalar: () => montados.forEach((m) => m.escalar()) };
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
      {p?.ok && (p.destinos?.length ?? 0) > 1 ? (
        <div style={{ fontSize: 14, marginBottom: 18, textAlign: 'center', maxWidth: 520, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,.08)', lineHeight: 1.5 }}>
          <b>Vai aparecer em {p.destinos!.length} prédios:</b> {p.destinos!.join(', ')}
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>A prévia mostra o {p.predio}; em cada prédio a assinatura sai com o nome dele.</div>
        </div>
      ) : p?.ok && <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 18 }}>{p.predio}</div>}

      {!p && <div style={{ marginTop: 80, opacity: 0.7 }}>Carregando…</div>}
      {p && !p.ok && <div style={{ marginTop: 60, maxWidth: 360, textAlign: 'center', lineHeight: 1.5, opacity: 0.85 }}>{p.erro}</div>}

      {p?.ok && !!p.secoes?.length && (
        <div style={{ width: '100%', maxWidth: 1100 }}>
          <div style={{ fontSize: 14, opacity: 0.8, textAlign: 'center', marginBottom: 6 }}>Escolha uma ou mais opções e responda o Nando com o número 👇</div>
          {p.secoes!.map((s) => (
            <div key={s.opcao} style={{ marginTop: 22, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '14px 12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
                <span style={{ background: '#7c3aed', borderRadius: 999, padding: '4px 12px', fontWeight: 800, fontSize: 14 }}>Opção {s.opcao}</span>
                <b style={{ fontSize: 15 }}>{s.rotulo}</b>
              </div>
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 6 }}>
                {s.tipo === 'nando' && s.cartoes.map((_, i) => (
                  <div key={i} style={{ flex: '0 0 auto', width: 'min(62vw, 250px)', aspectRatio: '502 / 882', borderRadius: 16, padding: 5, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)', scrollSnapAlign: 'start' }}>
                    <div id={`na-s${s.opcao}-${i}`} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', background: '#140a1c' }} />
                  </div>
                ))}
                {s.tipo !== 'nando' && (
                  <div style={{ flex: '0 0 auto', width: 'min(62vw, 250px)', aspectRatio: '502 / 882', borderRadius: 16, padding: 5, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)' }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', background: '#1a1022', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.tipo === 'imagem' && s.url && <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                      {s.tipo === 'pdf' && <canvas id={`na-pdf-${s.opcao}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                    </div>
                  </div>
                )}
              </div>
              {s.tipo === 'nando' && s.cartoes.length > 1 && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, padding: '0 4px' }}>Os {s.cartoes.length} cartões vão ao ar juntos, um depois do outro. Deslize para ver todos.</div>}
            </div>
          ))}
          <div style={{ marginTop: 18, fontSize: 13, opacity: 0.7, textAlign: 'center' }}>Este link expira em {min}:{seg}.</div>
        </div>
      )}

      {p?.ok && !p.secoes?.length && (
        <>
          {p.tipo === 'nando' && (
            <>
              {(p.opcoes?.length || 0) > 1 && <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 12 }}>Deslize para ver {p.serie ? `os ${p.opcoes!.length} cartões` : `as ${p.opcoes!.length} opções`} 👉</div>}
              <div style={{ display: 'flex', gap: 18, overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', maxWidth: 1100, padding: '4px 4px 16px', justifyContent: (p.opcoes?.length || 1) > 1 ? 'flex-start' : 'center' }}>
                {(p.opcoes?.length ? p.opcoes : [{ opcao: 1, dados: p.dados }]).map((o) => (
                  <div key={o.opcao} style={{ flex: '0 0 auto', scrollSnapAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{'rotulo' in o && o.rotulo ? o.rotulo : `Opção ${o.opcao}`}</div>
                    <div style={{ width: 'min(78vw, 320px)', aspectRatio: '502 / 882', borderRadius: 18, padding: 6, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
                      <div id={`na-op-${o.opcao}`} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 13, overflow: 'hidden', background: '#140a1c' }} />
                    </div>
                    {'credito' in o && o.credito ? <div style={{ fontSize: 11, opacity: 0.55, marginTop: 8 }}>{o.credito}</div> : null}
                  </div>
                ))}
              </div>
            </>
          )}
          {/* moldura do quadro de avisos do elevador (mesma proporcao da tela) */}
          {p.tipo !== 'nando' && <div style={{ width: 'min(86vw, 380px)', aspectRatio: '502 / 882', borderRadius: 18, padding: 6, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
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
          </div>}

          <div style={{ marginTop: 22, width: 'min(86vw, 380px)', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '14px 16px', fontSize: 14, lineHeight: 1.7 }}>
            <div>⏱️ {p.outros ? <><b>{p.segundos}s</b> na tela a cada rodízio (com {p.outros} outro{p.outros > 1 ? 's' : ''} aviso{p.outros > 1 ? 's' : ''})</> : <>Fica <b>fixo na tela</b> (único aviso do prédio)</>}</div>
            <div>▶️ Começa: <b>{fmt(p.inicio) || 'assim que publicar'}</b></div>
            <div>⏹️ Sai: <b>{fmt(p.fim) || 'sem data de saída'}</b></div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, opacity: 0.7, textAlign: 'center', maxWidth: 340 }}>
            {p.serie ? <>Os cartões vão ao ar juntos, um depois do outro. Responda o Nando no WhatsApp com <b>"pode publicar"</b> ou peça os ajustes.</> : (p.opcoes?.length || 0) > 1 ? <>Responda o Nando no WhatsApp com o número da opção (ex: <b>"opção 2"</b>) ou peça os ajustes.</> : <>Gostou? Responda o Nando no WhatsApp com <b>"pode publicar"</b> ou peça os ajustes.</>}
            <br />Este link expira em {min}:{seg}.
          </div>
        </>
      )}
    </div>
  );
}
