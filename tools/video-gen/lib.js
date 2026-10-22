/* EXA Motion v8 - biblioteca K
   Estrategia herdada do video de lancamento da Sofia: cada frase vira uma DEMONSTRACAO visual concreta
   (celular com conversa, cartao de oferta, mapa, agenda, contadores, lista, selo), sobre um sistema visual unico:
   fundo escuro com brilho da cor da marca e granulado, cartoes com sombra, chips, tipografia Inter Display Black,
   entradas com back/expo, cenas que se sobrepoem ~0.35s e sempre algo em movimento. Dois formatos nativos:
   horizontal 1920x1080 / 10s e vertical 1080x1920 / 15s. Todo texto passa por auto-ajuste (nunca corta). */
(function () {
  'use strict';
  const P0 = { empresa: 'Sua Marca', segmento: 'comercio', mensagem: 'Sua marca no elevador', subtitulo: '', cta: 'Chame no WhatsApp', instagram: '', whats: '', formato: 'horizontal_10s', cor: '#e63027', cor2: '#ff5446', frases: [], numeros: [], assets: {} };
  const P = Object.assign({}, P0, window.P || {}); P.frases = (P.frases || []).filter(Boolean); P.assets = P.assets || {}; window.P = P;
  const vert = P.formato === 'vertical_premium_15s', W = vert ? 1080 : 1920, H = vert ? 1920 : 1080, DUR = vert ? 15 : 10, U = 1;
  const u = n => n + 'px';

  // ---------- cores (tokens) ----------
  const hx = h => { h = String(h || '#e63027').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const toHsl = c => { let [r, g, b] = hx(c).map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
  const hsl = (h, s, l, a) => a == null ? `hsl(${Math.round(h)},${Math.round(s * 100)}%,${Math.round(l * 100)}%)` : `hsla(${Math.round(h)},${Math.round(s * 100)}%,${Math.round(l * 100)}%,${a})`;
  const [AH, AS0] = toHsl(P.cor); const AS = Math.max(.62, AS0); const [BH] = toHsl(P.cor2 || P.cor);
  const C = {
    bg: hsl(AH, .22, .045), bg2: hsl(AH, .18, .075), card: hsl(AH, .16, .115), card2: hsl(AH, .14, .165), line: hsl(AH, .12, .26),
    accent: hsl(AH, AS, .52), accentHi: hsl(AH, AS, .64), accentDeep: hsl(AH, AS, .34), accent2: hsl(BH, Math.max(.6, AS), .6),
    glow: a => hsl(AH, AS, .38, a), ok: '#25d366', okInk: '#06281a', text: '#ffffff', muted: '#a3a8b8', ink: '#0b0c12'
  };
  P.corD = C.accentDeep; P.escuro = C.bg; P.claro = '#f2efe9';

  // ---------- fontes ----------
  const FF = { black: 'IDBlack', xb: 'IDXB', bold: 'IDBold', semi: 'ISemi', med: 'IMed', reg: 'IReg' };
  const FALL = ', Inter, "DejaVu Sans", Arial, sans-serif';
  const fam = k => (FF[k] || k) + FALL;
  const css0 = document.createElement('style');
  css0.textContent = Object.entries(FF).map(([k, f]) => `@font-face{font-family:${f};src:url(fonts/${f}.woff) format('woff');font-display:block}`).join('') +
    'html,body{margin:0;background:#000;overflow:hidden}*{box-sizing:border-box}#stage .kw{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .02em .08em}#stage .kw>span{display:inline-block}';
  document.head.appendChild(css0);
  window.__fonts = false;
  // a cena so e montada depois que as fontes carregam (as medidas de texto dependem delas)
  let started = false; window.__run = () => { if (started || !window.__fonts || !window.__scene) return; started = true; try { window.__scene(); } catch (e) { (window.ERRS = window.ERRS || []).push(String(e && e.message || e)); } };
  (document.fonts ? Promise.all(Object.values(FF).map(f => document.fonts.load('40px ' + f).catch(() => null))) : Promise.resolve()).then(() => { window.__fonts = true; window.__run(); });

  // ---------- palco ----------
  const st = document.createElement('div'); st.id = 'stage';
  st.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;transform-origin:0 0;font-family:${fam('med')};color:#fff;background:${C.bg}`;
  document.body.appendChild(st);
  const fit = () => { const k = window.__RENDER ? 1 : Math.min(innerWidth / W, innerHeight / H); st.style.transform = 'scale(' + k + ')'; };
  fit(); addEventListener('resize', fit);

  function el(css, html, parent) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;' + (css || ''); if (html != null) d.innerHTML = html; (parent || st).appendChild(d); return d; }
  function center(css, html, parent) { return el('left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;' + (css || ''), html, parent); }
  const R = r => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let seed = 11; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---------- layout: area segura e zonas por formato ----------
  const SAFE = vert ? { x: 64, y: 150, w: 952, h: 1640 } : { x: 110, y: 96, w: 1700, h: 888 };
  const ZONES = vert ? {
    head: { x: 64, y: 150, w: 952, h: 100 }, hero: { x: 64, y: 290, w: 952, h: 1000 }, text: { x: 64, y: 1320, w: 952, h: 440 },
    top: { x: 64, y: 290, w: 952, h: 640 }, bottom: { x: 64, y: 960, w: 952, h: 800 }, full: { x: 64, y: 290, w: 952, h: 1470 }
  } : {
    head: { x: 110, y: 70, w: 1700, h: 90 }, left: { x: 110, y: 190, w: 860, h: 800 }, right: { x: 1010, y: 160, w: 800, h: 840 },
    full: { x: 110, y: 190, w: 1700, h: 800 }, text: { x: 110, y: 190, w: 860, h: 800 }, hero: { x: 1010, y: 160, w: 800, h: 840 }
  };
  const zone = n => Object.assign({}, ZONES[n] || ZONES.full);

  // ---------- texto com auto-ajuste (nunca corta) ----------
  const meas = document.createElement('canvas').getContext('2d');
  const tw = (s, font, size) => { meas.font = `${size}px ${fam(font)}`; return meas.measureText(s).width; };
  function wrapLines(s, font, size, maxw) { const words = String(s).split(/\s+/).filter(Boolean); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (tw(t, font, size) <= maxw || !cur) cur = t; else { lines.push(cur); cur = w; } } if (cur) lines.push(cur); return lines; }
  function fitSize(s, font, maxSize, rect, lh, maxLines) {
    let size = maxSize;
    for (; size > 18; size -= 2) {
      const lines = wrapLines(s, font, size, rect.w);
      const widest = Math.max(...lines.map(l => tw(l, font, size)));
      if (widest <= rect.w && lines.length * size * (lh + .1) <= rect.h && lines.length <= (maxLines || 99)) return { size, lines };
    }
    return { size, lines: wrapLines(s, font, size, rect.w) };
  }
  // texto em linhas; cada palavra em mascara (para revelar). o: {font,size,color,align,lh,maxLines,accentLast,accentColor,valign,upper,shadow}
  function text(parent, s, rect, o) {
    o = o || {}; const font = o.font || 'black', lh = o.lh || 1.04; s = o.upper ? String(s).toUpperCase() : String(s);
    const { size, lines } = fitSize(s, font, o.size || 120, rect, lh, o.maxLines);
    const box = el(R(rect) + `display:flex;flex-direction:column;justify-content:${o.valign === 'top' ? 'flex-start' : o.valign === 'bottom' ? 'flex-end' : 'center'};align-items:${o.align === 'left' ? 'flex-start' : o.align === 'right' ? 'flex-end' : 'center'};text-align:${o.align || 'center'};font-family:${fam(font)};font-size:${size}px;line-height:${lh};letter-spacing:${font === 'black' || font === 'xb' ? '-0.02em' : '0'};color:${o.color || '#fff'};${o.shadow === false ? '' : 'text-shadow:0 4px 24px rgba(0,0,0,.35);'}`, '', parent);
    box.dataset.ktext = '1'; const spans = [];
    lines.forEach((ln, i) => {
      const row = document.createElement('div'); row.style.whiteSpace = 'nowrap';
      const acc = o.accentLast && lines.length > 1 && i === lines.length - 1;
      ln.split(' ').forEach((w, j) => { const m = document.createElement('span'); m.className = 'kw'; const sp = document.createElement('span'); sp.textContent = w; if (acc) sp.style.color = o.accentColor || C.accentHi; m.appendChild(sp); row.appendChild(m); if (j < ln.split(' ').length - 1) row.appendChild(document.createTextNode(' ')); spans.push(sp); });
      box.appendChild(row);
    });
    box.spans = spans; box.size = size; return box;
  }
  function reveal(tl, spans, at, o) { o = o || {}; const list = spans && spans.spans ? spans.spans : spans; tl.from(list, { yPercent: o.y == null ? 110 : o.y, rotation: o.rot || 0, opacity: o.fade ? 0 : 1, duration: o.d || .6, ease: o.ease || 'power4.out', stagger: o.s == null ? .07 : o.s }, at); return at + (o.d || .6) + (list.length - 1) * (o.s == null ? .07 : o.s); }
  // compat v7
  function words(parent, s, size, o) { o = o || {}; const r = { x: SAFE.x, y: SAFE.y + SAFE.h * .3, w: SAFE.w, h: size * 2.4 }; const b = text(parent || st, s, r, { size, font: 'black', upper: o.upper, color: o.color, align: o.align }); return { row: b, spans: b.spans }; }

  // ---------- icones (SVG desenhado) ----------
  const ICONS = {
    paw: a => `<g fill="${a}"><ellipse cx="50" cy="66" rx="22" ry="18"/><ellipse cx="21" cy="43" rx="9" ry="12"/><ellipse cx="40" cy="27" rx="9" ry="13"/><ellipse cx="60" cy="27" rx="9" ry="13"/><ellipse cx="79" cy="43" rx="9" ry="12"/></g>`,
    bone: a => `<g fill="${a}" transform="rotate(-35 50 50)"><circle cx="20" cy="38" r="12"/><circle cx="20" cy="62" r="12"/><circle cx="80" cy="38" r="12"/><circle cx="80" cy="62" r="12"/><rect x="20" y="38" width="60" height="24" rx="6"/></g>`,
    heart: a => `<path fill="${a}" d="M50 90 C8 60 10 26 32 22 C42 20 50 28 50 36 C50 28 58 20 68 22 C90 26 92 60 50 90Z"/>`,
    star: a => `<polygon fill="${a}" points="50,6 62,38 96,38 69,58 80,92 50,72 20,92 31,58 4,38 38,38"/>`,
    sparkle: a => `<path fill="${a}" d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4Z"/>`,
    dog: (a, b) => `<ellipse cx="18" cy="44" rx="13" ry="27" fill="${b}" transform="rotate(14 18 44)"/><ellipse cx="82" cy="44" rx="13" ry="27" fill="${b}" transform="rotate(-14 82 44)"/><circle cx="50" cy="52" r="32" fill="${a}"/><ellipse cx="50" cy="66" rx="16" ry="12" fill="#fff" opacity=".9"/><circle cx="38" cy="46" r="5" fill="#111"/><circle cx="62" cy="46" r="5" fill="#111"/><ellipse cx="50" cy="60" rx="7" ry="5" fill="#111"/>`,
    cat: (a, b) => `<polygon fill="${a}" points="20,42 24,6 46,26"/><polygon fill="${a}" points="80,42 76,6 54,26"/><polygon fill="${b}" points="26,36 28,16 40,28"/><polygon fill="${b}" points="74,36 72,16 60,28"/><circle cx="50" cy="56" r="32" fill="${a}"/><ellipse cx="38" cy="52" rx="5" ry="7" fill="#111"/><ellipse cx="62" cy="52" rx="5" ry="7" fill="#111"/><polygon points="46,64 54,64 50,69" fill="#f5a"/>`,
    fish: (a, b) => `<ellipse cx="42" cy="50" rx="32" ry="21" fill="${a}"/><polygon points="68,50 96,26 96,74" fill="${b}"/><circle cx="26" cy="44" r="4" fill="#fff"/>`,
    flame: (a, b) => `<path fill="${a}" d="M50 4 C60 28 86 38 82 66 C79 86 64 96 50 96 C36 96 20 86 20 64 C20 48 32 40 38 26 C42 36 46 40 50 4Z"/><path fill="${b}" d="M50 44 C56 58 68 62 66 76 C65 86 58 90 50 90 C42 90 34 86 34 76 C34 66 46 62 50 44Z"/>`,
    bolt: a => `<polygon fill="${a}" points="58,4 20,56 46,56 38,96 82,40 54,40"/>`,
    house: (a, b) => `<polygon fill="${a}" points="50,8 6,48 16,48 16,90 84,90 84,48 94,48"/><rect x="42" y="62" width="16" height="28" fill="${b}"/>`,
    bike: (a, b) => `<g fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="66" r="17"/><circle cx="78" cy="66" r="17"/><path d="M22 66 L40 36 L66 36 L78 66 M40 36 L52 66 L66 36 M34 26 L46 26 M62 26 L72 26 L66 36"/></g><circle cx="52" cy="66" r="5" fill="${b}"/>`,
    cart: (a, b) => `<g fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14 H20 L32 64 H80 L90 28 H26"/></g><circle cx="38" cy="82" r="7" fill="${b}"/><circle cx="74" cy="82" r="7" fill="${b}"/>`,
    tag: (a, b) => `<path fill="${a}" d="M8 50 L50 8 H92 V50 L50 92 Z"/><circle cx="72" cy="28" r="8" fill="${b}"/>`,
    clock: (a, b) => `<circle cx="50" cy="50" r="40" fill="none" stroke="${a}" stroke-width="8"/><path d="M50 24 V50 L68 62" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/>`,
    pin: (a, b) => `<path fill="${a}" d="M50 96 C30 66 16 52 16 36 A34 34 0 0 1 84 36 C84 52 70 66 50 96Z"/><circle cx="50" cy="36" r="13" fill="${b}"/>`,
    gift: (a, b) => `<rect x="12" y="40" width="76" height="52" rx="6" fill="${a}"/><rect x="6" y="28" width="88" height="18" rx="5" fill="${a}"/><rect x="44" y="28" width="12" height="64" fill="${b}"/><path d="M50 28 C40 8 18 14 30 28 M50 28 C60 8 82 14 70 28" fill="none" stroke="${b}" stroke-width="6"/>`,
    pizza: (a, b) => `<path fill="${a}" d="M50 94 L8 18 Q50 0 92 18 Z"/><path fill="${b}" d="M8 18 Q50 0 92 18 L86 28 Q50 12 14 28Z"/><circle cx="40" cy="40" r="7" fill="${b}"/><circle cx="60" cy="52" r="7" fill="${b}"/><circle cx="48" cy="68" r="6" fill="${b}"/>`,
    burger: (a, b) => `<path fill="${a}" d="M12 46 Q12 14 50 14 Q88 14 88 46Z"/><rect x="8" y="50" width="84" height="10" rx="5" fill="${b}"/><rect x="10" y="62" width="80" height="12" rx="4" fill="#5b2a14"/><path fill="${a}" d="M12 78 H88 Q88 92 74 92 H26 Q12 92 12 78Z"/>`,
    coffee: (a, b) => `<path fill="${a}" d="M14 34 H74 V68 Q74 90 44 90 Q14 90 14 68Z"/><path d="M74 42 Q92 42 92 56 Q92 70 74 70" fill="none" stroke="${a}" stroke-width="7"/><path d="M32 8 Q26 18 34 26 M50 8 Q44 18 52 26" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/>`,
    tooth: (a, b) => `<path fill="${a}" d="M24 10 Q50 20 76 10 Q94 16 88 44 Q84 62 78 88 Q72 96 66 86 L58 62 Q50 56 42 62 L34 86 Q28 96 22 88 Q16 62 12 44 Q6 16 24 10Z"/>`,
    dumbbell: (a, b) => `<rect x="4" y="34" width="14" height="32" rx="4" fill="${a}"/><rect x="18" y="24" width="14" height="52" rx="4" fill="${a}"/><rect x="68" y="24" width="14" height="52" rx="4" fill="${a}"/><rect x="82" y="34" width="14" height="32" rx="4" fill="${a}"/><rect x="32" y="45" width="36" height="10" fill="${b}"/>`,
    car: (a, b) => `<path fill="${a}" d="M8 62 L16 40 Q20 30 32 30 H68 Q80 30 84 40 L92 62 V76 H8Z"/><path fill="${b}" d="M24 42 Q26 36 34 36 H66 Q74 36 76 42 L78 50 H22Z"/><circle cx="28" cy="78" r="10" fill="#111"/><circle cx="72" cy="78" r="10" fill="#111"/>`,
    scissors: (a, b) => `<g stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"><circle cx="24" cy="74" r="13"/><circle cx="76" cy="74" r="13"/><path d="M33 64 L74 8 M67 64 L26 8"/></g><circle cx="50" cy="40" r="5" fill="${b}"/>`,
    shirt: (a, b) => `<path fill="${a}" d="M34 8 L50 18 L66 8 L94 26 L82 44 L72 38 V92 H28 V38 L18 44 L6 26Z"/>`,
    phone: (a, b) => `<rect x="26" y="4" width="48" height="92" rx="10" fill="${a}"/><rect x="31" y="14" width="38" height="66" rx="4" fill="${b}"/>`,
    whats: (a, b) => `<path fill="${a}" d="M50 6 A44 44 0 0 0 12 72 L6 94 L29 88 A44 44 0 1 0 50 6Z"/><path fill="${b}" d="M36 30 Q40 28 42 32 L46 42 Q47 45 44 48 L42 50 Q48 60 56 64 L59 61 Q62 59 65 60 L74 64 Q77 66 75 70 Q72 78 62 77 Q44 74 30 54 Q24 42 30 34Z"/>`,
    check: (a, b) => `<circle cx="50" cy="50" r="44" fill="${a}"/><path d="M28 52 L44 66 L74 34" fill="none" stroke="${b}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    calendar: (a, b) => `<rect x="10" y="18" width="80" height="74" rx="10" fill="none" stroke="${a}" stroke-width="8"/><path d="M10 40 H90 M32 6 V28 M68 6 V28" stroke="${a}" stroke-width="8"/><rect x="26" y="54" width="14" height="12" fill="${b}"/><rect x="46" y="54" width="14" height="12" fill="${b}"/><rect x="66" y="54" width="14" height="12" fill="${b}"/>`,
    building: (a, b) => `<rect x="20" y="8" width="60" height="88" rx="4" fill="${a}"/>${[0, 1, 2, 3].map(r => [0, 1, 2].map(c => `<rect x="${30 + c * 16}" y="${20 + r * 18}" width="9" height="10" fill="${b}"/>`).join('')).join('')}<rect x="42" y="78" width="16" height="18" fill="${b}"/>`
  };
  const THEMES = [
    [/\bpet|\bcao\b|cachorr|gatinh|\bgato|vet\b|veterin|racao|tosa|animal|banho/, ['dog', 'cat', 'paw', 'bone', 'heart']],
    [/bike|bicicl|ciclis|pedal/, ['bike', 'bolt', 'star', 'clock']],
    [/pizza/, ['pizza', 'flame', 'star']], [/burger|hamburg|lanche/, ['burger', 'flame', 'star']],
    [/cafe|padaria|doce|confeit|sorvet/, ['coffee', 'heart', 'star']], [/restaur|churras|comida|food|massa/, ['flame', 'star', 'heart']],
    [/academ|fit|crossfit|esporte|treino|muscula/, ['dumbbell', 'bolt', 'flame']], [/odonto|dent/, ['tooth', 'sparkle', 'heart']],
    [/clinic|saude|farm|medic|fisio|terapia/, ['heart', 'sparkle', 'check']], [/beleza|salao|estetic|barbear|cabelo|unha/, ['scissors', 'sparkle', 'heart']],
    [/auto|carro|mecanic|oficina|moto|lava|pneu/, ['car', 'bolt', 'star']], [/imobil|casa|apart|constru|material|reforma/, ['house', 'building', 'star']],
    [/roupa|moda|loja|boutique|calcad/, ['shirt', 'tag', 'star']], [/mercad|super|empori/, ['cart', 'tag', 'star']]
  ];
  function iconList() { const asked = (P.elementos || []).filter(x => ICONS[x]); if (asked.length) return asked; const txt = (P.empresa + ' ' + P.segmento + ' ' + P.mensagem + ' ' + (P.pedido || '') + ' ' + (P.tema || '')).toLowerCase(); const th = THEMES.find(t => t[0].test(txt)); return th ? th[1] : ['star', 'sparkle', 'heart']; }
  function iconSvg(name, size, a, b) { return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;overflow:visible">${(ICONS[name] || ICONS.sparkle)(a || C.accent, b || '#fff')}</svg>`; }
  function icon(parent, name, x, y, size, a, b) { return el(`left:${x}px;top:${y}px;width:${size}px;height:${size}px`, iconSvg(name, size, a, b), parent); }

  // ---------- primitivas visuais ----------
  function card(parent, r, o) { o = o || {}; const sh = (o.outline === false ? 'box-shadow:' : 'box-shadow:inset 0 0 0 2px ' + (o.outline || C.line) + ',') + '0 24px 70px rgba(0,0,0,.55);'; return el(R(r) + `border-radius:${o.r == null ? 36 : o.r}px;background:${o.fill || C.card};` + sh + 'overflow:hidden;' + (o.css || ''), o.html, parent); }
  function chip(parent, s, o) {
    o = o || {}; const size = o.size || 30, h = o.h || Math.round(size * 2.05), ic = o.icon;
    const icHtml = ic === 'dot' ? `<span style="width:${size * .55}px;height:${size * .55}px;border-radius:50%;background:${C.ok};display:inline-block;margin-right:${size * .45}px"></span>` : ic ? `<span style="display:inline-block;margin-right:${size * .4}px">${iconSvg(ic, size * 1.1, o.iconA || o.fg || '#fff', o.iconB || o.fill || C.accent)}</span>` : '';
    const n = el(`height:${h}px;padding:0 ${o.padx || size * .95}px;border-radius:${h / 2}px;background:${o.fill || C.accent};color:${o.fg || '#fff'};font-family:${fam(o.font || 'black')};font-size:${size}px;display:flex;align-items:center;white-space:nowrap;box-shadow:0 14px 40px rgba(0,0,0,.45);` + (o.css || ''), icHtml + esc(s), parent);
    n.dataset.ktext = '1'; return n;
  }
  function place(n, x, y, anchor) { const w = n.offsetWidth, h = n.offsetHeight; let L = x, T = y; if (anchor === 'c') { L -= w / 2; T -= h / 2; } else if (anchor === 'ct') L -= w / 2; else if (anchor === 'rt') L -= w; n.style.left = L + 'px'; n.style.top = T + 'px'; return n; }
  function pop(tl, n, at, o) { o = o || {}; tl.from(n, { scale: o.from == null ? .4 : o.from, opacity: 0, rotation: o.rot || 0, duration: o.d || .55, ease: o.ease || 'back.out(1.8)', transformOrigin: o.origin || '50% 50%' }, at); return n; }
  function rise(tl, n, at, o) { o = o || {}; tl.from(n, { y: o.y == null ? 60 : o.y, x: o.x || 0, opacity: 0, duration: o.d || .55, ease: o.ease || 'power3.out' }, at); return n; }
  function header(tl, at, s, parent) { const z = zone('head'); const c = chip(parent || st, s, { fill: 'rgba(255,255,255,.09)', font: 'semi', size: vert ? 32 : 30 }); if (vert) place(c, W / 2, z.y + (z.h - c.offsetHeight) / 2, 'ct'); else place(c, z.x, z.y + (z.h - c.offsetHeight) / 2, 'lt'); rise(tl, c, at, { y: -24 }); return c; }

  // ---------- fundo (cor da marca + granulado) ----------
  function bg(tl, o) {
    o = o || {}; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const glow = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, C.glow(a)); gr.addColorStop(.5, C.glow(a * .55)); gr.addColorStop(1, C.glow(0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
    if (vert) { glow(540, 260, 1000, .55); glow(900, 1950, 760, .25); } else { glow(1500, 160, 1100, .5); glow(200, 1080, 800, .22); }
    const id = g.getImageData(0, 0, W, H), d = id.data; let s2 = 7; const r2 = () => (s2 = (s2 * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < d.length; i += 4) { const n = (r2() - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
    const b = el('left:0;top:0;width:100%;height:100%;z-index:0', ''); cv.style.cssText = 'width:100%;height:100%;display:block'; b.appendChild(cv);
    const orb = el(`left:${vert ? 140 : 900}px;top:${vert ? -200 : -300}px;width:${vert ? 800 : 1000}px;height:${vert ? 800 : 1000}px;border-radius:50%;background:radial-gradient(circle,${C.glow(.35)},transparent 65%);z-index:0`, '');
    tl.to(orb, { x: vert ? 120 : -380, y: vert ? 420 : 180, duration: DUR, ease: 'sine.inOut' }, 0);
    return b;
  }
  function brandBar(tl) {
    const name = String(P.empresa || '').toUpperCase().split('').join(' ').replace(/ {3}/g, '   ');
    const t = el(`left:0;top:${vert ? 70 : 34}px;width:100%;text-align:center;font-family:${fam('semi')};font-size:${vert ? 25 : 22}px;letter-spacing:.1em;color:rgba(205,208,220,.78);white-space:nowrap;z-index:40`, esc(name));
    t.dataset.ktext = '1'; if (t.scrollWidth > W - 120) t.style.fontSize = Math.max(14, (vert ? 25 : 22) * (W - 120) / t.scrollWidth) + 'px';
    tl.from(t, { opacity: 0, duration: .6 }, .2);
    const ex = P.assets.exa ? el(`right:${vert ? 40 : 46}px;bottom:${vert ? 40 : 34}px;height:${vert ? 40 : 36}px;opacity:.75;z-index:60`, `<img src="${P.assets.exa}" style="height:100%;display:block">`) : null;
    return t;
  }

  // ---------- cenas (janelas que se sobrepoem, como no video da Sofia) ----------
  const SCENES = [];
  function scene(tl, start, end, build, o) {
    o = o || {}; const layer = el('left:0;top:0;width:100%;height:100%;z-index:' + (10 + SCENES.length), ''); layer.dataset.scene = SCENES.length;
    SCENES.push({ start, end, layer });
    if (start > 0.01) tl.fromTo(layer, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.out', immediateRender: true }, start);
    build(layer, start);
    if (end < DUR - 0.05) tl.to(layer, { opacity: 0, y: -50, duration: .35, ease: 'power2.in' }, end - .35).set(layer, { display: 'none' }, end);
    return layer;
  }

  // ---------- componentes de demonstracao ----------
  // celular com conversa de WhatsApp. msgs: [[segundos_apos_at, 'r'|'l', 'texto']]
  function phone(tl, at, o) {
    o = o || {}; const p = o.parent || st, r = o.rect || (vert ? { x: 150, y: 300, w: 780, h: 1000 } : { x: 1100, y: 150, w: 620, h: 840 });
    const ph = card(p, r, { r: 56, fill: C.ink, outline: 'rgb(70,75,95)' });
    const hb = el(`left:0;top:0;width:100%;height:${Math.round(r.w * .19)}px;background:${C.card2};border-bottom:2px solid ${C.line}`, '', ph);
    const av = el(`left:${r.w * .045}px;top:${r.w * .04}px;width:${r.w * .11}px;height:${r.w * .11}px;border-radius:50%;background:${C.accent};overflow:hidden;display:flex;align-items:center;justify-content:center`, P.assets.logo ? `<img src="${P.assets.logo}" style="width:84%;height:84%;object-fit:contain">` : `<span style="font-family:${fam('black')};font-size:${r.w * .055}px">${esc(String(P.empresa).trim()[0] || 'E')}</span>`, hb);
    const nm = el(`left:${r.w * .18}px;top:${r.w * .04}px;font-family:${fam('bold')};font-size:${r.w * .05}px;white-space:nowrap`, esc(o.title || P.empresa), hb); nm.dataset.ktext = '1';
    if (nm.offsetWidth > r.w * .78) nm.style.fontSize = (r.w * .05 * r.w * .78 / nm.offsetWidth) + 'px';
    el(`left:${r.w * .18}px;top:${r.w * .108}px;font-family:${fam('med')};font-size:${r.w * .034}px;color:${C.muted};white-space:nowrap`, `<span style="display:inline-block;width:${r.w * .02}px;height:${r.w * .02}px;border-radius:50%;background:${C.ok};margin-right:${r.w * .012}px"></span>` + esc(o.sub || 'online agora'), hb);
    const area = el(`left:0;top:${r.w * .19 + 20}px;width:100%;height:${r.h - r.w * .19 - 40}px;overflow:hidden`, '', ph);
    const fs = Math.round(r.w * (vert ? .05 : .056)); let y = 0; const maxw = r.w * .78;
    (o.msgs || []).forEach(([dt, side, s]) => {
      const t0 = at + dt;
      if (s && typeof s === 'object') { // cartao dentro da conversa (oferta, produto, link)
        const cwid = maxw, chh2 = fs * 6.4; const cc = el(`left:${r.w * .04}px;top:${y}px;width:${cwid}px;height:${chh2}px;border-radius:${fs * .9}px;background:${C.card2};overflow:hidden`, '', area);
        el(`left:${fs * .5}px;top:${fs * .5}px;width:${cwid - fs}px;height:${fs * 2.3}px;border-radius:${fs * .6}px;background:${C.accent}`, '', cc);
        text(cc, s.title || '', { x: fs * .9, y: fs * .55, w: cwid - fs * 1.8, h: fs * 2.2 }, { font: 'black', size: fs * 1.15, align: 'left', shadow: false });
        if (s.sub) text(cc, s.sub, { x: fs * .9, y: fs * 3.05, w: cwid - fs * 1.8, h: fs * 1.5 }, { font: 'med', size: fs * .85, align: 'left', color: C.muted, shadow: false });
        if (s.cta) { const bt = el(`left:${fs * .9}px;top:${chh2 - fs * 2}px;width:${cwid - fs * 1.8}px;height:${fs * 1.5}px;border-radius:${fs * .75}px;background:${C.ok};color:${C.okInk};display:flex;align-items:center;justify-content:center;font-family:${fam('black')};font-size:${fs * .8}px`, esc(s.cta), cc); bt.dataset.ktext = '1'; }
        tl.from(cc, { opacity: 0, x: -30, y: 26, duration: .35, ease: 'power3.out' }, t0); y += chh2 + 18; return;
      }
      const lines = wrapLines(s, 'med', fs, maxw - fs * 1.7);
      const bw = Math.max(...lines.map(l => tw(l, 'med', fs))) + fs * 1.7 + 4, bh = lines.length * fs * 1.32 + fs * 1.15;
      if (side === 'l') { const ty = el(`left:${r.w * .04}px;top:${y}px;width:${fs * 3.6}px;height:${fs * 2}px;border-radius:${fs}px;background:${C.card2};display:flex;gap:${fs * .35}px;align-items:center;justify-content:center`, [0, 1, 2].map(() => `<i style="width:${fs * .38}px;height:${fs * .38}px;border-radius:50%;background:#c8cbd6;display:block"></i>`).join(''), area); tl.fromTo(ty, { opacity: 0 }, { opacity: 1, duration: .15, immediateRender: true }, Math.max(at, t0 - .7)).to(ty.children, { y: -fs * .25, duration: .18, yoyo: true, repeat: 3, stagger: .08, ease: 'sine.inOut' }, Math.max(at, t0 - .7)).set(ty, { opacity: 0 }, t0); }
      const b = el(`${side === 'r' ? 'right' : 'left'}:${r.w * .04}px;top:${y}px;max-width:${maxw}px;padding:${fs * .55}px ${fs * .85}px;border-radius:${fs * .8}px;background:${side === 'r' ? C.accent : C.card2};font-family:${fam('med')};font-size:${fs}px;line-height:1.32;color:#fff;width:${bw}px`, esc(s), area);
      b.dataset.ktext = '1'; tl.from(b, { opacity: 0, x: side === 'r' ? 30 : -30, y: 26, duration: .32, ease: 'power3.out' }, t0);
      y += bh + 18;
    });
    rise(tl, ph, at - .1, { y: 80, d: .6 });
    return ph;
  }
  // cartao de oferta em leque (frente com gradiente da marca)
  function offer(tl, at, o) {
    o = o || {}; const p = o.parent || st; const cw = o.w || (vert ? 640 : 560), chh = Math.round(cw * 1.28); const cx = o.cx || (vert ? W / 2 : 1410), cy = o.cy || (vert ? 760 : 560);
    const back = i => { const b = card(p, { x: cx - cw / 2, y: cy - chh / 2, w: cw, h: chh }, { fill: C.card2, r: 40, css: 'filter:blur(3px);opacity:.8' }); el(`left:6%;top:5%;width:88%;height:32%;border-radius:24px;background:${i ? C.accentDeep : C.card}`, '', b); return b; };
    const b1 = back(0), b2 = back(1);
    const f = card(p, { x: cx - cw / 2, y: cy - chh / 2, w: cw, h: chh }, { fill: C.card, r: 44 });
    el(`left:0;top:0;width:100%;height:39%;background:linear-gradient(180deg,${C.accentHi},${C.accentDeep})`, '', f);
    const big = text(f, o.big || '%', { x: cw * .06, y: chh * .02, w: cw * .88, h: chh * .36 }, { font: 'black', size: cw * .36 });
    const t1 = text(f, o.title || 'Oferta', { x: cw * .075, y: chh * .43, w: cw * .85, h: chh * .2 }, { font: 'black', size: cw * .1, align: 'left', accentLast: true, lh: 1.08, valign: 'top' });
    if (o.sub) text(f, o.sub, { x: cw * .075, y: chh * .64, w: cw * .85, h: chh * .15 }, { font: 'med', size: cw * .052, align: 'left', color: C.muted, valign: 'top', lh: 1.3 });
    if (o.button) { const bt = el(`left:${cw * .075}px;top:${chh * .84}px;width:${cw * .85}px;height:${chh * .1}px;border-radius:${chh * .05}px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-family:${fam('bold')};font-size:${cw * .05}px`, esc(o.button), f); bt.dataset.ktext = '1'; }
    tl.from(f, { scale: .8, y: 60, opacity: 0, duration: .7, ease: 'back.out(1.4)' }, at)
      .from(b1, { rotation: 0, x: 0, opacity: 0, duration: .7, ease: 'back.out(1.2)' }, at).to(b1, { rotation: -11, x: -cw * .26, duration: .7, ease: 'back.out(1.2)' }, at)
      .from(b2, { opacity: 0, duration: .7 }, at).to(b2, { rotation: 10, x: cw * .26, duration: .7, ease: 'back.out(1.2)' }, at);
    reveal(tl, big, at + .25, { d: .5 }); reveal(tl, t1, at + .4);
    if (o.tag) { const tg = chip(p, o.tag, { fill: '#fff', fg: C.accentDeep, size: vert ? 32 : 28 }); place(tg, cx + cw * .2, cy + chh / 2 - 10, 'c'); tl.set(tg, { rotation: -5 }, 0); pop(tl, tg, at + .9, { from: .3, rot: -20 }); }
    sparkles(tl, at + .3, { parent: p, cx, cy, r: cw * .8, n: 14 });
    return f;
  }
  function sparkles(tl, at, o) {
    o = o || {}; const p = o.parent || st; const n = o.n || 12;
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = o.r * (.85 + rnd() * .3), s = 18 + rnd() * 22, t0 = at + rnd() * 2.2; const sp = el(`left:${o.cx - s / 2}px;top:${o.cy - s / 2}px;width:${s}px;height:${s}px;opacity:0`, iconSvg('sparkle', s, 'rgba(255,215,205,.95)'), p); tl.fromTo(sp, { x: Math.cos(a) * d * .7, y: Math.sin(a) * d * .63, opacity: 0, scale: .4 }, { x: Math.cos(a) * d, y: Math.sin(a) * d * .9, opacity: 1, scale: 1, duration: .6, ease: 'sine.out', immediateRender: false }, t0).to(sp, { opacity: 0, duration: .6 }, t0 + .6); }
  }
  // agenda semanal com dias destacados (ex.: fim de semana)
  function week(tl, at, o) {
    o = o || {}; const p = o.parent || st, r = o.rect || (vert ? { x: 50, y: 320, w: 980, h: 540 } : { x: 1010, y: 220, w: 800, h: 520 });
    const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'], SL = o.rows || ['Manhã', 'Tarde', 'Noite'], hi = o.days || [5, 6];
    const c = card(p, r, { r: 40 }); const gx = r.w * .2, cw = (r.w - gx - r.w * .04) / 7, top = r.h * .2, chh = (r.h * .68) / SL.length;
    DAYS.forEach((d, i) => { const n = el(`left:${gx + i * cw}px;top:${r.h * .07}px;width:${cw - 10}px;text-align:center;font-family:${fam('bold')};font-size:${r.w * .028}px;color:${hi.includes(i) ? C.accentHi : C.muted}`, d, c); n.dataset.ktext = '1'; });
    SL.forEach((s, j) => { const n = el(`left:${r.w * .04}px;top:${top + j * chh + chh * .3}px;font-family:${fam('semi')};font-size:${r.w * .029}px;color:${C.muted};white-space:nowrap`, esc(s), c); n.dataset.ktext = '1';
      DAYS.forEach((_, i) => { const on = hi.includes(i); const cell = el(`left:${gx + i * cw}px;top:${top + j * chh}px;width:${cw - 12}px;height:${chh - 12}px;border-radius:16px;background:rgb(44,49,66)`, '', c); if (on) tl.to(cell, { backgroundColor: C.accent, duration: .25 }, at + .8 + (i - hi[0]) * .12 + j * .08); }); });
    if (o.label) { const lb = chip(p, o.label, { fill: C.ok, fg: C.okInk, icon: 'check', iconA: C.okInk, iconB: C.ok, size: vert ? 36 : 32 }); place(lb, r.x + r.w / 2, r.y + r.h + 40, 'ct'); pop(tl, lb, at + 1.6); }
    rise(tl, c, at); return c;
  }
  // mapa estilizado com pino da loja
  function map(tl, at, o) {
    o = o || {}; const p = o.parent || st, r = o.rect || (vert ? { x: 80, y: 300, w: 920, h: 900 } : { x: 1010, y: 170, w: 800, h: 760 });
    const cv = document.createElement('canvas'); cv.width = r.w; cv.height = r.h; const g = cv.getContext('2d'); g.fillStyle = 'rgb(17,20,29)'; g.fillRect(0, 0, r.w, r.h); g.strokeStyle = 'rgb(32,36,50)';
    for (let i = -2; i < 14; i++) { const x = i * r.w / 10 + (rnd() * 20 - 10); g.lineWidth = rnd() < .67 ? 3 : 6; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 140, r.h); g.stroke(); }
    for (let j = -2; j < 16; j++) { const y = j * r.h / 12; g.lineWidth = rnd() < .67 ? 3 : 7; g.beginPath(); g.moveTo(0, y + 60); g.lineTo(r.w, y - 40); g.stroke(); }
    g.strokeStyle = 'rgb(48,53,72)'; g.lineWidth = 14; g.beginPath(); g.moveTo(0, r.h * .5); g.lineTo(r.w, r.h * .37); g.stroke(); g.beginPath(); g.moveTo(r.w * .33, 0); g.lineTo(r.w * .5, r.h); g.stroke();
    g.strokeStyle = 'rgb(26,52,82)'; g.lineWidth = 60; g.lineCap = 'round'; g.beginPath(); for (let x = 0; x <= 40; x++) { const px = r.w * x / 40, py = r.h * .86 + 70 * Math.sin(x / 5); x ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    const c = card(p, r, { r: 44, fill: 'rgb(17,20,29)' }); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%'; c.appendChild(cv);
    const pins = [[.2, .2], [.5, .16], [.78, .3], [.3, .42], [.7, .62], [.16, .58], [.44, .74], [.82, .78]];
    pins.forEach(([px, py], i) => { const n = el(`left:${r.w * px - 22}px;top:${r.h * py - 56}px;width:44px;height:58px`, iconSvg('pin', 58, 'rgb(210,214,228)', 'rgb(40,44,60)'), c); pop(tl, n, at + .3 + i * .07, { from: .2 }); });
    const mx = r.w * .56, my = r.h * .46; const rings = [0, 1].map(k => el(`left:${mx - 110}px;top:${my - 80}px;width:220px;height:220px;border-radius:50%;border:5px solid ${C.accentHi};opacity:0`, '', c));
    rings.forEach((rg, k) => tl.fromTo(rg, { scale: .1, opacity: .9 }, { scale: 1, opacity: 0, duration: 1.1, repeat: 2, ease: 'sine.out', immediateRender: false }, at + 1.2 + k * .5));
    const pm = el(`left:${mx - 45}px;top:${my - 110}px;width:90px;height:116px`, iconSvg('pin', 116, C.accent, '#fff'), c); tl.from(pm, { y: -260, opacity: 0, duration: .6, ease: 'bounce.out' }, at + .9);
    if (o.label) { const lb = chip(p, o.label, { icon: 'pin', size: vert ? 34 : 30, iconA: '#fff', iconB: C.accent }); place(lb, r.x + r.w / 2, r.y + r.h - lb.offsetHeight - 30, 'ct'); pop(tl, lb, at + 1.4); }
    rise(tl, c, at, { y: 60 }); return c;
  }
  // numeros que contam. items: [{v, prefixo, sufixo, rotulo}]
  function stats(tl, at, o) {
    o = o || {}; const p = o.parent || st, items = (o.items || []).slice(0, 3), r = o.rect || zone(vert ? 'bottom' : 'right'); if (!items.length) return null;
    const gap = 24, cw = vert ? r.w : r.w, chh = (r.h - gap * (items.length - 1)) / items.length;
    items.forEach((it, i) => { const c = card(p, { x: r.x, y: r.y + i * (chh + gap), w: cw, h: chh }, { r: 34 }); const v = Number(it.v ?? it.valor ?? 0);
      const obj = { n: 0 }; const pre = it.prefixo || '', suf = it.sufixo || it.s || ''; const fmt = x => pre + Math.round(x).toLocaleString('pt-BR') + suf;
      let ns = Math.min(chh * .62, 170); while (ns > 30 && tw(fmt(v), 'black', ns) > cw * .46) ns -= 4; const nw = tw(fmt(v), 'black', ns);
      const num = el(`left:${cw * .06}px;top:0;height:100%;display:flex;align-items:center;font-family:${fam('black')};font-size:${ns}px;color:${C.accentHi};white-space:nowrap`, '', c); num.dataset.ktext = '1';
      const lx = cw * .06 + nw + cw * .05; const lab = text(c, it.rotulo || it.label || '', { x: lx, y: chh * .12, w: cw - lx - cw * .05, h: chh * .76 }, { font: 'bold', size: Math.min(chh * .26, 46), align: 'left', lh: 1.15 });
      num.textContent = fmt(v);
      tl.fromTo(obj, { n: 0 }, { n: v, duration: 1.1, ease: 'power2.out', onUpdate: () => { num.textContent = fmt(obj.n); }, immediateRender: false }, at + .2 + i * .15);
      tl.set(num, { textContent: fmt(0) }, 0); rise(tl, c, at + i * .15); reveal(tl, lab, at + .3 + i * .15, { fade: true, y: 40 }); });
  }
  // lista de beneficios com check
  function checks(tl, at, o) {
    o = o || {}; const p = o.parent || st, items = (o.items || []).slice(0, 4), r = o.rect || zone(vert ? 'bottom' : 'left'); if (!items.length) return null;
    const gap = 22, rh = Math.min(vert ? 170 : 150, (r.h - gap * (items.length - 1)) / items.length);
    items.forEach((s, i) => { const y = r.y + i * (rh + gap); const c = card(p, { x: r.x, y, w: r.w, h: rh }, { r: rh / 2.4, fill: C.card });
      el(`left:${rh * .2}px;top:${rh * .2}px;width:${rh * .6}px;height:${rh * .6}px`, iconSvg('check', rh * .6, C.ok, C.okInk), c);
      const t = text(c, s, { x: rh * .98, y: rh * .1, w: r.w - rh * 1.2, h: rh * .8 }, { font: 'bold', size: rh * .3, align: 'left', lh: 1.12 });
      tl.from(c, { x: -80, opacity: 0, duration: .45, ease: 'power3.out' }, at + i * .32); });
  }
  // anel de icones ao redor do logo (resumo)
  function orbit(tl, at, o) {
    o = o || {}; const p = o.parent || st, items = (o.items || []).slice(0, 6); const cx = o.cx || W / 2, cy = o.cy || (vert ? 820 : 560), RR = o.R || (vert ? 360 : 330);
    const ring = el(`left:${cx - RR}px;top:${cy - RR}px;width:${RR * 2}px;height:${RR * 2}px;border-radius:50%;border:3px solid rgba(255,255,255,.18)`, '', p); pop(tl, ring, at, { from: .6 });
    const mid = el(`left:${cx - 140}px;top:${cy - 140}px;width:280px;height:280px;border-radius:50%;background:${C.accent};box-shadow:0 0 120px ${C.glow(.6)};display:flex;align-items:center;justify-content:center;overflow:hidden`, P.assets.logo ? `<img src="${P.assets.logo}" style="width:70%;height:70%;object-fit:contain">` : `<span style="font-family:${fam('black')};font-size:110px">${esc(String(P.empresa).trim()[0] || 'E')}</span>`, p); pop(tl, mid, at + .1);
    const holder = el(`left:${cx}px;top:${cy}px;width:0;height:0`, '', p); tl.to(holder, { rotation: 28, duration: DUR, ease: 'none' }, at);
    items.forEach((it, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / items.length, x = Math.cos(a) * RR, y = Math.sin(a) * RR;
      const t = el(`left:${x - 75}px;top:${y - 75}px;width:150px;height:150px;border-radius:50%;background:${C.card2};box-shadow:inset 0 0 0 2px rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center`, iconSvg(it.icon || 'star', 84, '#fff', C.accent), holder);
      tl.to(t, { rotation: -28, duration: DUR, ease: 'none' }, at);
      const lb = el(`left:${x - 160}px;top:${y + 84}px;width:320px;text-align:center;font-family:${fam('bold')};font-size:30px;white-space:nowrap`, esc(it.label || ''), holder); lb.dataset.ktext = '1'; tl.to(lb, { rotation: -28, duration: DUR, ease: 'none' }, at);
      pop(tl, t, at + .3 + i * .18); tl.from(lb, { opacity: 0, duration: .3 }, at + .45 + i * .18); });
  }
  function stamp(tl, at, s, o) { o = o || {}; const p = o.parent || st; const c = chip(p, s, { fill: 'rgba(9,10,15,.92)', fg: o.color || C.ok, size: o.size || (vert ? 64 : 58), icon: 'check', iconA: o.color || C.ok, iconB: '#0b0c12', css: `box-shadow:inset 0 0 0 7px ${o.color || C.ok},0 20px 60px rgba(0,0,0,.6)` }); place(c, o.x || W / 2, o.y || H / 2, 'c'); tl.set(c, { rotation: 7 }, 0).from(c, { scale: 1.9, opacity: 0, duration: .35, ease: 'power3.in' }, at); return c; }

  // ---------- midia do cliente (video/foto) dentro da composicao ----------
  // render.py extrai os quadros do video; aqui o <img> recebe o quadro certo a cada instante (window.__mediaTick)
  function media(tl, at, o) {
    if (!P.media || !P.mediaSrc) return null; o = o || {}; const p = o.parent || st;
    const ar = P.mediaAR || 1; const box = o.rect || (vert ? { x: 64, y: 290, w: 952, h: 1000 } : { x: 1010, y: 150, w: 800, h: 840 });
    // a moldura segue a proporcao do video (sem cortar o cliente); so encaixa dentro da caixa pedida
    const ar2 = Math.max(.56, Math.min(1.78, ar)); let r;
    if (o.exact) r = box; else if (box.w / box.h > ar2) { const h = box.h, w = h * ar2; r = { x: box.x + (box.w - w) / 2, y: box.y, w, h }; } else { const w = box.w, h = w / ar2; r = { x: box.x, y: box.y + (box.h - h) / 2, w, h }; }
    const frame = card(p, r, { r: o.r == null ? (ar < .8 ? 52 : 36) : o.r, fill: '#000', outline: ar < .8 ? 'rgb(70,75,95)' : C.line, css: ar < .8 ? 'box-shadow:inset 0 0 0 10px #0d0e14,0 30px 90px rgba(0,0,0,.6)' : '' });
    const img = document.createElement('img'); img.className = 'kmedia'; img.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;${ar < .8 ? 'padding:10px;border-radius:52px' : ''}`; img.src = P.mediaN ? P.mediaSrc.replace('%05d', '00001') : P.mediaSrc; frame.appendChild(img);
    if (!P.mediaN) tl.fromTo(img, { scale: 1 }, { scale: 1.14, duration: DUR, ease: 'none' }, 0);
    rise(tl, frame, at, { y: 70, d: .65 }); window.__usedMedia = true; return frame;
  }
  window.__mediaTick = t => { if (!P.mediaN) return; const i = Math.floor(t * 30) % P.mediaN + 1; const s = P.mediaSrc.replace('%05d', String(i).padStart(5, '0')); document.querySelectorAll('img.kmedia').forEach(im => { if (im.getAttribute('src') !== s) im.setAttribute('src', s); }); };

  // ---------- logo, QR e cartao final ----------
  function logoNode(size, parent, css) { const a = P.assets || {}; if (a.logo) return el('width:' + u(size * 1.6) + ';height:' + u(size) + ';' + (css || ''), '<img src="' + a.logo + '" style="width:100%;height:100%;object-fit:contain">', parent); const n = el(`font-family:${fam('black')};font-size:${size * .5}px;white-space:nowrap;` + (css || ''), esc(P.empresa), parent); n.dataset.ktext = '1'; return n; }
  function qrNode(size, parent, css) { if (!P.qr) return null; const q = P.qr, n = q.length, cv = document.createElement('canvas'); cv.width = cv.height = 400; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 400, 400); c.fillStyle = '#000'; const m = 400 / (n + 8); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q[y][x]) c.fillRect((x + 4) * m, (y + 4) * m, m + .5, m + .5); const d = el('width:' + u(size) + ';height:' + u(size) + ';border-radius:' + u(size * .08) + ';overflow:hidden;background:#fff;' + (css || ''), '', parent); cv.style.cssText = 'width:100%;height:100%;display:block'; d.appendChild(cv); return d; }
  // cartao final no estilo do CTA da Sofia: marca grande, chamada, numero gigante, chip verde, QR e Instagram
  function end(tl, at, o) {
    o = o || {}; const p = el('left:0;top:0;width:100%;height:100%;z-index:50', ''); p.dataset.endcard = '1'; tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: .45, immediateRender: true }, at);
    el(`left:0;top:0;width:100%;height:100%;background:${C.bg}`, '', p);
    const hasLogo = !!P.assets.logo, qr = !!P.qr;
    if (vert) {
      const lc = card(p, { x: 130, y: 250, w: 820, h: 620 }, { r: 48, fill: `radial-gradient(circle at 50% 35%,${C.accentDeep},${C.card})` });
      if (hasLogo) el('left:12%;top:12%;width:76%;height:76%', `<img src="${P.assets.logo}" style="width:100%;height:100%;object-fit:contain">`, lc); else text(lc, P.empresa, { x: 50, y: 60, w: 720, h: 440 }, { font: 'black', size: 140 });
      rise(tl, lc, at + .1, { y: 70 }); tl.to(lc, { scale: 1.04, duration: DUR - at, ease: 'sine.inOut' }, at + .7);
      const m = text(p, o.frase || P.mensagem, { x: 70, y: 920, w: 940, h: 260 }, { font: 'black', size: 92, accentLast: true }); reveal(tl, m, at + .4);
      const cta = chip(p, o.cta || P.cta || 'Chame no WhatsApp', { fill: P.whats ? C.ok : C.accent, fg: P.whats ? C.okInk : '#fff', size: 40, icon: P.whats ? 'whats' : null, iconA: C.okInk, iconB: C.ok }); place(cta, W / 2, 1220, 'ct'); pop(tl, cta, at + .8); tl.to(cta, { scale: 1.05, duration: .5, yoyo: true, repeat: Math.max(1, Math.floor((DUR - at - 1.4) / .5)), ease: 'sine.inOut' }, at + 1.4);
      if (cta.offsetWidth > 960) cta.style.fontSize = (40 * 940 / cta.offsetWidth) + 'px', place(cta, W / 2, 1220, 'ct');
      let y = 1360;
      if (P.whats) { const n = text(p, P.whats, { x: 60, y, w: 960, h: 130 }, { font: 'black', size: 110 }); reveal(tl, n, at + 1, { d: .5 }); y += 150; }
      const row = el(`left:0;top:${y}px;width:100%;display:flex;justify-content:center;align-items:center;gap:40px`, '', p);
      if (qr) { const q = qrNode(260, row, 'position:relative'); pop(tl, q, at + 1.2); }
      if (P.instagram) { const ig = el(`position:relative;font-family:${fam('bold')};font-size:46px;color:#fff;white-space:nowrap`, '@' + esc(P.instagram), row); ig.dataset.ktext = '1'; rise(tl, ig, at + 1.3, { y: 30 }); }
    } else {
      const lc = card(p, { x: 110, y: 150, w: 760, h: 780 }, { r: 48, fill: `radial-gradient(circle at 50% 35%,${C.accentDeep},${C.card})` });
      if (hasLogo) el('left:12%;top:14%;width:76%;height:72%', `<img src="${P.assets.logo}" style="width:100%;height:100%;object-fit:contain">`, lc); else text(lc, P.empresa, { x: 50, y: 60, w: 660, h: 660 }, { font: 'black', size: 150 });
      rise(tl, lc, at + .1, { x: -60, y: 0 }); tl.to(lc, { scale: 1.04, duration: DUR - at, ease: 'sine.inOut' }, at + .7);
      const m = text(p, o.frase || P.mensagem, { x: 960, y: 150, w: 860, h: 300 }, { font: 'black', size: 96, align: 'left', accentLast: true }); reveal(tl, m, at + .35);
      const cta = chip(p, o.cta || P.cta || 'Chame no WhatsApp', { fill: P.whats ? C.ok : C.accent, fg: P.whats ? C.okInk : '#fff', size: 38, icon: P.whats ? 'whats' : null, iconA: C.okInk, iconB: C.ok }); place(cta, 960, 480, 'lt'); pop(tl, cta, at + .75, { origin: '0% 50%' }); tl.to(cta, { scale: 1.05, transformOrigin: '0% 50%', duration: .5, yoyo: true, repeat: Math.max(1, Math.floor((DUR - at - 1.3) / .5)), ease: 'sine.inOut' }, at + 1.3);
      if (cta.offsetWidth > 860) cta.style.fontSize = (38 * 850 / cta.offsetWidth) + 'px';
      if (P.whats) { const n = text(p, P.whats, { x: 960, y: 590, w: 860, h: 130 }, { font: 'black', size: 104, align: 'left' }); reveal(tl, n, at + .95, { d: .5 }); }
      const row = el(`left:960px;top:${P.whats ? 750 : 610}px;display:flex;align-items:center;gap:40px`, '', p);
      if (qr) { const q = qrNode(P.whats ? 220 : 280, row, 'position:relative'); pop(tl, q, at + 1.15); }
      if (P.instagram) { const ig = el(`position:relative;font-family:${fam('bold')};font-size:44px;white-space:nowrap`, '@' + esc(P.instagram), row); ig.dataset.ktext = '1'; rise(tl, ig, at + 1.3, { y: 30 }); }
    }
    return p;
  }
  const endCard = (tl, at, o) => end(tl, at, o);

  // ---------- elementos tematicos flutuantes ----------
  function sprites(tl, from, to, o) {
    o = o || {}; const list = iconList(), n = o.n || (vert ? 8 : 10), layer = el('left:0;top:0;width:100%;height:100%;z-index:' + (o.z == null ? 2 : o.z) + ';pointer-events:none', '', o.parent), out = [];
    for (let i = 0; i < n; i++) { const name = list[i % list.length], size = (o.size || (vert ? 130 : 110)) * (.65 + rnd() * .7), x = rnd() * (W - size), dur = 3.4 + rnd() * 2.4, t0 = from + (to - from - dur * .6) * (i / n) + rnd() * .4;
      const nd = el(`left:${x}px;top:${H + 40}px;opacity:0`, iconSvg(name, size, i % 3 ? C.accent : C.accent2, '#fff'), layer);
      tl.set(nd, { opacity: .85, rotation: (rnd() - .5) * 50 }, t0).to(nd, { y: -(H + size + 120), x: (rnd() - .5) * 140, rotation: '+=' + ((rnd() - .5) * 90), duration: dur, ease: 'sine.inOut' }, t0).set(nd, { opacity: 0 }, t0 + dur); out.push(nd); }
    return out;
  }
  function mascot(tl, at, o) { o = o || {}; const list = iconList(), name = o.name || list[0], size = o.size || (vert ? 380 : 320), side = o.side || 'right'; const nd = el(`${side}:60px;bottom:${-size}px;z-index:${o.z == null ? 30 : o.z}`, iconSvg(name, size, C.accent, '#fff'), o.parent); tl.to(nd, { bottom: 40, duration: .7, ease: 'back.out(1.8)' }, at).to(nd, { rotation: side === 'right' ? -8 : 8, duration: .45, yoyo: true, repeat: 3, ease: 'sine.inOut', transformOrigin: '50% 100%' }, at + .7).to(nd, { bottom: -size, duration: .5, ease: 'power2.in' }, at + 2.6); return nd; }
  function echo(tl, node, from, at, dur, ease, n) { const par = node.parentNode; for (let i = n || 3; i >= 1; i--) { const c = node.cloneNode(true); c.style.pointerEvents = 'none'; par.insertBefore(c, node); tl.from(c, Object.assign({}, from, { duration: dur, ease }), at + i * .05); tl.to(c, { opacity: 0, duration: .3 }, at + dur); } return node; }
  function camera(tl, o) { o = o || {}; tl.fromTo(st, { scale: 1 }, { scale: o.zoom || 1.03, transformOrigin: '50% 50%', duration: DUR, ease: 'none' }, 0); }

  // ---------- inicio / fim ----------
  let BG_DONE = false;
  function init(o) { const tl = gsap.timeline({ paused: true }); window.tl = tl; if (!(o && o.bg === false)) { bg(tl); brandBar(tl); BG_DONE = true; } return tl; }
  function finish(tl) {
    if (P.media && P.mediaSrc && !window.__usedMedia) window.__mediaIgnored = true;
    tl.set({}, {}, DUR);
    if (!document.querySelector('#stage [data-endcard]')) { /* quem escreve a cena deve chamar K.end */ }
  }

  // ---------- validacao (usada pelo renderizador): textos cortados, fora da tela ou sobrepostos ----------
  window.__checkLayout = function () {
    const out = [], sr = st.getBoundingClientRect(), k = sr.width / W; const alpha = n => { let a = 1; for (let p = n; p && p !== st; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; a *= parseFloat(cs.opacity); } return a; }; const vis = n => alpha(n) >= .05;
    const nodes = [...st.querySelectorAll('[data-ktext], .kw')].filter(n => !n.closest('.kw') || n.classList.contains('kw'));
    const boxes = [];
    st.querySelectorAll('*').forEach(n => { if (![...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return; if (!vis(n)) return; let r = n.getBoundingClientRect(); const mk = n.parentElement && n.parentElement.classList.contains('kw') ? n.parentElement.getBoundingClientRect() : null;
      if (mk) { const L = Math.max(r.left, mk.left), T = Math.max(r.top, mk.top), Rr = Math.min(r.right, mk.right), B = Math.min(r.bottom, mk.bottom); if (Rr - L < 2 || B - T < 2) return; r = { left: L, top: T, right: Rr, bottom: B, width: Rr - L, height: B - T }; }
      if (r.width < 2 || r.height < 2) return;
      const x0 = (r.left - sr.left) / k, y0 = (r.top - sr.top) / k, x1 = (r.right - sr.left) / k, y1 = (r.bottom - sr.top) / k; const txt = n.textContent.trim().slice(0, 40);
      if (x0 < -6 || y0 < -6 || x1 > W + 6 || y1 > H + 6) out.push('texto saindo da tela: "' + txt + '"');
      for (let p = n.parentElement; p && p !== st; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.overflow === 'hidden' && !p.classList.contains('kw')) { const q = p.getBoundingClientRect(); if (r.right > q.right + 4 || r.left < q.left - 4 || (r.bottom > q.bottom + 6 && !p.classList.contains('kw'))) { out.push('texto cortado: "' + txt + '"'); break; } } }
      if (n.scrollWidth > n.clientWidth + 4 && getComputedStyle(n).overflow === 'hidden') out.push('texto cortado: "' + txt + '"');
      if (alpha(n) > .9) boxes.push([x0, y0, x1, y1, txt, n]); });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; if (a[5].contains(b[5]) || b[5].contains(a[5])) continue; if (a[5].closest('[data-ktext]') && a[5].closest('[data-ktext]') === b[5].closest('[data-ktext]')) continue; const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (ix > 12 && iy > 12 && ix * iy > .25 * Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))) out.push('textos sobrepostos: "' + a[4] + '" x "' + b[4] + '"'); }
    return [...new Set(out)].slice(0, 6);
  };

  // ---------- validacao: quanto da tela tem conteudo visivel agora (0 a 1) ----------
  // Conta so o que a cena desenha (camadas de cena e cartao final); ignora fundo, brilho, nome no topo e logo EXA.
  // Usa uma grade grossa para somar a area sem contar duas vezes o que se sobrepoe.
  window.__coverage = function () {
    const sr = st.getBoundingClientRect(), k = sr.width / W, GX = vert ? 27 : 48, GY = vert ? 48 : 27, cw = W / GX, ch = H / GY;
    const grid = new Uint8Array(GX * GY);
    const alpha = n => { let a = 1; for (let p = n; p && p !== st; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; a *= parseFloat(cs.opacity); if (a < .3) return a; } return a; };
    const roots = [...st.querySelectorAll('[data-scene], [data-endcard]')];
    const seen = new Set();
    roots.forEach(root => root.querySelectorAll('*').forEach(n => {
      if (seen.has(n)) return; seen.add(n);
      const tag = n.tagName, cs = getComputedStyle(n);
      const hasText = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
      const painted = tag === 'IMG' || tag === 'CANVAS' || tag === 'svg' || tag === 'VIDEO' || hasText ||
        (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || (cs.backgroundImage && cs.backgroundImage !== 'none');
      if (!painted) return;
      const r = n.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
      const x0 = Math.max(0, (r.left - sr.left) / k), y0 = Math.max(0, (r.top - sr.top) / k), x1 = Math.min(W, (r.right - sr.left) / k), y1 = Math.min(H, (r.bottom - sr.top) / k);
      if (x1 <= x0 || y1 <= y0) return;
      if ((x1 - x0) * (y1 - y0) > .92 * W * H) return; // camada/fundo de tela cheia nao e conteudo
      if (alpha(n) < .3) return;
      for (let gy = Math.floor(y0 / ch); gy < Math.min(GY, Math.ceil(y1 / ch)); gy++) for (let gx = Math.floor(x0 / cw); gx < Math.min(GX, Math.ceil(x1 / cw)); gx++) grid[gy * GX + gx] = 1;
    }));
    let s = 0; for (let i = 0; i < grid.length; i++) s += grid[i]; return s / grid.length;
  };

  // ---------- cena automatica (reserva quando o diretor falha): usa os componentes acima ----------
  function auto() {
    const tl = init(); const fr = P.frases.length ? P.frases : [P.subtitulo || 'Atendimento de verdade', 'Qualidade que voce sente', 'Perto de voce'];
    const txtAll = (P.empresa + ' ' + P.mensagem + ' ' + fr.join(' ') + ' ' + (P.pedido || '')).toLowerCase();
    const promo = /promo|desconto|oferta|%|off\b|liquida|black|sabado|fim de semana/.test(txtAll), nums = (P.numeros || []).filter(n => n && (n.valor != null || n.v != null)).map(n => ({ v: n.valor ?? n.v, sufixo: n.sufixo || '', prefixo: n.prefixo || '', rotulo: n.rotulo || '' }));
    const icons = iconList();
    if (vert) {
      scene(tl, 0, 3.4, (L, t) => { header(tl, t + .2, P.segmento ? String(P.segmento).slice(0, 32) : 'Novidade', L);
        if (P.media) media(tl, t + .1, { parent: L, rect: { x: 64, y: 290, w: 952, h: 980 } }); else { const h = card(L, { x: 140, y: 300, w: 800, h: 900 }, { r: 48, fill: `radial-gradient(circle at 50% 40%,${C.accentDeep},${C.card})` }); const ic = icon(h, icons[0], 175, 150, 450, '#fff', C.accent); rise(tl, h, t + .1); tl.to(ic, { y: -30, rotation: -4, duration: 1.1, yoyo: true, repeat: 2, ease: 'sine.inOut' }, t + .6); sprites(tl, t + .3, 3.2, { parent: L, n: 5 }); }
        const m = text(L, P.mensagem, { x: 64, y: 1290, w: 952, h: 420 }, { font: 'black', size: 112, accentLast: true }); reveal(tl, m, t + .6); });
      scene(tl, 3.2, 6.6, (L, t) => { header(tl, t + .1, 'Fale direto com a gente', L); phone(tl, t + .2, { parent: L, rect: { x: 150, y: 290, w: 780, h: 1000 }, msgs: [[.4, 'r', 'Oi! Vi o anuncio de voces no elevador'], [1.3, 'l', 'Oi! Que bom que chegou ate aqui. Olha so:'], [2.1, 'l', { title: fr[0], sub: P.empresa, cta: 'QUERO' }]] });
        const tt = text(L, fr[0], { x: 64, y: 1340, w: 952, h: 360 }, { font: 'black', size: 88 }); reveal(tl, tt, t + .6); });
      scene(tl, 6.4, 9.6, (L, t) => { if (promo) { header(tl, t + .1, 'Oferta especial', L); offer(tl, t + .2, { parent: L, big: (txtAll.match(/\d+\s?%/) || ['%'])[0].replace(/\s/g, ''), title: fr[1] || P.mensagem, sub: fr[2] || '', tag: 'APROVEITE', cy: 760, w: 600 }); }
        else { header(tl, t + .1, 'Por que escolher', L); orbit(tl, t + .2, { parent: L, cy: 760, items: icons.slice(0, 5).map((ic, i) => ({ icon: ic, label: '' })) }); }
        const tt = text(L, fr[1] || P.subtitulo || P.mensagem, { x: 64, y: 1330, w: 952, h: 380 }, { font: 'black', size: 88, accentLast: true }); reveal(tl, tt, t + .7); });
      scene(tl, 9.4, 12.4, (L, t) => { header(tl, t + .1, P.empresa, L); if (nums.length) stats(tl, t + .2, { parent: L, items: nums, rect: { x: 64, y: 300, w: 952, h: 640 } }); else checks(tl, t + .2, { parent: L, items: fr.slice(0, 4), rect: { x: 64, y: 320, w: 952, h: 760 } });
        if (nums.length) checks(tl, t + .9, { parent: L, items: fr.slice(0, 3), rect: { x: 64, y: 1000, w: 952, h: 620 } }); });
      end(tl, 12.2);
    } else {
      scene(tl, 0, 2.7, (L, t) => { if (P.media) media(tl, t + .1, { parent: L }); else { const h = card(L, zone('right'), { r: 48, fill: `radial-gradient(circle at 50% 40%,${C.accentDeep},${C.card})` }); const ic = icon(h, icons[0], 200, 220, 400, '#fff', C.accent); rise(tl, h, t + .1, { x: 80, y: 0 }); tl.to(ic, { y: -26, rotation: -4, duration: 1, yoyo: true, repeat: 2, ease: 'sine.inOut' }, t + .6); }
        const m = text(L, P.mensagem, zone('left'), { font: 'black', size: 130, align: 'left', accentLast: true }); reveal(tl, m, t + .3); });
      scene(tl, 2.5, 5.1, (L, t) => { phone(tl, t + .1, { parent: L, rect: { x: 1150, y: 130, w: 600, h: 860 }, msgs: [[.3, 'r', 'Oi! Vi o anuncio no elevador'], [1.1, 'l', { title: fr[0], sub: P.empresa, cta: 'QUERO' }], [2.0, 'r', 'Fechado!']] });
        header(tl, t + .1, 'Fale direto com a gente', L).style.left = '110px';
        const tt = text(L, fr[0], { x: 110, y: 230, w: 940, h: 700 }, { font: 'black', size: 110, align: 'left', accentLast: true }); reveal(tl, tt, t + .3); });
      scene(tl, 4.9, 7.6, (L, t) => { if (promo) offer(tl, t + .1, { parent: L, big: (txtAll.match(/\d+\s?%/) || ['%'])[0].replace(/\s/g, ''), title: fr[1] || P.mensagem, sub: fr[2] || '', tag: 'APROVEITE', cx: 1420, cy: 560, w: 520 });
        else if (nums.length) stats(tl, t + .1, { parent: L, items: nums, rect: { x: 1010, y: 200, w: 800, h: 700 } }); else orbit(tl, t + .1, { parent: L, cx: 1420, cy: 520, R: 300, items: icons.slice(0, 5).map(ic => ({ icon: ic, label: '' })) });
        checks(tl, t + .3, { parent: L, items: fr.slice(1, 4).length ? fr.slice(1, 4) : fr.slice(0, 3), rect: { x: 110, y: 220, w: 840, h: 700 } }); });
      end(tl, 7.4);
    }
    finish(tl); return tl;
  }

  window.K = { P, W, H, DUR, U, vert, C, st, u, el, center, R, esc, rnd, SAFE, zone, tw, fitSize, text, reveal, words, chip, place, pop, rise, header, card, bg, brandBar, scene,
    phone, offer, sparkles, week, map, stats, checks, orbit, stamp, media, end, endCard, logoNode, qrNode, sprites, mascot, echo, camera, icon, iconSvg, ICONS, iconList, init, finish, auto, fam };
})();
