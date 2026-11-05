/**
 * TV num PRÉDIO: a mesma tela do elevador (public/painel-web/ui, a que roda nos NUCs), servida ao vivo pelo
 * painel-web/sw.js com o token desta tela (a função exa-tela entrega o updates.json do NUC do prédio).
 *  - ReplicaElevador: TV vertical = réplica inteira (anúncios, avisos do síndico, câmera, notícias, clima, cotação);
 *    conta as exibições dos anúncios (a TV é uma tela a mais do prédio para o anunciante).
 *  - AvisosFrame: só o quadro de avisos do síndico, para a TV horizontal intercalar os avisos.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ANON_KEY, FUNCAO } from './config';
import { ler } from './api';
import { marcarTocando, registrarErro, registrarExibicao, registrarEvento } from './registro';

const K_TOKEN = 'exa-tela-token';
let preparando: Promise<boolean> | null = null;

/** Grava o token para o service worker da réplica e o registra (uma vez). */
export function prepararReplica(): Promise<boolean> {
  if (preparando) return preparando;
  preparando = (async () => {
    const token = ler<string>(K_TOKEN, '');
    if (!token || !('serviceWorker' in navigator) || typeof caches === 'undefined') return false;
    const c = await caches.open('replica');
    await c.put('/painel-web/__cfg', new Response(JSON.stringify({ tela: token }), { headers: { 'Content-Type': 'application/json' } }));
    const reg = await navigator.serviceWorker.register('/painel-web/sw.js', { scope: '/painel-web/' });
    if (!reg.active) {
      const sw = reg.installing || reg.waiting;
      await new Promise<void>((ok) => {
        const t = setTimeout(ok, 10000);
        sw?.addEventListener('statechange', () => { if (sw.state === 'activated') { clearTimeout(t); ok(); } });
      });
    }
    return !!(reg.active || (await navigator.serviceWorker.getRegistration('/painel-web/'))?.active);
  })().catch((e) => { registrarErro(`réplica: ${String((e as Error)?.message || e)}`); preparando = null; return false; });
  return preparando;
}

/** Mapa vídeo → pedido da programação do NUC (para a prova de exibição). */
async function mapaDePedidos(): Promise<Map<string, { pedido: string | null; nome: string }>> {
  const token = ler<string>(K_TOKEN, '');
  const r = await fetch(FUNCAO, {
    method: 'POST', cache: 'no-store', credentials: 'omit',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ acao: 'replica', arq: 'updates', token }),
  });
  const j = await r.json().catch(() => ({}));
  const m = new Map<string, { pedido: string | null; nome: string }>();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const it of [...(j?.updates?.Propagandas || []), ...(j?.updates?.PlaylistPronta || [])]) {
    if (!it?.video) continue;
    const p = String(it.id_pedido || '');
    m.set(String(it.video), { pedido: uuid.test(p) ? p : null, nome: String(it.cliente || it.nome || it.titulo || it.video).slice(0, 80) });
  }
  return m;
}

const Aviso = ({ texto }: { texto: string }) => (
  <div className="cheio fundo-exa" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center', fontSize: 34, fontWeight: 700, lineHeight: 1.35, color: 'rgba(255,255,255,.8)' }}>{texto}</div>
);

