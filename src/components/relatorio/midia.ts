// EXA (06/11/2026) — imagens do relatório: miniatura de cada vídeo (quadro capturado do próprio vídeo, no navegador),
// imagem vinda de URL (logo, foto do prédio) e mapa dos prédios (OpenStreetMap). Tudo vira data URL para o PDF.
const cacheMini = new Map<string, Promise<string | null>>();
let fila: Promise<unknown> = Promise.resolve();

function capturar(url: string, largura = 360): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let feito = false;
    const fim = (r: string | null) => { if (feito) return; feito = true; v.removeAttribute('src'); v.load(); resolve(r); };
    const t = window.setTimeout(() => fim(null), 15000);
    v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadedmetadata = () => { try { v.currentTime = Math.min(2.5, (v.duration || 3) / 3); } catch { fim(null); } };
    v.onseeked = () => {
      try {
        const c = document.createElement('canvas');
        const ratio = (v.videoHeight || 16) / (v.videoWidth || 9);
        c.width = largura; c.height = Math.round(largura * ratio);
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
        window.clearTimeout(t); fim(c.toDataURL('image/jpeg', 0.78));
      } catch { window.clearTimeout(t); fim(null); }
    };
    v.onerror = () => { window.clearTimeout(t); fim(null); };
    v.src = url;
  });
}

/** Uma de cada vez (não abre 20 vídeos ao mesmo tempo no celular do cliente). */
export function miniaturaDoVideo(url?: string | null): Promise<string | null> {
  if (!url) return Promise.resolve(null);
  if (!cacheMini.has(url)) {
    const p = fila.then(() => capturar(url));
    fila = p.catch(() => null);
    cacheMini.set(url, p);
  }
  return cacheMini.get(url)!;
}

export async function imagemComoDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) return null;
    const b = await r.blob();
    return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(String(f.result)); f.onerror = () => res(null); f.readAsDataURL(b); });
  } catch { return null; }
}

// ---------------- mapa (tiles do OpenStreetMap, Web Mercator) ----------------
const lon2x = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const lat2y = (lat: number, z: number) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z; };

export type Pino = { lat: number; lng: number; nome: string };
/** Enquadra os prédios numa área W×H: devolve os tiles (posição em px) e a posição de cada pino. */
export function montarMapa(pinos: Pino[], W: number, H: number) {
  const ok = pinos.filter((p) => p.lat && p.lng && Math.abs(p.lat) > 1);
  if (!ok.length) return null;
  const lats = ok.map((p) => p.lat), lngs = ok.map((p) => p.lng);
  const cLat = (Math.min(...lats) + Math.max(...lats)) / 2, cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  let z = 16;
  for (; z > 10; z--) {
    const w = (lon2x(Math.max(...lngs), z) - lon2x(Math.min(...lngs), z)) * 256;
    const h = (lat2y(Math.min(...lats), z) - lat2y(Math.max(...lats), z)) * 256;
    if (w < W * 0.8 && h < H * 0.8) break;
  }
  const cx = lon2x(cLng, z) * 256, cy = lat2y(cLat, z) * 256;
  const x0 = cx - W / 2, y0 = cy - H / 2;
  const tiles: { url: string; left: number; top: number }[] = [];
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++)
    for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++)
      tiles.push({ url: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`, left: tx * 256 - x0, top: ty * 256 - y0 });
  const pos = ok.map((p) => ({ ...p, left: lon2x(p.lng, z) * 256 - x0, top: lat2y(p.lat, z) * 256 - y0 }));
  return { tiles, pos };
}

/** Mapa pronto como imagem (para o PDF). */
export async function mapaComoImagem(pinos: Pino[], W = 900, H = 520): Promise<string | null> {
  const m = montarMapa(pinos, W, H);
  if (!m) return null;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#EEF1EE'; g.fillRect(0, 0, W, H);
  await Promise.all(m.tiles.map((t) => new Promise<void>((res) => {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload = () => { g.drawImage(i, t.left, t.top); res(); }; i.onerror = () => res(); i.src = t.url;
  })));
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, H);
  for (const p of m.pos) {
    g.beginPath(); g.arc(p.left, p.top, 9, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.arc(p.left, p.top, 6.5, 0, Math.PI * 2); g.fillStyle = '#9C1E1E'; g.fill();
  }
  g.font = '12px sans-serif'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText('© OpenStreetMap', W - 104, H - 8);
  try { return c.toDataURL('image/jpeg', 0.82); } catch { return null; }
}
