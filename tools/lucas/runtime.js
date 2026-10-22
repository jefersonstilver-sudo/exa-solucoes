/* Lucas Editor: runtime das cenas. A cena e UMA funcao pura renderAt(t, ctx) que desenha o quadro
   inteiro no instante t (segundos). Mesmo t => mesmo quadro: e isso que permite exportar quadro a quadro. */
(function () {
  const S = window.SPEC;
  const L = (window.L = {});
  L.W = S.W; L.H = S.H; L.DUR = S.DUR; L.FPS = S.FPS; L.VERTICAL = S.H > S.W;
  // area segura: nada importante fora dela (borda da moldura do elevador)
  L.SAFE = L.VERTICAL
    ? { x: Math.round(S.W * 0.07), y: Math.round(S.H * 0.06), w: Math.round(S.W * 0.86), h: Math.round(S.H * 0.88) }
    : { x: Math.round(S.W * 0.05), y: Math.round(S.H * 0.07), w: Math.round(S.W * 0.90), h: Math.round(S.H * 0.86) };
  L.MARCA = S.marca || {};
  L.C = {};
  (L.MARCA.cores || []).forEach((c, i) => { if (c && c.hex) { L.C['c' + i] = c.hex; if (c.nome) L.C[String(c.nome).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')] = c.hex; } });

  // ---------- tempo e easing ----------
  const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  L.clamp = cl;
  L.e = {
    linear: (x) => x,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
  };
  /** progresso 0..1 entre a e b (segundos), com easing */
  L.prog = (t, a, b, ease) => (ease || L.e.out)(cl((t - a) / Math.max(1e-6, b - a)));
  L.mix = (a, b, p) => a + (b - a) * p;
  /** entra em [a, a+inD], fica, sai em [b-outD, b]: devolve 0..1 */
  L.inOut = (t, a, b, inD = 0.4, outD = 0.35, ease) => Math.min(L.prog(t, a, a + inD, ease), 1 - L.prog(t, b - outD, b, L.e.in));
  L.rand = (seed) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  // ---------- formas ----------
  L.rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  L.grain = (ctx, t, alpha = 0.05) => {
    if (!L._grain) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = (L.rand(i) * 255) | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); L._grain = c; }
    const f = Math.floor(t * 12); ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-(L.rand(f) * 256) | 0, -(L.rand(f + 7) * 256) | 0); ctx.fillStyle = ctx.createPattern(L._grain, 'repeat'); ctx.fillRect(0, 0, L.W + 256, L.H + 256); ctx.restore();
  };

  // ---------- imagens ----------
  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  L.img = { logo: null, qr: null, fotos: [] };
  /** desenha imagem em (x,y,w,h). fit 'cover' (preenche, corta) ou 'contain'. zoom>1 e panX/panY (-1..1) para Ken Burns. */
  L.drawImage = (ctx, img, x, y, w, h, o = {}) => {
    if (!img) return false;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return false;
    const fit = o.fit || 'cover', z = o.zoom || 1;
    const s = (fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * z;
    const dw = iw * s, dh = ih * s;
    const dx = x + (w - dw) / 2 + (o.panX || 0) * Math.max(0, (dw - w) / 2);
    const dy = y + (h - dh) / 2 + (o.panY || 0) * Math.max(0, (dh - h) / 2);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (fit === 'cover' || o.radius) { if (o.radius) L.rr(ctx, x, y, w, h, o.radius); else { ctx.beginPath(); ctx.rect(x, y, w, h); } ctx.clip(); }
    ctx.drawImage(img, dx, dy, dw, dh); ctx.restore(); return true;
  };
  /** logo do cliente com altura h, centrada em (cx, cy) por padrao. Devolve {x,y,w,h}. */
  L.logo = (ctx, cx, cy, h, o = {}) => {
    const im = L.img.logo; if (!im) return null;
    let w = h * im.naturalWidth / im.naturalHeight; if (o.maxW && w > o.maxW) { w = o.maxW; h = w * im.naturalHeight / im.naturalWidth; }
    const x = o.align === 'left' ? cx : o.align === 'right' ? cx - w : cx - w / 2, y = cy - h / 2;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.drawImage(im, x, y, w, h); ctx.restore();
    L._box('logo', x, y, w, h); return { x, y, w, h };
  };

  // ---------- clipes de video (sequencias de quadros extraidas pelo render) ----------
  const cache = new Map(), need = new Set();
  const frameKey = (i, f) => i + ':' + f;
  L.clips = (S.assets.clips || []).map((c) => ({ w: c.w, h: c.h, dur: c.dur, legenda: c.legenda || '', origem: c.origem || 'cliente' }));
  /** quadro do clipe i no tempo local tl (s). loop=true repete; senao congela no ultimo quadro. */
  L.clipFrame = (i, tl, loop = true) => {
    const c = S.assets.clips[i]; if (!c) return null;
    let f = Math.floor(Math.max(0, tl) * c.fps); f = loop ? f % c.n : Math.min(f, c.n - 1);
    const k = frameKey(i, f); const im = cache.get(k);
    if (im) { cache.delete(k); cache.set(k, im); return im; }
    need.add(k);
    for (let d = 1; d < 30; d++) { const n = cache.get(frameKey(i, Math.max(0, f - d))); if (n) return n; }
    return null;
  };
  L.clip = (ctx, i, tl, x, y, w, h, o = {}) => L.drawImage(ctx, L.clipFrame(i, tl, o.loop !== false), x, y, w, h, o);
  L._flush = async () => {
    if (!need.size) return false;
    const ks = [...need]; need.clear();
    await Promise.all(ks.map(async (k) => { const [i, f] = k.split(':').map(Number); const c = S.assets.clips[i]; const im = await load(c.dir + '/' + String(f + 1).padStart(5, '0') + '.jpg'); if (im) { try { await im.decode(); } catch (_) {} cache.set(k, im); } }));
    // limite por memoria (~900 MB de quadros decodificados), nao por quantidade
    let px = 0; for (const im of cache.values()) px += (im.naturalWidth || 1) * (im.naturalHeight || 1);
    while (cache.size > 24 && px * 4 > 900e6) { const k0 = cache.keys().next().value; const im0 = cache.get(k0); px -= (im0.naturalWidth || 1) * (im0.naturalHeight || 1); cache.delete(k0); }
    return true;
  };

  // ---------- texto ----------
  const boxes = [];
  L._box = (kind, x, y, w, h, txt) => boxes.push({ kind, x, y, w, h, txt });
  const fontStr = (o, size) => (o.italic ? 'italic ' : '') + (o.weight || 800) + ' ' + Math.round(size) + "px '" + (o.font || 'Inter') + "', 'Inter', sans-serif";
  /** Texto com quebra por palavras e auto-ajuste: diminui a fonte ate caber em maxW x maxLines. Nunca corta.
      o: {size, font, weight, italic, color, align('left'|'center'|'right'), maxW, maxLines, lineH, letter(px), upper, alpha, shadow, stroke}
      (x,y) = topo da primeira linha. Devolve {w, h, size, lines}. */
  L.text = (ctx, str, x, y, o = {}) => {
    str = String(str == null ? '' : str); if (o.upper) str = str.toUpperCase();
    const maxW = o.maxW || L.SAFE.w, maxLines = o.maxLines || 3, lh = o.lineH || 1.08;
    let size = o.size || 80, lines = [];
    ctx.save();
    for (let k = 0; k < 40; k++) {
      ctx.font = fontStr(o, size); ctx.letterSpacing = (o.letter || 0) + 'px';
      lines = []; let cur = '';
      for (const wd of str.split(/\s+/).filter(Boolean)) { const tst = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tst).width <= maxW || !cur) cur = tst; else { lines.push(cur); cur = wd; } }
      if (cur) lines.push(cur);
      const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
      if (lines.length <= maxLines && widest <= maxW + 0.5) break;
      size *= 0.94;
    }
    ctx.textBaseline = 'top'; ctx.textAlign = o.align || 'left'; ctx.fillStyle = o.color || '#fff';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow) { ctx.shadowColor = o.shadow === true ? 'rgba(0,0,0,.45)' : o.shadow; ctx.shadowBlur = size * 0.25; ctx.shadowOffsetY = size * 0.06; }
    let wmax = 0;
    lines.forEach((l, i) => { const yy = y + i * size * lh; if (o.stroke) { ctx.lineWidth = o.stroke.w || size * 0.08; ctx.strokeStyle = o.stroke.color || '#000'; ctx.strokeText(l, x, yy); } ctx.fillText(l, x, yy); wmax = Math.max(wmax, ctx.measureText(l).width); });
    ctx.restore();
    const h = lines.length * size * lh, bx = (o.align === 'center' ? x - wmax / 2 : o.align === 'right' ? x - wmax : x);
    if ((o.alpha == null || o.alpha > 0.05)) L._box('texto', bx, y, wmax, h, str);
    return { w: wmax, h, size, lines: lines.length };
  };

  // ---------- checagem de layout do quadro (usada pela validacao) ----------
  L._beginFrame = () => { boxes.length = 0; };
  L._layout = () => {
    const out = [], s = L.SAFE, tol = 2;
    for (const b of boxes) {
      if (b.w < 4 || b.h < 4) continue;
      if (b.x < -tol || b.y < -tol || b.x + b.w > L.W + tol || b.y + b.h > L.H + tol) out.push(b.kind + ' fora da tela: "' + String(b.txt || '').slice(0, 40) + '"');
      else if (b.kind === 'texto' && (b.x < s.x - tol || b.y < s.y - tol || b.x + b.w > s.x + s.w + tol || b.y + b.h > s.y + s.h + tol)) out.push('texto fora da area segura: "' + String(b.txt || '').slice(0, 40) + '"');
    }
    const tx = boxes.filter((b) => b.kind === 'texto' && b.w > 4);
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
      const a = tx[i], b = tx[j]; const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix > 8 && iy > 8 && ix * iy > 0.15 * Math.min(a.w * a.h, b.w * b.h)) out.push('textos sobrepostos: "' + String(a.txt).slice(0, 25) + '" x "' + String(b.txt).slice(0, 25) + '"');
    }
    return [...new Set(out)];
  };

  // ---------- carga ----------
  L.ready = (async () => {
    const a = S.assets;
    if (a.logo) L.img.logo = await load(a.logo.src);
    if (a.qr) L.img.qr = await load(a.qr.src);
    L.img.fotos = await Promise.all((a.fotos || []).map((f) => load(f.src)));
    L.fotos = (a.fotos || []).map((f, i) => ({ w: f.w, h: f.h, legenda: f.legenda || '', origem: f.origem || 'cliente', img: L.img.fotos[i] }));
    try { await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); await document.fonts.ready; } catch (_) {}
    return true;
  })();

  /** desenha o quadro t garantindo os quadros de clipe carregados (2 passadas no maximo) */
  window.__frame = async (t) => {
    await L.ready;
    const cv = document.getElementById('c'), ctx = cv.getContext('2d');
    for (let pass = 0; pass < 3; pass++) {
      L._beginFrame(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, L.W, L.H);
      window.renderAt(t, ctx); ctx.restore();
      if (!(await L._flush())) break;
    }
    return L._layout();
  };
})();
