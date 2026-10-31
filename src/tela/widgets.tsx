/** Peças visuais reaproveitadas pelos layouts (mesmo vidro/gradiente da UI dos NUCs v11). */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { Camera, Noticia } from './api';
import { descreverClima, useClima, useHora, useRodizio } from './tempo';
import { miniatura } from './cache';
import type { ItemFaixa } from './motor';
import { registrarErro } from './registro';

export const LOGO = '/site/exa-branco.svg';
export const LOGO_PORTAL = '/site/parceiro-portal-da-cidade.png';

export function Logo({ altura = 30, style }: { altura?: number; style?: React.CSSProperties }) {
  return <img src={LOGO} alt="EXA" style={{ height: altura, width: 'auto', display: 'block', ...style }} />;
}

// ---------- ícones (traço, mesmo estilo dos artboards) ----------
const P: Record<string, React.ReactNode> = {
  lua: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
  parcial: <><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" /><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" /><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" /></>,
  nuvem: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  neblina: <><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M16 17H7M17 21H9" /></>,
  garoa: <><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" /></>,
  chuva: <><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M16 14v6M8 14v6M12 16v6" /></>,
  tempestade: <><path d="M6 16.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 9" /><path d="m13 12-3 5h4l-3 5" /></>,
  jornal: <><path d="M15 18h-5M18 14h-8M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" /><rect x="10" y="6" width="8" height="4" rx="1" /></>,
  camera: <><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" /></>,
};
export function Icone({ nome, tamanho = 40, traco = 1.7 }: { nome: string; tamanho?: number; traco?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[nome] || P.nuvem}
    </svg>
  );
}
export function IconeClima({ codigo, dia, tamanho }: { codigo: number; dia: boolean; tamanho?: number }) {
  const { icone } = descreverClima(codigo);
  return <Icone nome={icone === 'sol' && !dia ? 'lua' : icone} tamanho={tamanho} />;
}

// ---------- hora / clima ----------
export function Hora({ tamanho = 92, style }: { tamanho?: number; style?: React.CSSProperties }) {
  const { hora } = useHora();
  return <div className="grande" style={{ fontSize: tamanho, letterSpacing: -tamanho * 0.035, ...style }}>{hora}</div>;
}
export function DataTexto({ tipo = 'longa', tamanho = 15, style }: { tipo?: 'longa' | 'curta' | 'media'; tamanho?: number; style?: React.CSSProperties }) {
  const t = useHora();
  return <div className="rotulo" style={{ fontSize: tamanho, ...style }}>{tipo === 'longa' ? t.dataLonga : tipo === 'curta' ? t.dataCurta : t.dataMedia}</div>;
}
export function Temperatura({ tamanho = 62, comTexto = true, textoTam = 17 }: { tamanho?: number; comTexto?: boolean; textoTam?: number }) {
  const c = useClima();
  if (!c) return <span className="grande" style={{ fontSize: tamanho * 0.6, opacity: 0.6 }}>Foz</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
      <span className="grande" style={{ fontSize: tamanho, letterSpacing: -tamanho * 0.03 }}>{c.temp}°</span>
      {comTexto && <span style={{ fontSize: textoTam, fontWeight: 600 }}>{descreverClima(c.codigo).texto}</span>}
    </span>
  );
}
export function IconeAgora({ tamanho = 54 }: { tamanho?: number }) {
  const c = useClima();
  return <IconeClima codigo={c?.codigo ?? 0} dia={c?.dia ?? true} tamanho={tamanho} />;
}
export function TextoClima() {
  const c = useClima();
  return <>{c ? descreverClima(c.codigo).texto : 'Foz do Iguaçu'}</>;
}
export function Previsao({ tamanho = 17 }: { tamanho?: number }) {
  const c = useClima();
  if (!c?.previsao?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: tamanho, fontWeight: 700, textAlign: 'right' }}>
      {c.previsao.map((p) => <span key={p.dia}>{p.dia} <b style={{ fontWeight: 800 }}>{p.max}°</b></span>)}
    </div>
  );
}

