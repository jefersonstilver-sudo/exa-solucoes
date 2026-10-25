// ========= AVISOS (v28) - imagens, PDFs e avisos do Nando; nada e esticado =========

// ---------- Estado ----------
let _avisos = [];
let _avisoIdx = 0;
let _avisosTimer = null;

let _listaSig = null;     // assinatura da lista filtrada
let _currentVersion = ""; // cache-busting vindo do updates.json

let _pollTimer = null;
let _isFetching = false;
let _lastErrorLogTs = 0;
const ERROR_LOG_MIN_MS = 60000;

// ---------- Constantes ----------
const AVISOS_KEY = "CondominiumNotices";
const AVISO_ITEM_MS = 8000;
const POLL_EMPTY_OR_ONE_MS = 300000;         // 5min para 0 ou 1 aviso
const POLL_ERROR_BACKOFF_MS = 300000;
const JSON_URL = "/cache/updates.json";

const PLACEHOLDER_SRC = "/assets/no_notices.png";
const TARGET_W = 1080;
const TARGET_H = 1920;

// ---------- Util ----------
function parseLocalDateTime(s) {
  if (!s) return null;
  const m = String(s).replace("T", " ").match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return new Date(s);
  const [_, Y, M, D, h, mn, sc] = m;
  return new Date(+Y, +M - 1, +D, +h, +mn, +(sc || 0));
}

function _abs(u) {
  try { return new URL(u, location.origin).href; }
  catch { return u; }
}

// v26: a imagem cabe INTEIRA (sem esticar nem cortar); as sobras ganham o fundo desfocado da propria imagem
function _desenharContido(ctx, fonte, fw, fh, fundoClaro) {
  // fundo: a propria imagem bem desfocada (desenha pequeno e amplia)
  try {
    const p = document.createElement("canvas"); p.width = 27; p.height = 48;
    const pc = p.getContext("2d");
    const rc = Math.max(27 / fw, 48 / fh);
    pc.drawImage(fonte, (27 - fw * rc) / 2, (48 - fh * rc) / 2, fw * rc, fh * rc);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(p, 0, 0, TARGET_W, TARGET_H);
    ctx.fillStyle = fundoClaro ? "rgba(20,10,28,.55)" : "rgba(10,5,16,.35)";
    ctx.fillRect(0, 0, TARGET_W, TARGET_H);
  } catch (e) {
    ctx.fillStyle = "#140a1c"; ctx.fillRect(0, 0, TARGET_W, TARGET_H);
  }
  const r = Math.min(TARGET_W / fw, TARGET_H / fh);
  const w = fw * r, h = fh * r;
  ctx.drawImage(fonte, (TARGET_W - w) / 2, (TARGET_H - h) / 2, w, h);
}

async function _to1080x1920(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const cv = document.createElement("canvas");
        cv.width = TARGET_W;
        cv.height = TARGET_H;
        const ctx = cv.getContext("2d");
        const quase = Math.abs(img.width / img.height - TARGET_W / TARGET_H) < 0.02;
        if (quase) ctx.drawImage(img, 0, 0, TARGET_W, TARGET_H);   // ja e vertical 9:16: ocupa tudo
        else _desenharContido(ctx, img, img.width, img.height, false);
        resolve(cv.toDataURL("image/jpeg", 0.92));
      } catch (e) {
        console.error("Erro no processamento da imagem:", e);
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = _abs(url);
  });
}

// ---------- v26: tipo, tempo e camadas ----------
function _tipoAviso(a) {
  const m = String(a && a.mensagem || "").toLowerCase();
  if (/(^|\/)nando_[^\/]*\.png$/.test(m)) return "nando";   // v28: aviso do Nando dentro de um PNG
  if (m.endsWith(".pdf")) return "pdf";
  if (m.endsWith(".nando.json")) return "nando";
  return "imagem";
}
// tempo de tela: vem no titulo como "[20s]" (o NUC nao guarda o campo timing); senao timing; senao 15 s
function _tempoAviso(a) {
  const m = String(a && a.titulo || "").match(/\[(\d{1,3})s\]/i);
  if (m) return Math.min(120, Math.max(5, +m[1])) * 1000;
  if (a && a.timing != null && !isNaN(+a.timing)) return +a.timing;
  return 15000;
}

