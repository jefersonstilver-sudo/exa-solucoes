/**
 * Miniatura (1 quadro) dos vídeos dos pedidos, guardada no aparelho.
 *
 * Antes: cada cartão da lista abria um <video preload="metadata" #t=1> — o iPhone baixa e decodifica um vídeo
 * de ~12 MB por cartão, poucos de cada vez, e as miniaturas ficavam pretas e iam aparecendo uma a uma.
 * Agora: o quadro é tirado uma vez (fila de 2 vídeos por vez), vira um JPEG pequeno (~5–10 KB) guardado no
 * aparelho, e nas próximas aberturas aparece na hora. Os vídeos ficam no Storage do Supabase, que libera CORS.
 */

const PREFIXO = 'exa-mini:';
const INDICE = 'exa-mini-indice';
const MAX_GUARDADAS = 120;
const LARGURA = 200;
const TEMPO_MAX = 15000;
const PARALELO = 2;

const memoria = new Map<string, string>();
const andamento = new Map<string, Promise<string | null>>();
const fila: Array<() => void> = [];
let ativos = 0;

function chave(url: string) {
  // tira parâmetros de cache (?t=…) e o #t=1
  return PREFIXO + url.split('#')[0].split('?')[0];
}

export function miniaturaGuardada(url?: string | null): string | null {
  if (!url) return null;
  const k = chave(url);
  const m = memoria.get(k);
  if (m) return m;
  try {
    const v = localStorage.getItem(k);
    if (v) { memoria.set(k, v); return v; }
  } catch { /* armazenamento bloqueado (aba privada) */ }
  return null;
}

function guardar(url: string, dado: string) {
  const k = chave(url);
  memoria.set(k, dado);
  try {
    let idx: string[] = [];
    try { idx = JSON.parse(localStorage.getItem(INDICE) || '[]'); } catch { idx = []; }
    idx = idx.filter((x) => x !== k);
    idx.push(k);
    while (idx.length > MAX_GUARDADAS) { const velho = idx.shift(); if (velho) localStorage.removeItem(velho); }
    localStorage.setItem(k, dado);
    localStorage.setItem(INDICE, JSON.stringify(idx));
  } catch { /* cheio ou bloqueado: fica só na memória desta sessão */ }
}

function proximo() {
  while (ativos < PARALELO && fila.length) { ativos++; fila.shift()!(); }
}

function capturar(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let feito = false;
    const fim = (dado: string | null) => {
      if (feito) return;
      feito = true;
      window.clearTimeout(relogio);
      try { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } catch { /* nada */ }
      resolve(dado);
    };
    const relogio = window.setTimeout(() => fim(null), TEMPO_MAX);
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.preload = 'auto';
    v.onerror = () => fim(null);
    v.onloadedmetadata = () => {
      try { v.pause(); } catch { /* nada */ }
      const alvo = Math.min(1, Math.max(0, (v.duration || 2) * 0.3));
      try { v.currentTime = alvo; } catch { fim(null); }
    };
    v.onseeked = () => {
      // o iPhone às vezes só tem o quadro pronto um instante depois do seek (setTimeout e não requestAnimationFrame:
      // este não roda com o app em segundo plano)
      window.setTimeout(() => {
        try {
          const w = v.videoWidth, h = v.videoHeight;
          if (!w || !h) return fim(null);
          const c = document.createElement('canvas');
          c.width = LARGURA;
          c.height = Math.round((LARGURA * h) / w);
          const ctx = c.getContext('2d');
          if (!ctx) return fim(null);
          ctx.drawImage(v, 0, 0, c.width, c.height);
          // quadro todo preto = o vídeo ainda não tinha pintado: não guarda (tenta de novo na próxima abertura)
          const px = ctx.getImageData(0, 0, c.width, c.height).data;
          let soma = 0;
          for (let i = 0; i < px.length; i += 400) soma += px[i] + px[i + 1] + px[i + 2];
          if (soma < 30) return fim(null);
          fim(c.toDataURL('image/jpeg', 0.72));
        } catch { fim(null); }
      }, 80);
    };
    // o Safari do iPhone só carrega/decodifica vídeo que está na página e que tocou (mudo) — fica invisível, fora da tela
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    v.src = url;
    try { v.load(); } catch { /* nada */ }
    try { const t = v.play(); if (t && t.catch) t.catch(() => { /* sem autoplay: o seek abaixo ainda funciona na maioria */ }); } catch { /* nada */ }
  });
}

/** Gera (uma vez por vídeo, em fila) e guarda a miniatura. Devolve null se não deu (aí o cartão usa o vídeo). */
export function pedirMiniatura(url: string): Promise<string | null> {
  const pronta = miniaturaGuardada(url);
  if (pronta) return Promise.resolve(pronta);
  const k = chave(url);
  const ja = andamento.get(k);
  if (ja) return ja;
  const p = new Promise<string | null>((resolve) => {
    fila.push(() => {
      capturar(url).then((dado) => {
        if (dado) guardar(url, dado);
        resolve(dado);
      }).finally(() => { ativos--; andamento.delete(k); proximo(); });
    });
    proximo();
  });
  andamento.set(k, p);
  return p;
}