// ---------- QR ----------
const qrCache = new Map<string, string>();
export function QR({ valor, tamanho = 110 }: { valor: string; tamanho?: number }) {
  const [img, setImg] = useState(qrCache.get(valor) || '');
  useEffect(() => {
    if (!valor || qrCache.has(valor)) { setImg(qrCache.get(valor) || ''); return; }
    QRCode.toDataURL(valor, { margin: 0, width: 240, errorCorrectionLevel: 'M' }).then((d: string) => { qrCache.set(valor, d); setImg(d); }).catch(() => {});
  }, [valor]);
  if (!valor || !img) return null;
  const pad = Math.round(tamanho * 0.055);
  return (
    <div style={{ width: tamanho, height: tamanho, flex: 'none', borderRadius: 12, background: '#fff', padding: pad }}>
      <img src={img} alt="" style={{ width: tamanho - pad * 2, height: tamanho - pad * 2, display: 'block' }} />
    </div>
  );
}

// ---------- notícias ----------
export function useNoticiaAtual(noticias: Noticia[] | undefined, ms = 15000) {
  const lista = noticias || [];
  const i = useRodizio(lista.length, ms);
  return { n: lista[i] as Noticia | undefined, i };
}
const categoriaRotulo = (n?: Noticia) => {
  const c = (n?.categoria || '').trim();
  if (!c) return 'Cidade';
  return c.length > 18 ? c.slice(0, 18) : c;
};
const origemRotulo = (n?: Noticia) => {
  const o = `${n?.origem || ''} ${n?.categoria || ''}`.toLowerCase();
  if (/curios/.test(o)) return 'Curiosidades';
  if (/brasil|cnn/.test(o)) return 'Notícias · Brasil';
  return 'Notícias · Foz';
};

/** Cartão de notícia em vidro (H1, H2, H4, L1, L2, L4). Sem notícia: mostra a previsão do tempo. */
export function CartaoNoticia({ noticias, linhas = 4, tamanho = 26, qr = 96, horizontal = false, style, barra = true }: {
  noticias?: Noticia[]; linhas?: number; tamanho?: number; qr?: number; horizontal?: boolean; style?: React.CSSProperties; barra?: boolean;
}) {
  const { n, i } = useNoticiaAtual(noticias);
  if (!n) {
    return (
      <div className="vidro" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
        <div className="rotulo" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><i className="ponto" style={{ background: '#ffc35a' }} />Próximos dias em Foz</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}><IconeAgora tamanho={64} /><Previsao tamanho={tamanho * 0.8} /></div>
      </div>
    );
  }
  return (
    <div className="vidro" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden', ...style }}>
      <div className="rotulo" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><i className="ponto" />{origemRotulo(n)}</div>
      <div key={i} className="troca" style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: horizontal ? 18 : 12, flex: 1, minHeight: 0, alignItems: horizontal ? 'center' : 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!horizontal && <span className="etiqueta" style={{ alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px' }}>{categoriaRotulo(n)}</span>}
          <div className="corta" style={{ fontSize: tamanho, fontWeight: 700, lineHeight: 1.22, WebkitLineClamp: linhas }}>{n.titulo}</div>
        </div>
        {n.link ? <div style={{ marginTop: horizontal ? 0 : 'auto' }}><QR valor={n.link} tamanho={qr} /></div> : null}
      </div>
      {barra && <i key={`b${i}`} style={{ position: 'absolute', left: 0, bottom: 0, height: 4, background: 'linear-gradient(90deg,#ff4d5e,#ffc35a)', animation: 'enche 15s linear forwards' }} />}
    </div>
  );
}

// ---------- câmera ao vivo (HLS do Portal da Cidade) ----------
let hlsMod: any = null;
const carregarHls = async () => { if (!hlsMod) hlsMod = (await import('hls.js')).default; return hlsMod; };

/** Toca uma câmera. Se não aparecer imagem em 10 s ou der erro, chama onFalha (a tela pula, nunca fica preta). */
export function CameraAoVivo({ cam, onFalha, onPronta }: { cam: Camera; onFalha?: () => void; onPronta?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [pronta, setPronta] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let hls: any = null, acabou = false;
    const falha = (m: string) => { if (acabou) return; acabou = true; registrarErro(`câmera ${cam.nome}: ${m}`); onFalha?.(); };
    const t = setTimeout(() => falha('sem imagem em 10 s'), 10000);
    const tocando = () => { clearTimeout(t); setPronta(true); onPronta?.(); };
    el.addEventListener('playing', tocando);
    (async () => {
      try {
        const Hls = await carregarHls();
        if (acabou) return;
        if (Hls?.isSupported()) {
          hls = new Hls({ maxBufferLength: 8, backBufferLength: 0, liveSyncDurationCount: 2, enableWorker: true });
          hls.on(Hls.Events.ERROR, (_: unknown, d: any) => { if (d?.fatal) falha(`hls ${d.type}`); });
          hls.loadSource(cam.url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}));
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = cam.url;
          el.play().catch(() => {});
        } else falha('aparelho sem HLS');
      } catch (e) { falha(String((e as Error)?.message || e)); }
    })();
    el.addEventListener('error', () => falha('erro de vídeo'));
    return () => {
      acabou = true; clearTimeout(t);
      el.removeEventListener('playing', tocando);
      try { hls?.destroy(); } catch { /* */ }
      el.removeAttribute('src'); el.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.url]);
  return (
    <>
      {!pronta && <div className="cam-vazia"><Icone nome="camera" tamanho={72} traco={1.4} /></div>}
      <video ref={ref} className="cam-video" muted playsInline autoPlay style={{ opacity: pronta ? undefined : 0 }} />
    </>
  );
}

