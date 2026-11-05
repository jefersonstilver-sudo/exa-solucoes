/**
 * Desempenho da tela: modo leve (TV box fraca) e medição da fluidez, mandada a cada batimento.
 *
 * Modo leve: liga sozinho em aparelho fraco (navegador do sistema antigo, até 2 GB, até 4 núcleos)
 * ou por config.leve da tela (true/false força). Tira sombras, desfoques, animações contínuas e o
 * esmaecer entre vídeos — o que mais pesa na placa de vídeo de TV box.
 *
 * Medição (custa quase nada): por 10 s a cada minuto conta os quadros da página (requestAnimationFrame);
 * o tempo todo conta tarefas longas (> 50 ms), quadros de vídeo perdidos e as vezes que o vídeo parou
 * para carregar. Tudo vai em `saude.fluidez` e, com o app Android novo, `saude.aparelho` (CPU, temperatura,
 * memória, Wi-Fi).
 */
const ponte: any = (window as any).ExaTela;
const qs = new URLSearchParams(location.search);

function safe<T>(f: () => T, padrao: T): T { try { return f(); } catch { return padrao; } }

export const versaoChrome = (): number => {
  const m = /Chrome\/(\d+)/.exec(navigator.userAgent);
  return m ? Number(m[1]) : 0;
};

const memoriaNativaMb = (): number => {
  const j = ponte?.infoAparelho ? safe(() => JSON.parse(ponte.infoAparelho()), null as any) : null;
  return Number(j?.memoria_mb) || 0;
};

/** Aparelho fraco? (usado quando a tela não força config.leve) */
export function aparelhoFraco(): boolean {
  if (qs.get('leve') === '1') return true;
  if (qs.get('leve') === '0') return false;
  const c = versaoChrome();
  const mem = (navigator as any).deviceMemory || 0;
  const nuc = navigator.hardwareConcurrency || 0;
  const memN = memoriaNativaMb();
  return (c > 0 && c < 90) || (mem > 0 && mem <= 2) || (memN > 0 && memN <= 2600) || (nuc > 0 && nuc <= 4);
}

let leveAtual: boolean | null = null;
/** Liga/desliga a classe .leve no documento. `forcar` vem de config.leve da tela (undefined = automático). */
export function aplicarLeve(forcar?: boolean | null) {
  const leve = typeof forcar === 'boolean' ? forcar : aparelhoFraco();
  if (leve === leveAtual) return leve;
  leveAtual = leve;
  document.documentElement.classList.toggle('leve', leve);
  return leve;
}
export const modoLeve = () => !!leveAtual;