let _camadaNando = null, _nandoAtual = null, _falhasSeguidas = 0;
function _camada() {
  if (_camadaNando) return _camadaNando;
  const caixa = document.querySelector(".aviso-container");
  if (!caixa) return null;
  _camadaNando = document.createElement("div");
  _camadaNando.className = "aviso-nando-camada";
  caixa.appendChild(_camadaNando);
  return _camadaNando;
}
function _limparNando() {
  if (_nandoAtual) { try { _nandoAtual.remover(); } catch (e) {} _nandoAtual = null; }
  if (_camadaNando) _camadaNando.classList.remove("on");
}
const _jsonCache = {};
// v28: o aviso do Nando vem num PNG com um bloco de texto "nando" (JSON em base64)
function _dadosDoPng(buf) {
  const v = new DataView(buf); let p = 8;
  while (p + 8 <= v.byteLength) {
    const len = v.getUint32(p);
    const tipo = String.fromCharCode(v.getUint8(p + 4), v.getUint8(p + 5), v.getUint8(p + 6), v.getUint8(p + 7));
    if (tipo === "tEXt") {
      const d = new Uint8Array(buf, p + 8, len); const z = d.indexOf(0);
      const chave = String.fromCharCode.apply(null, Array.from(d.subarray(0, z)));
      if (chave === "nando") {
        let b64 = ""; const resto = d.subarray(z + 1);
        for (let i = 0; i < resto.length; i += 8192) b64 += String.fromCharCode.apply(null, Array.from(resto.subarray(i, i + 8192)));
        const bin = atob(b64); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return JSON.parse(new TextDecoder().decode(bytes));
      }
    }
    if (tipo === "IEND") break;
    p += 12 + len;
  }
  return null;
}
async function _mostrarNando(url) {
  if (!window.NandoAviso) throw new Error("aviso-nando.js ausente");
  const dados = _jsonCache[url] || (_jsonCache[url] = await fetch(url, { cache: "no-store" }).then(async (r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (!/\.png(\?|$)/i.test(url)) return r.json();
    const d = _dadosDoPng(await r.arrayBuffer());
    if (!d) throw new Error("PNG sem dados do Nando");
    return d;
  }));
  const cam = _camada();
  if (!cam) throw new Error("sem caixa");
  // a imagem de baixo continua valendo (vigia do index.html): um fundo simples
  const cv = document.createElement("canvas"); cv.width = 54; cv.height = 96;
  const c = cv.getContext("2d"); c.fillStyle = "#140a1c"; c.fillRect(0, 0, 54, 96);
  _setImagemSuave(cv.toDataURL("image/png"));
  const antigo = _nandoAtual;
  cam.classList.add("on");
  _nandoAtual = window.NandoAviso.montar(cam, dados);
  if (antigo) setTimeout(() => { try { antigo.remover(); } catch (e) {} }, 700);
}

// PDF: pdf.js carregado so quando existe um PDF (mesma CDN do hls.js)
let _pdfjsP = null;
// pdf.js vem no pacote do painel (ui/lib/pdfjs); se faltar, tenta a CDN (a mesma do hls.js)
const PDFJS_FONTES = [
  ["./lib/pdfjs/pdf.min.js", "./lib/pdfjs/pdf.worker.min.js"],
  ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js",
   "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"],
];
function _carregarScript(src) {
  return new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => { s.remove(); erro(new Error("falhou " + src)); };
    document.head.appendChild(s);
  });
}
function _pdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsP) return _pdfjsP;
  _pdfjsP = (async () => {
    for (const [lib, worker] of PDFJS_FONTES) {
      try {
        await _carregarScript(lib);
        if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(worker, location.href).href; return window.pdfjsLib; }
      } catch (e) { /* tenta a proxima */ }
    }
    _pdfjsP = null;
    throw new Error("pdf.js indisponivel");
  })();
  return _pdfjsP;
}
const _pdfDocs = {};
let _pdfPagina = 1;
// v30: retangulo com conteudo (tudo que nao e branco), com uma pequena folga
function _areaUtil(pc) {
  try {
    const sw = 300, sh = Math.max(1, Math.round(pc.height * sw / pc.width));
    const t = document.createElement("canvas"); t.width = sw; t.height = sh;
    const tc = t.getContext("2d"); tc.drawImage(pc, 0, 0, sw, sh);
    const px = tc.getImageData(0, 0, sw, sh).data;
    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      if (px[i] < 235 || px[i + 1] < 235 || px[i + 2] < 235) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0 || (x1 - x0) < sw * 0.2 || (y1 - y0) < sh * 0.2) return { x: 0, y: 0, w: pc.width, h: pc.height };
    const k = pc.width / sw, folga = Math.round(pc.width * 0.015);
    const x = Math.max(0, Math.floor(x0 * k) - folga), y = Math.max(0, Math.floor(y0 * k) - folga);
    const xf = Math.min(pc.width, Math.ceil((x1 + 1) * k) + folga), yf = Math.min(pc.height, Math.ceil((y1 + 1) * k) + folga);
    return { x, y, w: xf - x, h: yf - y };
  } catch (e) { return { x: 0, y: 0, w: pc.width, h: pc.height }; }
}