/** Câmeras se revezando dentro de um quadro (L2, H7). Câmera que falha é pulada por 5 min. */
export function CameraRodizio({ cameras, children, onSemCamera }: { cameras: Camera[]; children?: (c: Camera) => React.ReactNode; onSemCamera?: () => void }) {
  const [i, setI] = useState(0);
  const ruins = useRef(new Map<string, number>());
  const boas = useMemo(() => cameras, [cameras]);
  const cam = boas.length ? boas[i % boas.length] : null;
  const pular = (falhou: boolean) => {
    if (falhou && cam) ruins.current.set(cam.url, Date.now());
    for (let n = 1; n <= boas.length; n++) {
      const c = boas[(i + n) % boas.length];
      const t = ruins.current.get(c.url);
      if (!t || Date.now() - t > 5 * 60000) { setI((i + n) % boas.length); return; }
    }
    onSemCamera?.();
  };
  useEffect(() => {
    if (!cam) return;
    const t = setTimeout(() => pular(false), (cam.segundos || 14) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, cam?.url]);
  if (!cam) return null;
  return (
    <>
      <CameraAoVivo key={cam.url} cam={cam} onFalha={() => pular(true)} />
      {children?.(cam)}
    </>
  );
}

export function SeloAoVivo({ tamanho = 15, texto = 'AO VIVO', style }: { tamanho?: number; texto?: string; style?: React.CSSProperties }) {
  return <span className="ao-vivo" style={{ fontSize: tamanho, padding: `${tamanho * 0.45}px ${tamanho}px`, ...style }}><i />{texto}</span>;
}
export function Credito({ cam, tamanho = 15, style }: { cam: Camera; tamanho?: number; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: tamanho, fontWeight: 700, ...style }}>
      Imagem: {cam.credito}
    </span>
  );
}

// ---------- "A seguir" ----------
export function proximosDe(itens: ItemFaixa[], atual: ItemFaixa | null, n: number) {
  if (!itens.length) return [];
  const i = atual ? itens.findIndex((x) => x.k === atual.k) : -1;
  const out: ItemFaixa[] = [];
  const vistos = new Set<string>();
  for (let k = 1; k <= itens.length && out.length < n; k++) {
    const it = itens[(i + k + itens.length) % itens.length];
    if (it.tipo !== 'video') continue;
    const id = `${it.v.pedido_id}:${it.v.video_id}`;
    if (vistos.has(id) || (atual?.tipo === 'video' && it.v.video_id === atual.v.video_id)) continue;
    vistos.add(id);
    out.push(it);
  }
  return out;
}
export function Miniatura({ it, altura, destaque, tamanhoNome = 18, gap = 10 }: { it: ItemFaixa; altura?: number; destaque?: boolean; tamanhoNome?: number; gap?: number }) {
  if (it.tipo !== 'video') return null;
  const m = miniatura(it.v.url);
  const casa = it.v.tipo === 'casa';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0 }}>
      {m ? <img src={m} alt="" style={{ width: '100%', height: altura, aspectRatio: altura ? undefined : '16 / 9', objectFit: 'cover', borderRadius: 12, display: 'block', boxShadow: destaque || casa ? '0 0 0 3px #ffc35a' : undefined }} />
        : <div style={{ width: '100%', height: altura, aspectRatio: altura ? undefined : '16 / 9', borderRadius: 12, background: 'linear-gradient(160deg,#2a2f3e,#12141c)', boxShadow: destaque || casa ? '0 0 0 3px #ffc35a' : undefined }} />}
      <span className="uma-linha" style={{ fontSize: tamanhoNome, fontWeight: 700, color: casa ? '#ffc35a' : undefined }}>{it.v.cliente || it.v.titulo}{casa ? ' · da casa' : ''}</span>
    </div>
  );
}