export function ReplicaElevador({ predioId, alternativa, camera = true }: { predioId: string; alternativa: React.ReactNode; camera?: boolean }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => { let vivo = true; prepararReplica().then((v) => { if (vivo) setOk(v); }); return () => { vivo = false; }; }, []);

  // prova de exibição: acompanha o vídeo que a tela do elevador está tocando
  useEffect(() => {
    if (!ok) return;
    let mapa = new Map<string, { pedido: string | null; nome: string }>();
    let ultimoMapa = 0;
    let atual = '';
    let desde = Date.now();
    const fechar = () => {
      if (!atual) return;
      const seg = (Date.now() - desde) / 1000;
      const info = mapa.get(atual);
      if (seg >= 3 && info?.pedido) registrarExibicao('anuncio', info.pedido, null, seg);
    };
    // saúde do vídeo na TV (para saber se trava por decodificação, rede ou troca): quadros perdidos, segundos parado,
    // resolução de cada arquivo e o que mais está decodificando junto (câmera ao vivo, vídeo seguinte)
    const saude = { seg: 0, parado: 0, preto: 0, trocas: 0, perdidos: 0, quadros: 0, arquivos: {} as Record<string, string>, camera: 0 };
    let qAnt = { d: 0, t: 0 };
    let ultimoEnvio = Date.now();
    const id = setInterval(async () => {
      if (Date.now() - ultimoMapa > 5 * 60000) { ultimoMapa = Date.now(); mapaDePedidos().then((m) => { if (m.size) mapa = m; }).catch(() => {}); }
      try {
        const doc = ref.current?.contentDocument;
        const vp = doc?.getElementById('video-propaganda') as HTMLVideoElement | null;
        // erros de dentro da tela do elevador (antes ficavam só no console do iframe): play() recusado, vídeo com erro
        const jan: any = ref.current?.contentWindow;
        if (jan && !jan.__exaEspia) {
          jan.__exaEspia = true;
          let n = 0; const janela = () => { if (Date.now() - (jan.__exaT || 0) > 60000) { jan.__exaT = Date.now(); n = 0; } return ++n <= 6; };
          const txt = (a: any) => { try { return a instanceof Error || (a && a.name && a.message) ? `${a.name}: ${a.message}` : typeof a === 'object' ? JSON.stringify(a).slice(0, 160) : String(a); } catch { return String(a); } };
          const ce = jan.console && jan.console.error;
          if (ce) jan.console.error = function (...args: any[]) { try { if (janela()) registrarErro(`réplica: ${args.map(txt).join(' ').slice(0, 300)}`); } catch { /* nada */ } return ce.apply(jan.console, args); };
          jan.addEventListener('unhandledrejection', (ev: any) => { if (janela()) registrarErro(`réplica (promessa): ${txt(ev.reason)}`); });
          if (vp) vp.addEventListener('error', () => { const er = vp.error; if (janela()) registrarErro(`réplica vídeo: código ${er ? er.code : '?'} ${er && (er as any).message ? (er as any).message : ''} ${String(vp.currentSrc).split('/cache/')[1] || ''}`.slice(0, 300)); });
        }
        saude.seg++;
        if (!vp || !vp.currentSrc) saude.preto++;
        else if (vp.paused || vp.readyState < 3) saude.parado++;
        if (vp) {
          const q: any = (vp as any).getVideoPlaybackQuality ? (vp as any).getVideoPlaybackQuality() : { droppedVideoFrames: (vp as any).webkitDroppedFrameCount || 0, totalVideoFrames: (vp as any).webkitDecodedFrameCount || 0 };
          const d = Number(q.droppedVideoFrames || 0), t = Number(q.totalVideoFrames || 0);
          if (t >= qAnt.t) { saude.perdidos += d - qAnt.d; saude.quadros += t - qAnt.t; }
          qAnt = { d, t };
          const nomeV = vp.currentSrc.includes('/cache/') ? decodeURIComponent(vp.currentSrc.split('/cache/')[1].split('?')[0]).slice(-40) : '';
          if (nomeV && vp.videoWidth && !saude.arquivos[nomeV]) saude.arquivos[nomeV] = `${vp.videoWidth}x${vp.videoHeight}`;
        }
        const cam = doc?.getElementById('live-video') as HTMLVideoElement | null;
        if (cam && !cam.paused && cam.readyState >= 3) saude.camera++;
        if (Date.now() - ultimoEnvio > 120000 && saude.seg >= 30) {
          ultimoEnvio = Date.now();
          registrarEvento('replica_saude', { ...saude, pct_perdidos: saude.quadros ? Math.round((saude.perdidos / saude.quadros) * 1000) / 10 : null });
          Object.assign(saude, { seg: 0, parado: 0, preto: 0, trocas: 0, perdidos: 0, quadros: 0, arquivos: {}, camera: 0 });
        }
      } catch { /* a página ainda está carregando */ }
      try {
        const v = ref.current?.contentDocument?.getElementById('video-propaganda') as HTMLVideoElement | null;
        const src = v?.currentSrc || v?.src || '';
        const nome = src.includes('/cache/') ? decodeURIComponent(src.split('/cache/')[1].split('?')[0]) : '';
        if (nome && nome !== atual) {
          fechar();
          atual = nome; desde = Date.now(); saude.trocas++;
          const info = mapa.get(nome);
          marcarTocando({ tipo: 'anuncio', titulo: nome, cliente: info?.nome || '', pedido_id: info?.pedido || null, formato: 'replica' });
        }
      } catch { /* a página ainda está carregando */ }
    }, 1000);
    registrarEvento('replica', { predio: predioId.slice(0, 8) });
    return () => { clearInterval(id); fechar(); };
  }, [ok, predioId]);

  if (ok === false) return <>{alternativa}</>;
  if (ok === null) return <Aviso texto="Abrindo a tela do prédio…" />;
  return (
    <iframe ref={ref} title="Tela do elevador" src={`/painel-web/ui/index.html?p=${encodeURIComponent(predioId.slice(0, 8))}&tela=1${camera ? '' : '&cam=0'}`}
      style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, border: 0, background: '#0c0610' }} />
  );
}

/** Só o quadro de avisos do síndico (TV horizontal do prédio). */
export function AvisosFrame({ predioId, style }: { predioId: string; style?: React.CSSProperties }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { let vivo = true; prepararReplica().then((v) => { if (vivo) setOk(v); }); return () => { vivo = false; }; }, []);
  if (!ok) return null;
  return (
    <iframe title="Avisos do condomínio" src={`/painel-web/ui/avisos.html?p=${encodeURIComponent(predioId.slice(0, 8))}&tela=1`}
      style={{ position: 'absolute', border: 0, background: 'transparent', ...style }} />
  );
}
