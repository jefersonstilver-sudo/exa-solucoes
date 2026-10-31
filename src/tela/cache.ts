/**
 * Cache dos vídeos no próprio aparelho: baixa um por vez (sem sufocar a internet do local), guarda no
 * Cache Storage e toca do disco. Se a internet cair, a tela continua com o que já baixou.
 * Também tira uma miniatura de cada vídeo (fundo desfocado e "A seguir").
 */
const NOME = 'exa-tela-midia-v1';
const blobs = new Map<string, string>();      // url remota -> blob: local
const miniaturas = new Map<string, string>(); // url remota -> data:image/jpeg
const ouvintes = new Set<() => void>();
let fila: string[] = [];
let baixando = false;
let desejados = new Set<string>();
export const estatisticas = { itens: 0, mb: 0, falhas: 0, baixando: '' };

const avisar = () => ouvintes.forEach((f) => f());
export const aoMudar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

const temCache = () => typeof caches !== 'undefined' && window.isSecureContext;

const MINI_KEY = 'exa-tela-mini';
try { const m = JSON.parse(localStorage.getItem(MINI_KEY) || '{}'); Object.entries(m).forEach(([k, v]) => miniaturas.set(k, String(v))); } catch { /* */ }
const salvarMinis = () => {
  try {
    const obj: Record<string, string> = {};
    [...miniaturas.entries()].filter(([k]) => desejados.has(k)).slice(-40).forEach(([k, v]) => { obj[k] = v; });
    localStorage.setItem(MINI_KEY, JSON.stringify(obj));
  } catch { /* */ }
};

/** URL para tocar agora: do disco se já baixou, senão direto da internet. */
export const fonte = (url: string) => blobs.get(url) || url;
export const miniatura = (url: string) => miniaturas.get(url) || '';

async function tirarMiniatura(url: string, src: string) {
  if (miniaturas.has(url)) return;
  await new Promise<void>((ok) => {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true;
    if (!src.startsWith('blob:')) v.crossOrigin = 'anonymous';
    let feito = false;
    const fim = () => { if (feito) return; feito = true; v.removeAttribute('src'); v.load(); ok(); };
    const t = setTimeout(fim, 15000);
    v.onloadedmetadata = () => { try { v.currentTime = Math.min(1.5, (v.duration || 3) / 3); } catch { fim(); } };
    v.onseeked = () => {
      try {
        const c = document.createElement('canvas');
        const r = v.videoWidth / v.videoHeight || 16 / 9;
        c.width = 320; c.height = Math.round(320 / r);
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
        miniaturas.set(url, c.toDataURL('image/jpeg', 0.72));
        salvarMinis();
        avisar();
      } catch { /* vídeo sem CORS: fica sem miniatura */ }
      clearTimeout(t); fim();
    };
    v.onerror = () => { clearTimeout(t); fim(); };
    v.src = src;
  });
}

async function baixarProximo() {
  if (baixando) return;
  const url = fila.shift();
  if (!url) { estatisticas.baixando = ''; return; }
  if (!desejados.has(url) || blobs.has(url)) { baixarProximo(); return; }
  baixando = true;
  estatisticas.baixando = url.split('/').pop()?.slice(0, 60) || '';
  try {
    const c = await caches.open(NOME);
    let r = await c.match(url);
    if (!r) {
      const net = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' });
      if (!net.ok) throw new Error(`HTTP ${net.status}`);
      await c.put(url, net.clone());
      r = await c.match(url);
    }
    if (r) {
      const b = await r.blob();
      if (b.size > 1000) {
        blobs.set(url, URL.createObjectURL(b));
        await tirarMiniatura(url, blobs.get(url)!);
      }
    }
  } catch (e) {
    estatisticas.falhas++;
    // sem cache: tira a miniatura direto da internet e tenta baixar de novo mais tarde
    tirarMiniatura(url, url).catch(() => {});
    setTimeout(() => { if (desejados.has(url) && !blobs.has(url)) { fila.push(url); baixarProximo(); } }, 5 * 60000);
  } finally {
    baixando = false;
    avisar();
    setTimeout(baixarProximo, 300);
  }
}

// miniaturas tiradas direto da internet (não esperam o download completo do vídeo)
let filaMini: string[] = [];
let tirando = false;
async function proximaMini() {
  if (tirando) return;
  const u = filaMini.shift();
  if (!u) return;
  tirando = true;
  try { if (!miniaturas.has(u) && desejados.has(u)) await tirarMiniatura(u, blobs.get(u) || u); } catch { /* */ }
  tirando = false;
  proximaMini();
}

/** Garante que estes vídeos fiquem no aparelho; apaga do disco o que saiu da programação. */
export async function sincronizar(urls: string[]) {
  desejados = new Set(urls.filter(Boolean));
  filaMini = [...desejados].filter((u) => !miniaturas.has(u));
  proximaMini();
  if (!temCache()) return;
  try { await (navigator.storage as any)?.persist?.(); } catch { /* */ }
  fila = [...desejados].filter((u) => !blobs.has(u));
  baixarProximo();
  try {
    const c = await caches.open(NOME);
    const chaves = await c.keys();
    let mb = 0, itens = 0;
    for (const req of chaves) {
      if (!desejados.has(req.url)) {
        await c.delete(req);
        const b = blobs.get(req.url);
        if (b) { URL.revokeObjectURL(b); blobs.delete(req.url); }
      } else itens++;
    }
    const est = await navigator.storage?.estimate?.();
    if (est?.usage) mb = Math.round(est.usage / 1048576);
    estatisticas.itens = itens; estatisticas.mb = mb;
  } catch { /* */ }
}

/** Ao abrir a tela sem internet: recupera do disco o que já tinha. */
export async function aquecer(urls: string[]) {
  if (!temCache()) return;
  try {
    const c = await caches.open(NOME);
    for (const u of urls) {
      if (blobs.has(u)) continue;
      const r = await c.match(u);
      if (r) { const b = await r.blob(); if (b.size > 1000) blobs.set(u, URL.createObjectURL(b)); }
    }
    avisar();
  } catch { /* */ }
}

export async function limparTudo() {
  try { await caches.delete(NOME); } catch { /* */ }
  blobs.forEach((b) => URL.revokeObjectURL(b));
  blobs.clear(); miniaturas.clear();
  try { localStorage.removeItem(MINI_KEY); } catch { /* */ }
}
