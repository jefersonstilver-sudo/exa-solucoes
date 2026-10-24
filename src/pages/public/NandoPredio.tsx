// Pagina do predio (link de 1 hora enviado pelo Nando no WhatsApp): mostra os avisos no ar e agendados
// exatamente como aparecem no quadro de avisos do elevador, na ordem do rodizio.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Aviso = {
  id: string; tipo: 'nando' | 'imagem' | 'pdf'; titulo: string; segundos: number; inicio: string; fim: string | null;
  status: 'no_ar' | 'agendado'; criado_por: string; dados: unknown; url: string | null; antigo: boolean; em_grupo?: boolean;
  criado_em?: string | null; grupo_predios?: string[]; repete?: boolean;
};
type Grupo = { id?: string; predio: string; codigo?: string; avisos: Aviso[] };
type Pagina = { ok: boolean; erro?: string; modo?: 'predio' | 'carteira'; predio?: string; avisos?: Aviso[]; predios?: Grupo[]; expira_em?: string };

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

const moldura: React.CSSProperties = { width: '100%', aspectRatio: '502 / 882', borderRadius: 18, padding: 6, background: 'linear-gradient(160deg,#4b4b52,#1c1c20)', boxShadow: '0 24px 60px rgba(0,0,0,.5)' };
const tela: React.CSSProperties = { position: 'relative', width: '100%', height: '100%', borderRadius: 13, overflow: 'hidden', background: '#140a1c' };

function resumo(g?: Grupo) {
  const noAr = (g?.avisos || []).filter((a) => a.status === 'no_ar');
  const ag = (g?.avisos || []).filter((a) => a.status === 'agendado').length;
  const volta = noAr.reduce((s, a) => s + (a.segundos || 15), 0);
  return (noAr.length === 0 ? 'Nenhum aviso no ar agora' : noAr.length === 1 ? '1 aviso no ar, fixo na tela' : `${noAr.length} avisos no rodízio · uma volta completa a cada ${volta}s`)
    + (ag ? ` · ${ag} agendado${ag > 1 ? 's' : ''}` : '');
}