async function _paginaPdf(url, n) {
  const lib = await _pdfjs();
  const doc = _pdfDocs[url] || (_pdfDocs[url] = await lib.getDocument({ url, isEvalSupported: false }).promise);
  const pg = await doc.getPage(Math.min(n, doc.numPages));
  const v1 = pg.getViewport({ scale: 1 });
  const escala = Math.min(TARGET_W / v1.width, TARGET_H / v1.height) * 1.6;   // nitido ao reduzir
  const vp = pg.getViewport({ scale: escala });
  const pc = document.createElement("canvas"); pc.width = Math.ceil(vp.width); pc.height = Math.ceil(vp.height);
  const pctx = pc.getContext("2d"); pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, pc.width, pc.height);
  await pg.render({ canvasContext: pctx, viewport: vp }).promise;
  const cv = document.createElement("canvas"); cv.width = TARGET_W; cv.height = TARGET_H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#1a1022"; ctx.fillRect(0, 0, TARGET_W, TARGET_H);
  // v30: corta as margens brancas da pagina para o documento ocupar o quadro (letra maior)
  const c = _areaUtil(pc);
  const r = Math.min((TARGET_W - 24) / c.w, (TARGET_H - 24) / c.h);
  const w = c.w * r, h = c.h * r;
  ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 30;
  ctx.drawImage(pc, c.x, c.y, c.w, c.h, (TARGET_W - w) / 2, (TARGET_H - h) / 2, w, h);
  return { dataUrl: cv.toDataURL("image/jpeg", 0.92), total: doc.numPages };
}

async function _mostrarPadrao() {
  _limparNando();
  _pdfPagina = 1;
  const img = document.getElementById("aviso-img");
  if (!img) return;
  const dataUrl = await _to1080x1920(PLACEHOLDER_SRC);
  _setImagemSuave(dataUrl);
}

// FILTRO: Remove PDFs e checa datas
function _filtrarAvisos(list) {
  const agora = new Date();
  return (list || []).filter((a) => {
    if (a.status === "deleted") return false;
    if (!a.mensagem) return false;

    // v26: PDF e aviso do Nando agora sao exibidos

    const ini = parseLocalDateTime(a.data_ini);
    const fim = parseLocalDateTime(a.data_fim);
    if (ini && agora < ini) return false;
    if (fim && agora > fim) return false;
    return true;
  });
}

function _assinaturaLista(list) {
  return JSON.stringify(
    (list || []).map((a) => ({
      msg: a.mensagem,
      ini: a.data_ini,
      fim: a.data_fim,
      tit: a.titulo || null,
      st: a.status || null,
    }))
  );
}

function _urlAviso(aviso) {
  const caminho = `/cache/${aviso.mensagem}`;
  const u = _currentVersion ? `${caminho}?v=${_currentVersion}` : caminho;
  return _abs(u);
}

function _setImagemSuave(url) {
  const img = document.getElementById("aviso-img");
  if (!img) return;
  const target = _abs(url);
  if (_abs(img.src || "") === target) return;

  const probe = new Image();
  probe.onload = () => {
    img.src = target;
  };
  probe.src = target;
}

