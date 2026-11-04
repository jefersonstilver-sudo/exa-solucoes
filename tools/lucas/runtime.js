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
    L._box('logo', x, y, w, h, '', ctx); return { x, y, w, h };
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
  // caixa em coordenadas de TELA: aplica o translate/scale/rotate atual do ctx (senao o verificador acusa 'fora da tela' sem estar)
  L._box = (kind, x, y, w, h, txt, ctx) => {
    if (ctx && ctx.getTransform) {
      const m = ctx.getTransform(); const pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      x = Math.min(...xs); y = Math.min(...ys); w = Math.max(...xs) - x; h = Math.max(...ys) - y;
    }
    boxes.push({ kind, x, y, w, h, txt });
  };
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
    if ((o.alpha == null || o.alpha > 0.05)) L._box('texto', bx, y, wmax, h, str, ctx);
    return { w: wmax, h, size, lines: lines.length };
  };

  // ---------- MOTION DE ESTUDIO (04/11/2026, padrao prompt-motion.com) ----------
  // mola fechada (sem estado): 0 -> 1 com overshoot pequeno. k rigidez, c amortecimento.
  L.spring = (t, t0, k = 190, c = 19, m = 1) => { const x = t - t0; if (x <= 0) return 0; const w = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
    if (z >= 1) return 1 - Math.exp(-w * x) * (1 + w * x); const wd = w * Math.sqrt(1 - z * z);
    const v = 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x)); return Math.abs(1 - v) < 0.004 && x > 0.25 ? 1 : v; };
  L.e.whip = (x) => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2); // chicote: lento-rapidissimo-lento
  /** foto em cover com rotacao, sombra e cantos (para cartoes em leque que viram paineis). */
  L.photo = (ctx, img, x, y, w, h, o = {}) => {
    if (!img || w < 1 || h < 1) return false; ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.translate(x + w / 2, y + h / 2); if (o.rot) ctx.rotate(o.rot);
    if (o.shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow * 0.35; L.rr(ctx, -w / 2, -h / 2, w, h, o.radius || 0); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore(); }
    if (o.filter) ctx.filter = o.filter;
    const r = L.drawImage(ctx, img, -w / 2, -h / 2, w, h, { fit: o.fit || 'cover', zoom: o.zoom, panX: o.panX, panY: o.panY, radius: o.radius || 0.01 }); ctx.restore(); return r; };
  const fstr = (o) => (o.italic ? 'italic ' : '') + (o.weight || 800) + ' ' + Math.round(o.size || 80) + "px '" + (o.font || 'Inter') + "', 'Inter', sans-serif";
  /** titulo PALAVRA POR PALAVRA: cada palavra sobe de uma mascara, do desfoque ao nitido. (x,y) = topo. o.out = instante de saida.
      o: {size, font, weight, italic, color, align, stagger(.07), dur(.55), out, letter}. Devolve {w,h}. */
  L.words = (ctx, str, x, y, t, t0, o = {}) => {
    str = String(str || ''); const size = o.size || 84, st = o.stagger ?? 0.07, dur = o.dur ?? 0.55;
    ctx.save(); ctx.font = fstr({ ...o, size }); ctx.letterSpacing = (o.letter || 0) + 'px'; ctx.textBaseline = 'top';
    const ws = str.split(/\s+/).filter(Boolean), sp = ctx.measureText(' ').width, wd = ws.map((w) => ctx.measureText(w).width), tot = wd.reduce((a, b) => a + b, 0) + sp * Math.max(0, ws.length - 1);
    let xx = o.align === 'center' ? x - tot / 2 : o.align === 'right' ? x - tot : x; const x0 = xx; let vis = 0;
    ws.forEach((w, i) => { const p = L.prog(t, t0 + i * st, t0 + i * st + dur, L.e.out); if (p > 0) {
        let dy = (1 - p) * size * 0.9, a = L.clamp(p * 2.5); if (o.out != null && t > o.out) { const q = L.prog(t, o.out + i * 0.03, o.out + i * 0.03 + 0.25, L.e.in); dy -= q * size; a *= 1 - q; }
        ctx.save(); ctx.beginPath(); ctx.rect(xx - 10, y - size * 0.1, wd[i] + 20, size * 1.35); ctx.clip(); if (p < 0.7) ctx.filter = 'blur(' + ((1 - p / 0.7) * 8).toFixed(1) + 'px)';
        ctx.globalAlpha *= a; ctx.fillStyle = o.color || '#fff'; ctx.fillText(w, xx, y + dy); ctx.restore(); vis = Math.max(vis, a); }
      xx += wd[i] + sp; });
    ctx.restore(); if (vis > 0.5) L._box('texto', x0, y, tot, size * 1.15, str, ctx); return { w: tot, h: size * 1.15 }; };
  /** abertura LETRA POR LETRA com mola (titulo de impacto). (x,y) = topo. */
  L.chars = (ctx, str, x, y, t, t0, o = {}) => {
    str = String(str || ''); const size = o.size || 120, span = o.span ?? 0.45; ctx.save(); ctx.font = fstr({ ...o, size }); ctx.textBaseline = 'top'; ctx.letterSpacing = (o.letter || 0) + 'px';
    const tot = ctx.measureText(str).width; let xx = o.align === 'center' ? x - tot / 2 : o.align === 'right' ? x - tot : x; const x0 = xx;
    for (const ch of str) { const cw = ctx.measureText(ch).width, p = L.spring(t, t0 + (xx - x0) / Math.max(1, tot) * span, 230, 17);
      ctx.save(); ctx.beginPath(); ctx.rect(xx - 6, y - size * 0.1, cw + 12, size * 1.35); ctx.clip(); ctx.translate(0, (1 - p) * size * 0.95); if (p < 0.8) ctx.filter = 'blur(' + ((1 - p / 0.8) * 6).toFixed(1) + 'px)';
      ctx.globalAlpha *= L.clamp(p * 2); ctx.fillStyle = o.color || '#fff'; ctx.fillText(ch, xx, y); ctx.restore(); xx += cw; }
    ctx.restore(); if (t > t0 + span) L._box('texto', x0, y, tot, size * 1.15, str, ctx); return { w: tot, h: size * 1.15 }; };
  /** fio que SE DESENHA (sublinhado pintado a mao), de x a x+w em y. o: {color, lw(4), wave(5), dur(.6), alpha} */
  L.drawLine = (ctx, x, y, w, t, t0, o = {}) => { const p = L.prog(t, t0, t0 + (o.dur || 0.6), L.e.out); if (p <= 0) return; ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.strokeStyle = o.color || '#fff'; ctx.lineWidth = o.lw || 4; ctx.lineCap = 'round'; ctx.beginPath(); const wv = o.wave ?? 5;
    for (let i = 0; i <= 40 * p; i++) { const u = i / 40, px = x + u * w, py = y + Math.sin(u * Math.PI * 1.4) * wv; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore(); };
  /** anel que se desenha (em volta de logo, selo, QR). p 0..1 */
  L.ring = (ctx, cx, cy, r, p, o = {}) => { if (p <= 0) return; ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.strokeStyle = o.color || '#fff'; ctx.lineWidth = o.lw || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p)); ctx.stroke(); ctx.restore(); };
  /** texto com BRILHO que varre (luxo/fechamento). (x,y) = topo. o como L.words + sweepColor. */
  L.sweep = (ctx, str, x, y, t, t0, o = {}) => { const size = o.size || 86; if (!L._off) { L._off = document.createElement('canvas'); L._off.width = L.W; L._off.height = 400; }
    const oc = L._off.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, L.W, 400); oc.font = fstr({ ...o, size }); oc.textBaseline = 'top'; oc.letterSpacing = (o.letter || 0) + 'px';
    const tw = oc.measureText(str).width, xx = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x; oc.fillStyle = o.color || '#fff'; oc.fillText(str, xx, 40);
    const sx = xx + L.mix(-300, tw + 300, L.prog(t, t0 + 0.5, t0 + 1.5, L.e.inOut)); oc.globalCompositeOperation = 'source-atop';
    const g = oc.createLinearGradient(sx - 120, 0, sx + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, o.sweepColor || 'rgba(255,248,230,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); oc.fillStyle = g; oc.fillRect(0, 0, L.W, 400); oc.globalCompositeOperation = 'source-over';
    const p = L.prog(t, t0, t0 + 0.55, L.e.out); if (p <= 0) return { w: tw, h: size * 1.15 };
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 0.1, L.W, size * 1.35); ctx.clip(); ctx.globalAlpha *= L.clamp(p * 2); ctx.drawImage(L._off, 0, y - 40 + (1 - p) * size); ctx.restore();
    if (p > 0.5) L._box('texto', xx, y, tw, size * 1.15, str, ctx); return { w: tw, h: size * 1.15 }; };
  /** IRIS: recorta um circulo crescendo de (cx,cy). Use: ctx.save(); L.iris(ctx,cx,cy,p); desenhaCenaNova(); ctx.restore(); L.irisRing(...) */
  L.iris = (ctx, cx, cy, p) => { const R = Math.hypot(L.W, L.H) * 1.05 * p; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, R), 0, Math.PI * 2); ctx.clip(); return R; };
  L.irisRing = (ctx, cx, cy, p, color = '#fff') => { if (p <= 0 || p >= 1) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 8 * (1 - p); ctx.beginPath(); ctx.arc(cx, cy, Math.hypot(L.W, L.H) * 1.05 * p, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
  /** QR RASTREADO PADRAO EXA: cartao branco que entra com mola em o.t0, fica ATE O FIM (>= 5 s) e, a partir de o.final.t0, desliza e cresce ate o QR do cartao final.
      o: {t0(1.8), x, y, size(170), label('CHAME NO WHATS'), labelColor, ring(cor do anel), final:{x,y,size,t0}}. Sem L.img.qr nao desenha nada. */
  L.qrCard = (ctx, t, o = {}) => { const im = L.img.qr; if (!im) return null; const t0 = o.t0 ?? 1.8; if (t < t0) return null;
    const S0 = o.size || 170, X0 = o.x ?? (L.SAFE.x + L.SAFE.w - S0 - 10), Y0 = o.y ?? (L.SAFE.y + L.SAFE.h - S0 - 52), F = o.final;
    const e = L.spring(t, t0, 170, 20), a = L.clamp((t - t0) / 0.25), m = F ? L.prog(t, F.t0, F.t0 + 0.7, L.e.inOut) : 0;
    const s = L.mix(S0, F ? F.size : S0, m), x = L.mix(X0, F ? F.x : X0, m), y = L.mix(Y0, F ? F.y : Y0, m), lab = 1 - L.prog(m, 0, 0.4, L.e.linear), lh = 42 * lab;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + s / 2, y + s / 2); const k = L.mix(0.55, 1, e); ctx.scale(k, k); ctx.translate(-(x + s / 2), -(y + s / 2));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 24; L.rr(ctx, x - 10, y - 10, s + 20, s + 20 + lh, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    ctx.imageSmoothingEnabled = false; ctx.drawImage(im, x, y, s, s); ctx.imageSmoothingEnabled = true;
    if (lab > 0.02) { ctx.globalAlpha *= lab; L.rr(ctx, x, y + s + 6, s, 30, 9); ctx.fillStyle = o.labelColor || '#111'; ctx.fill(); ctx.font = "800 16px 'Inter', sans-serif"; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.label || 'CHAME NO WHATS', x + s / 2, y + s + 21); }
    ctx.restore();
    const rp = L.prog(t, t0 + 0.05, t0 + 0.7, L.e.out), ra = 1 - L.prog(t, t0 + 0.9, t0 + 1.3, L.e.linear);
    if (rp > 0 && ra > 0) L.ring(ctx, X0 + S0 / 2, Y0 + S0 / 2 + 16, S0 * 0.82, rp, { color: o.ring || '#fff', lw: 6, alpha: ra * a });
    return { x, y, s }; };
  // registra todo QR desenhado (direto ou pelo qrCard) para a validacao medir quanto tempo ele fica na tela
  const _di = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
    if (img && img === L.img.qr && this.globalAlpha > 0.6) { const [x, y, w, h] = a.length >= 8 ? [a[4], a[5], a[6], a[7]] : a.length >= 4 ? a : [a[0], a[1], img.width, img.height]; L._box('qr', x, y, w, h, '', this); }
    return _di.call(this, img, ...a); };

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
    const qr = boxes.filter((b) => b.kind === 'qr' && b.w > 40); if (qr.length) out.push('\u00a7QR:' + Math.round(Math.max(...qr.map((b) => Math.min(b.w, b.h)))));
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
  /** MOTION BLUR (obturador 180 graus): media de n subquadros dentro de meio quadro. Trechos parados saem com 1 render so. */
  window.__frameMB = async (t, n = 6) => {
    const cv = document.getElementById('c'), ctx = cv.getContext('2d'), sh = 0.5 / L.FPS;
    if (!L._acc) { L._acc = document.createElement('canvas'); L._acc.width = L.W; L._acc.height = L.H; L._tiny = document.createElement('canvas'); L._tiny.width = 96; L._tiny.height = Math.round(96 * L.H / L.W); }
    const acc = L._acc.getContext('2d'), tiny = L._tiny.getContext('2d', { willReadFrequently: true });
    const snap = () => { tiny.drawImage(cv, 0, 0, L._tiny.width, L._tiny.height); return tiny.getImageData(0, 0, L._tiny.width, L._tiny.height).data; };
    const lay = await window.__frame(t + sh); const b = snap();
    await window.__frame(t); const a = snap(); let d = 0; for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d / (a.length / 4) < 2.5 || n < 2) return lay; // quase parado: o quadro t ja esta no canvas
    acc.globalAlpha = 1; acc.drawImage(cv, 0, 0);
    for (let k = 1; k < n; k++) { await window.__frame(t + k / n * sh); acc.globalAlpha = 1 / (k + 1); acc.drawImage(cv, 0, 0); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(L._acc, 0, 0); ctx.restore(); return lay;
  };
})();