export default function NandoPredio() {
  const token = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [p, setP] = useState<Pagina | null>(null);
  const [resta, setResta] = useState(0);
  const [aberto, setAberto] = useState<{ a: Aviso; predio: string; noArQtd: number } | null>(null);

  useEffect(() => {
    document.title = 'Avisos · Nando · EXA';
    supabase.functions.invoke('nando-previa', { body: { p: token } }).then(({ data, error }) => {
      if (error || !data) setP({ ok: false, erro: 'Esse link expirou ou está incompleto. Peça um novo ao Nando no WhatsApp.' });
      else setP(data as Pagina);
    });
  }, [token]);

  useEffect(() => {
    if (!p?.expira_em) return;
    const t = setInterval(() => setResta(Math.max(0, Math.round((new Date(p.expira_em!).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [p?.expira_em]);

  const carteira = p?.modo === 'carteira';
  const grupos: Grupo[] = !p?.ok ? [] : carteira ? (p.predios || []) : [{ predio: p.predio || '', avisos: p.avisos || [] }];
  const todosAvisos = grupos.flatMap((g) => g.avisos);

  useEffect(() => {
    if (!p?.ok || !todosAvisos.length) return;
    const montados: { remover: () => void; escalar: () => void }[] = [];
    const onResize = () => montados.forEach((m) => m.escalar());
    (async () => {
      if (todosAvisos.some((a) => a.tipo === 'nando')) {
        carregarCss('/nando/aviso-nando.css');
        await carregarScript('/nando/aviso-nando.js');
      }
      for (const a of todosAvisos) {
        const el = document.getElementById(`na-av-${a.id}`);
        if (!el) continue;
        if (a.tipo === 'nando' && a.dados && window.NandoAviso) montados.push(window.NandoAviso.montar(el, a.dados));
        if (a.tipo === 'pdf' && a.url) try {
          await carregarScript('https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js');
          const lib = window.pdfjsLib;
          lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
          const doc = await lib.getDocument({ url: a.url, isEvalSupported: false }).promise;
          const pg = await doc.getPage(1);
          const v = pg.getViewport({ scale: 1.5 });
          const cv = document.createElement('canvas'); cv.width = v.width; cv.height = v.height;
          cv.style.cssText = 'position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%';
          el.appendChild(cv);
          await pg.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise;
        } catch (err) { console.error('pdf', a.id, err); }
      }
      window.addEventListener('resize', onResize);
    })().catch((e) => console.error('predio', e));
    return () => { montados.forEach((m) => m.remover()); window.removeEventListener('resize', onResize); };
  }, [p]);

  const min = Math.floor(resta / 60), seg = String(resta % 60).padStart(2, '0');
  const hh = Math.floor(min / 60), mm = String(min % 60).padStart(2, '0');

  const cartao = (a: Aviso, ordem: number | null, noArQtd: number, predio = '') => (
    <div key={a.id} onClick={() => setAberto({ a, predio, noArQtd })} title="Ver detalhes" style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}>
      <div style={moldura}>
        <div id={`na-av-${a.id}`} style={tela}>
          {a.tipo === 'imagem' && a.url && (
            <>
              <img src={a.url} alt="" style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(24px) brightness(.6)' }} />
              <img src={a.url} alt={a.titulo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            </>
          )}
          {!a.url && a.tipo !== 'nando' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontSize: 14, opacity: 0.7 }}>
              Aviso enviado antes do Nando<br />(aparece na tela normalmente)
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 4px', fontSize: 14, lineHeight: 1.55 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          {ordem != null && <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(255,255,255,.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{ordem}</span>}
          <b style={{ fontSize: 15 }}>{a.titulo}</b>
        </div>
        <div style={{ opacity: 0.8 }}>
          {a.status === 'agendado' ? <>🗓️ Começa <b>{fmt(a.inicio)}</b></> : noArQtd > 1 ? <>⏱️ <b>{a.segundos}s</b> na tela a cada volta</> : <>📌 Fica <b>fixo na tela</b></>}
        </div>
        <div style={{ opacity: 0.8 }}>⏹️ {a.fim ? <>Sai <b>{fmt(a.fim)}</b></> : 'Sem data de saída'}</div>
        {a.criado_por && <div style={{ opacity: 0.55, fontSize: 12 }}>Criado por {a.criado_por}{a.em_grupo ? ' · também em outros prédios' : ''}{a.repete ? ' · se repete' : ''}</div>}
        <div style={{ opacity: 0.45, fontSize: 11 }}>Toque para ver detalhes</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top,#3b0d4f 0%,#120617 60%)', color: '#fff', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', padding: '28px 16px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.6, fontWeight: 700 }}>QUADRO DE AVISOS</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 4px' }}>{p?.ok ? p.predio : 'Nando · EXA Mídia'}</h1>
          {p?.ok && (
            <div style={{ fontSize: 14, opacity: 0.75 }}>
              {carteira ? `${grupos.length} prédios · ${todosAvisos.filter((x) => x.status === 'no_ar').length} avisos no ar` : resumo(grupos[0])}
            </div>
          )}
        </div>

        {!p && <div style={{ marginTop: 80, textAlign: 'center', opacity: 0.7 }}>Carregando…</div>}
        {p && !p.ok && <div style={{ margin: '60px auto 0', maxWidth: 360, textAlign: 'center', lineHeight: 1.5, opacity: 0.85 }}>{p.erro}</div>}

        {grupos.map((g, gi) => {
          const noAr = g.avisos.filter((a) => a.status === 'no_ar');
          const agendados = g.avisos.filter((a) => a.status === 'agendado');
          return (
            <section key={g.id || gi} style={{ marginTop: carteira ? 40 : 0 }}>
              {carteira && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 22 }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{g.predio}{g.codigo ? <span style={{ opacity: 0.5, fontWeight: 600, fontSize: 14 }}> · {g.codigo}</span> : null}</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{resumo(g)}</div>
                </div>
              )}
              {noAr.length > 0 && (
                <>
                  <div style={{ margin: '22px 0 14px', fontSize: 13, letterSpacing: 2, fontWeight: 800, opacity: 0.7 }}>NO AR AGORA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 22 }}>
                    {noAr.map((a, i) => cartao(a, noAr.length > 1 ? i + 1 : null, noAr.length, g.predio))}
                  </div>
                </>
              )}
              {agendados.length > 0 && (
                <>
                  <div style={{ margin: '30px 0 14px', fontSize: 13, letterSpacing: 2, fontWeight: 800, opacity: 0.7 }}>AGENDADOS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 22 }}>
                    {agendados.map((a) => cartao(a, null, noAr.length, g.predio))}
                  </div>
                </>
              )}
            </section>
          );
        })}

        {p?.ok && (
          <div style={{ marginTop: 34, textAlign: 'center', fontSize: 13, opacity: 0.65, lineHeight: 1.6 }}>
            Para criar, mudar ou tirar um aviso, é só falar com o Nando no WhatsApp.<br />Este link expira em {hh > 0 ? `${hh}h${mm}` : `${min}:${seg}`}.
          </div>
        )}
      </div>
      {aberto && (
        <div onClick={() => setAberto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 440px)', maxHeight: '90vh', overflowY: 'auto', background: '#1d1024', border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, padding: 20, lineHeight: 1.6, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.6, fontWeight: 700 }}>{aberto.predio.toUpperCase()}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{aberto.a.titulo}</div>
              </div>
              <button onClick={() => setAberto(null)} style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: 0, borderRadius: 16, width: 32, height: 32, fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            {aberto.a.tipo === 'imagem' && aberto.a.url && <img src={aberto.a.url} alt={aberto.a.titulo} style={{ width: '100%', borderRadius: 12, marginTop: 12 }} />}
            {aberto.a.tipo === 'pdf' && aberto.a.url && <a href={aberto.a.url} target="_blank" rel="noreferrer" style={{ color: '#d8b4fe', display: 'inline-block', marginTop: 12 }}>Abrir o PDF completo</a>}
            <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
              <div>👤 <b>Cadastrado por:</b> {aberto.a.criado_por || 'não informado'}{aberto.a.criado_em ? ` · ${fmt(aberto.a.criado_em)}` : ''}</div>
              <div>📺 <b>Situação:</b> {aberto.a.status === 'no_ar' ? 'no ar agora' : 'agendado'}</div>
              <div>🗓️ <b>Começa:</b> {fmt(aberto.a.inicio) || 'já começou'}</div>
              <div>⏹️ <b>Sai:</b> {aberto.a.fim ? fmt(aberto.a.fim) : 'sem data de saída'}</div>
              <div>⏱️ <b>Tempo na tela:</b> {aberto.noArQtd > 1 ? `${aberto.a.segundos}s a cada volta do rodízio` : 'fixo (é o único aviso no ar)'}</div>
              {aberto.a.repete && <div>🔁 <b>Se repete:</b> o Nando coloca e tira sozinho em cada vez</div>}
              {!!aberto.a.grupo_predios?.length && <div>🏢 <b>Também está em:</b> {aberto.a.grupo_predios.filter((n) => n !== aberto.predio).join(', ') || '—'}</div>}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>Para mudar ou tirar este aviso, fale com o Nando no WhatsApp.</div>
          </div>
        </div>
      )}
    </div>
  );
}