// ---------- Nucleo de exibicao ----------
// ---------- Nucleo de exibicao (CORRIGIDO) ----------
function _tocarAvisoAtual() {
  if (_avisosTimer) {
    clearTimeout(_avisosTimer);
    _avisosTimer = null;
  }

  if (!_avisos.length) {
    _mostrarPadrao();
    return;
  }

  const aviso = _avisos[_avisoIdx];
  if (!aviso) {
    _avancar();
    return;
  }

  const url = _urlAviso(aviso);
  const tipo = _tipoAviso(aviso);
  const tempo = _tempoAviso(aviso);
  const idxAgora = _avisoIdx;

  const falhou = (e) => {
    console.error("avisos: falha ao exibir " + aviso.mensagem, e);
    _limparNando();
    _pdfPagina = 1;
    _falhasSeguidas++;
    // todos falharam: mostra o padrao e tenta de novo em 1 min (nunca fica piscando)
    if (_falhasSeguidas >= _avisos.length) {
      _falhasSeguidas = 0;
      _setImagemSuave(PLACEHOLDER_SRC);
      _avisosTimer = setTimeout(_avancar, 60000);
      return;
    }
    _avisosTimer = setTimeout(_avancar, 300);
  };
  const deuCerto = () => { _falhasSeguidas = 0; };

  if (tipo === "nando") {
    _mostrarNando(url).then(() => {
      deuCerto();
      _avisosTimer = setTimeout(_avancar, tempo);
    }).catch(falhou);
    return;
  }

  if (tipo === "pdf") {
    _paginaPdf(url, _pdfPagina).then((r) => {
      deuCerto();
      _limparNando();
      _setImagemSuave(r.dataUrl);
      _avisosTimer = setTimeout(() => {
        if (_avisoIdx === idxAgora && _pdfPagina < r.total) { _pdfPagina++; _tocarAvisoAtual(); }
        else { _pdfPagina = 1; _avancar(); }
      }, tempo);
    }).catch(falhou);
    return;
  }

  _to1080x1920(url).then((dataUrl) => {
    _limparNando();
    _setImagemSuave(dataUrl);
    _avisosTimer = setTimeout(_avancar, tempo);
  }).catch(() => {
    _avancar();
  });
}

function _avancar() {
  if (!_avisos.length) {
    _mostrarPadrao();
    return;
  }

  const len = _avisos.length;
  const nextIdx = (_avisoIdx + 1) % len;
  const reiniciou = nextIdx === 0 && len >= 2;

  _avisoIdx = nextIdx;

  if (reiniciou) {
    _fetchAtualizacoesSilencioso().finally(() => {
      _tocarAvisoAtual();
    });
    return;
  }

  _tocarAvisoAtual();
}

// ---------- Fetch e Polling ----------
function _aplicarLista(avisosFiltrados, versionFromJson) {
  const sig = _assinaturaLista(avisosFiltrados);
  if (_listaSig === sig) return;

  _listaSig = sig;
  _currentVersion = String(versionFromJson || "");
  _avisos = avisosFiltrados;
  _avisoIdx = 0;
  _pdfPagina = 1;

  _tocarAvisoAtual();
}

function _fetchAtualizacoesSilencioso() {
  if (_isFetching) return Promise.resolve();

  _isFetching = true;
  const url = `${JSON_URL}?ts=${Date.now()}`;

  return fetch(url, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const filtrados = _filtrarAvisos(data?.[AVISOS_KEY] || []);
      _aplicarLista(filtrados, data?.version);
      _schedulePollIfNeeded(filtrados.length);
    })
    .catch((e) => {
      const now = Date.now();
      if (now - _lastErrorLogTs > ERROR_LOG_MIN_MS) {
        console.error("Erro ao buscar updates.json:", e);
        _lastErrorLogTs = now;
      }
      _scheduleNextPoll(POLL_ERROR_BACKOFF_MS);
    })
    .finally(() => {
      _isFetching = false;
    });
}

function _scheduleNextPoll(ms) {
  if (_pollTimer) clearTimeout(_pollTimer);
  _pollTimer = setTimeout(_fetchAtualizacoesSilencioso, ms);
}

function _schedulePollIfNeeded(qtd) {
  if (qtd <= 1) {
    _scheduleNextPoll(POLL_EMPTY_OR_ONE_MS);
  } else if (_pollTimer) {
    clearTimeout(_pollTimer);
    _pollTimer = null;
  }
}

function iniciarAvisos() {
  _fetchAtualizacoesSilencioso();
}

iniciarAvisos();
window.__avisosLoaded = true;