// ---------------------------------------------------------------- placa de vídeo (uma vez)
let gpuCache: string | null = null;
export function placaDeVideo(): string {
  if (gpuCache !== null) return gpuCache;
  gpuCache = '';
  try {
    const cv = document.createElement('canvas');
    const gl: any = cv.getContext('webgl') || cv.getContext('experimental-webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const v = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      gpuCache = [v, r].filter(Boolean).join(' · ').slice(0, 120);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  } catch { /* sem WebGL */ }
  return gpuCache;
}

// ---------------------------------------------------------------- medição contínua
const m = {
  tarefas: 0, tarefasMs: 0, piorTarefa: 0,
  esperas: 0, travouMs: 0,
  // amostra de quadros da página (10 s por minuto)
  fps: null as number | null, fpsMin: null as number | null, travadas: 0, piorQuadro: 0, p95: 0,
};
const vidAnt = new WeakMap<HTMLVideoElement, { t: number; d: number }>();
let quadrosVideo = 0, perdidosVideo = 0;

/** Vídeos da página e da réplica (iframe do mesmo site). */
function videos(): HTMLVideoElement[] {
  const lista: HTMLVideoElement[] = Array.prototype.slice.call(document.querySelectorAll('video'));
  const ifs = document.querySelectorAll('iframe');
  for (let i = 0; i < ifs.length; i++) {
    const d = safe(() => (ifs[i] as HTMLIFrameElement).contentDocument, null as Document | null);
    if (d) lista.push(...Array.prototype.slice.call(d.querySelectorAll('video')));
  }
  return lista;
}

function lerVideos() {
  for (const v of videos()) {
    const q: any = (v as any).getVideoPlaybackQuality ? safe(() => (v as any).getVideoPlaybackQuality(), null) : null;
    const t = q ? q.totalVideoFrames : (v as any).webkitDecodedFrameCount;
    const d = q ? q.droppedVideoFrames : (v as any).webkitDroppedFrameCount;
    if (typeof t !== 'number') continue;
    const a = vidAnt.get(v);
    // quando o src muda, os contadores voltam a zero
    if (a && t >= a.t) { quadrosVideo += t - a.t; perdidosVideo += Math.max(0, (d || 0) - a.d); }
    vidAnt.set(v, { t, d: d || 0 });
  }
}

let iniciado = false;
let esperaDesde = 0;
export function iniciarMedicao() {
  if (iniciado) return;
  iniciado = true;
  // tarefas longas (Chrome 58+)
  try {
    const PO: any = (window as any).PerformanceObserver;
    if (PO) {
      const obs = new PO((lista: any) => {
        for (const e of lista.getEntries()) { m.tarefas++; m.tarefasMs += e.duration; if (e.duration > m.piorTarefa) m.piorTarefa = e.duration; }
      });
      obs.observe({ entryTypes: ['longtask'] });
    }
  } catch { /* sem suporte */ }
  // vídeo parou para carregar (waiting não sobe na árvore: escuta na captura)
  document.addEventListener('waiting', () => { m.esperas++; esperaDesde = Date.now(); }, true);
  document.addEventListener('playing', () => { if (esperaDesde) { m.travouMs += Date.now() - esperaDesde; esperaDesde = 0; } }, true);
  setInterval(lerVideos, 5000);
  // amostra de quadros: 10 s a cada 60 s
  const amostrar = () => {
    const ints: number[] = [];
    let ult = 0;
    const fimEm = performance.now() + 10000;
    const passo = (t: number) => {
      if (ult) ints.push(t - ult);
      ult = t;
      if (t < fimEm) requestAnimationFrame(passo);
      else {
        if (ints.length > 5) {
          const tot = ints.reduce((s, x) => s + x, 0);
          const ord = ints.slice().sort((a, b) => a - b);
          m.fps = Math.round((ints.length / tot) * 1000 * 10) / 10;
          // pior segundo da amostra
          let piorSeg = 999, acc = 0, n = 0;
          for (const x of ints) { acc += x; n++; if (acc >= 1000) { piorSeg = Math.min(piorSeg, n); acc = 0; n = 0; } }
          m.fpsMin = piorSeg === 999 ? m.fps : piorSeg;
          m.travadas = ints.filter((x) => x > 50).length;
          m.piorQuadro = Math.round(ord[ord.length - 1]);
          m.p95 = Math.round(ord[Math.floor(ord.length * 0.95)]);
        }
      }
    };
    requestAnimationFrame(passo);
  };
  setTimeout(amostrar, 15000);
  setInterval(amostrar, 60000);
}

/** O que vai em `saude` a cada batimento (e zera os contadores do período). */
export function retirarFluidez() {
  lerVideos();
  const f = {
    leve: modoLeve(),
    fps: m.fps, fps_pior_segundo: m.fpsMin, travadas_50ms: m.travadas, pior_quadro_ms: m.piorQuadro, quadro_p95_ms: m.p95,
    tarefas_longas: m.tarefas, tarefas_longas_ms: Math.round(m.tarefasMs), pior_tarefa_ms: Math.round(m.piorTarefa),
    video_quadros: quadrosVideo, video_perdidos: perdidosVideo,
    video_pct_perdidos: quadrosVideo ? Math.round((perdidosVideo / quadrosVideo) * 1000) / 10 : null,
    video_esperas: m.esperas, video_esperando_ms: m.travouMs,
  };
  m.tarefas = 0; m.tarefasMs = 0; m.piorTarefa = 0; m.esperas = 0; m.travouMs = 0;
  quadrosVideo = 0; perdidosVideo = 0;
  return f;
}

/** Saúde do aparelho que só o app Android sabe (CPU, temperatura, memória, Wi-Fi). Vazio no navegador comum. */
export function saudeNativa(): Record<string, unknown> | null {
  if (!ponte?.saudeNativa) return null;
  const j = safe(() => JSON.parse(ponte.saudeNativa()), null as any);
  return j && typeof j === 'object' ? j : null;
}
