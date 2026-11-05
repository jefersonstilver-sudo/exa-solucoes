// ===== EXA · cena de conteúdo diário (Notícias Foz · Notícias Brasil · Curiosidades) =====
// Qualquer resolução: desenho em 1440 de largura, altura acompanha a proporção da tela (1080×890, 1440×1080, 1920×1080...).
// DATA = { tema:'foz'|'brasil'|'curiosidades', dur, segIntro, dataLonga, dataCurta, ticker,
//          itens:[{cat, head, sub, big, bigL, url, fonte}] }   (curiosidades: head = texto com <em>destaque</em>)
// Versão 2026-10-23: 50 s, sem previsão do tempo, sem tela final, QR de cada item, zoom contínuo, sem logos durante o conteúdo.
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const S = cv.width / 1440, W = 1440, H = Math.round(cv.height / S), D = window.DATA, DUR = D.dur;
const RED = '#EA251D', PRETO = '#0B0B0D', FUNDO = '#9E1014', GRAF = '#1C1C20', NEVOA = '#EFEEEB', AMAR = '#FFC93C';
const TEMA = D.tema || 'foz';
const CFG = {
  foz:          { titulo: 'FOZ DO IGUAÇU', parceiro: true, sub: null, ticker: 'AGORA EM FOZ', qr: 'LEIA A MATÉRIA', acc: RED },
  brasil:       { titulo: 'BRASIL', parceiro: false, sub: 'COM INFORMAÇÕES DA CNN BRASIL', ticker: 'AGORA NO BRASIL', qr: 'LEIA A MATÉRIA', acc: RED },
  curiosidades: { titulo: 'VOCÊ SABIA?', parceiro: false, sub: '5 CURIOSIDADES PARA O SEU DIA', ticker: null, qr: 'SAIBA MAIS', acc: AMAR },
}[TEMA];
const IM = {}, QRS = [];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, s = 1.7) => { x -= 1; return 1 + (s + 1) * x * x * x + s * x * x; };
const win = (t, a, b, fi = .3, fo = .3) => prog(t, a, a + fi) * (1 - prog(t, b - fo, b));
function rr(x, y, w, h, r) { ctx.beginPath(); r = Math.min(r, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function cover(img, x, y, w, h, zoom = 1, fx = .5, fy = .5) { if (!img) return; const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw) return;
  const s = Math.max(w / iw, h / ih) * zoom, dw = iw * s, dh = ih * s; ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh); }
function txt(s, x, y, font, col, align = 'left', a = 1, track = 0) { if (a <= 0 || !s) return; ctx.save(); ctx.globalAlpha *= a; ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; if (track) ctx.letterSpacing = track + 'px'; ctx.fillText(s, x, y); ctx.restore(); }
function fit(s, font, size, maxW) { ctx.font = `${size}px ${font}`; while (ctx.measureText(s).width > maxW && size > 16) { size -= 2; ctx.font = `${size}px ${font}`; } return size; }
function wrap(s, font, maxW) { ctx.font = font; const out = []; let line = ''; s.split(' ').forEach(w => { const tl = line ? line + ' ' + w : w; if (ctx.measureText(tl).width > maxW && line) { out.push(line); line = w; } else line = tl; }); if (line) out.push(line); return out; }
const LOGOD = LOGO.letters.map(l => new Path2D(l.d)), LH = LOGO.h;
function logo(cx, cy, w, col = '#fff', a = 1) { if (a <= 0) return; const s = w / 1000; ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx - w / 2, cy - LH * s / 2); ctx.scale(s, s); ctx.fillStyle = col; LOGOD.forEach(p => ctx.fill(p, 'evenodd')); ctx.restore(); }
function portal(cx, cy, w, a = 1) { const im = IM.portal; if (!im || a <= 0) return; const h = w * im.naturalHeight / im.naturalWidth; ctx.save(); ctx.globalAlpha *= a;
  rr(cx - w / 2 - 18, cy - h / 2 - 12, w + 36, h + 24, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h); ctx.restore(); }

const ITENS = D.itens, N = ITENS.length, T0 = D.segIntro, SEG = (DUR - T0) / N, XF = .7;

function makeQR(url) {
  const q = qrcode(0, 'M'); q.addData(url || 'https://examidia.com.br/'); q.make();
  const n = q.getModuleCount(), m = 2, c = document.createElement('canvas'), px = 8; c.width = c.height = (n + m * 2) * px;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = PRETO;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + m) * px, (r + m) * px, px, px);
  return c;
}
function qrCard(i, x, y, qs, a, faixa = RED, corTxt = '#fff') {
  if (a <= 0 || !QRS[i]) return;
  ctx.save(); ctx.translate(x + qs / 2, y + qs / 2); ctx.scale(a, a); ctx.translate(-x - qs / 2, -y - qs / 2);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; rr(x, y, qs, qs + 52, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.drawImage(QRS[i], x + 14, y + 14, qs - 28, qs - 28);
  ctx.save(); rr(x, y, qs, qs + 52, 16); ctx.clip(); ctx.fillStyle = faixa; ctx.fillRect(x, y + qs, qs, 52); ctx.restore();
  txt(CFG.qr, x + qs / 2, y + qs + 35, '22px jbBd', corTxt, 'center', 1, 1); ctx.restore();
}
function selo(n, x, y, a, bg = RED, fg = '#fff') {
  if (!n.big || a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(a, a);
  const bs = fit(n.big, 'bsBl', 104, 300); ctx.font = `${bs}px bsBl`; const bw = Math.max(ctx.measureText(n.big).width, 200) + 64;
  rr(-bw / 2, -96, bw, 192, 18); ctx.fillStyle = bg; ctx.fill(); txt(n.big, 0, 16, `${bs}px bsBl`, fg, 'center');
  if (n.bigL) txt(n.bigL, 0, 66, `${fit(n.bigL, 'jbBd', 26, bw - 30)}px jbBd`, fg, 'center'); ctx.restore();
}

// ---------- abertura (4 s) — única parte com as marcas ----------
function opening(t) {
  const a = 1 - prog(t, T0 - .45, T0 + .15); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const bg = TEMA === 'curiosidades' ? GRAF : PRETO; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = TEMA === 'curiosidades' ? 'rgba(255,201,60,' : TEMA === 'brasil' ? 'rgba(158,16,20,' : 'rgba(234,37,29,';
  const rg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); rg.addColorStop(0, glow + '.2)'); rg.addColorStop(1, glow + '0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  const cy = H / 2, z = 1 + t * .015; ctx.translate(W / 2, cy); ctx.scale(z, z); ctx.translate(-W / 2, -cy);
  const f2 = CFG.parceiro ? 2.0 : .25; // sem parceiro, vai direto à fase 2
  if (CFG.parceiro) { const p1 = win(t, .15, 2.05, .4, .35);
    if (p1 > 0) { const k = .94 + .06 * eo(prog(t, .15, .9)); ctx.save(); ctx.translate(W / 2, cy); ctx.scale(k, k); ctx.translate(-W / 2, -cy);
      logo(W / 2 - 300, cy - 30, 340, '#fff', p1); txt('+', W / 2 - 40, cy - 2, '80px bsBl', RED, 'center', p1 * prog(t, .4, .7));
      portal(W / 2 + 270, cy - 32, 380, p1 * prog(t, .5, .85));
      txt('INFORMAM', W / 2, cy + 130, '44px jbBd', 'rgba(255,255,255,.9)', 'center', p1 * prog(t, .8, 1.2), 10); ctx.restore(); } }
  const p2 = prog(t, f2, f2 + .4);
  if (p2 > 0) { const k = .9 + .1 * eo5(p2); ctx.save(); ctx.translate(W / 2, cy); ctx.scale(k, k); ctx.translate(-W / 2, -cy);
    logo(W / 2, cy - 130, 480, '#fff', p2);
    const lw = eo5(prog(t, f2 + .3, f2 + .9)); ctx.fillStyle = CFG.acc; ctx.fillRect(W / 2 - 230 * lw, cy - 10, 460 * lw, 6);
    const ts = fit(CFG.titulo, 'bsBl', TEMA === 'foz' ? 96 : 130, 1100);
    txt(CFG.titulo, W / 2, cy + 110 + (ts - 96) * .5, `${ts}px bsBl`, TEMA === 'curiosidades' ? AMAR : '#fff', 'center', prog(t, f2 + .45, f2 + .8), 4);
    const yb = cy + 185 + (ts - 96) * .7;
    if (CFG.sub) txt(CFG.sub, W / 2, yb, `${fit(CFG.sub, 'jbBd', 30, 1100)}px jbBd`, 'rgba(255,255,255,.8)', 'center', prog(t, f2 + .7, f2 + 1.1), 3);
    txt(D.dataLonga, W / 2, yb + (CFG.sub ? 52 : 0), `${fit(D.dataLonga, 'jbBd', 30, 1100)}px jbBd`, 'rgba(255,255,255,.6)', 'center', prog(t, f2 + .9, f2 + 1.3), 2);
    ctx.restore(); }
  ctx.restore();
}

// ---------- utilidades do item ----------
function idx(t) { const i = clamp(Math.floor((t - T0) / SEG), 0, N - 1); return [i, t - (T0 + i * SEG)]; }
function zoomK(lt) { return 1.08 + .09 * (lt / SEG) + .14 * (1 - eo(prog(lt, 0, 1.3))); }
function foto(i, lt, a, x = 0, y = 0, w = W, h = H, fy = .42) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  const fx = i % 2 ? .38 + .24 * (lt / SEG) : .62 - .24 * (lt / SEG);
  if (IM['n' + i]) cover(IM['n' + i], x, y, w, h, zoomK(lt), fx, fy); else { ctx.fillStyle = '#1a1c22'; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}
const tIn = lt => prog(lt, .25, .5) * (1 - prog(lt, SEG - .45, SEG - .1));
function numero(i, x, y, a, cor, corN = 'rgba(255,255,255,.7)') {
  txt(String(i + 1).padStart(2, '0'), x, y, '96px bsBl', cor, 'left', a); txt('/' + String(N).padStart(2, '0'), x + 92, y, '34px jbBd', corN, 'left', a); }
function tagCat(cat, x, y, a, bg, fg) { if (!cat || a <= 0) return; const cs = 26; ctx.font = `${cs}px jbBd`; const cw = ctx.measureText(cat).width + 36;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw * a, 46); ctx.clip(); rr(x, y, cw, 46, 6); ctx.fillStyle = bg; ctx.fill(); ctx.restore(); txt(cat, x + 18, y + 32, `${cs}px jbBd`, fg, 'left', a); }
function manchete(head, lt, x, fb, hs, lh, MW, cor, a) {
  wrapHead(head, hs, MW).forEach((l, k) => { const q = eo5(prog(lt, .55 + k * .1, 1.15 + k * .1)); if (q <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.rect(x - 10, fb - hs * .92 + k * lh, MW + 40, hs * 1.08); ctx.clip();
    txt(l, x, fb + k * lh + (1 - q) * hs, `${hs}px bsBl`, cor); ctx.restore(); });
}
function wrapHead(head, hs, MW) { return wrap(head.toUpperCase(), `${hs}px bsBl`, MW); }
function tamanhoHead(head, MW, max = 78, min = 54, linhas = 3) { let hs = max; while (wrapHead(head, hs, MW).length > linhas && hs > min) hs -= 4; return hs; }
function barra(lt, y, a, cor = RED, base = 'rgba(255,255,255,.18)') { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = base; ctx.fillRect(0, y, W, 4); ctx.fillStyle = cor; ctx.fillRect(0, y, W * clamp(lt / SEG), 4); ctx.restore(); }

// ---------- FOZ: foto cheia, texto sobre degradê escuro ----------
function storyFoz(t) {
  const [i, lt] = idx(t), n = ITENS[i];
  foto(i, lt, 1); if (i > 0 && lt < XF) foto(i - 1, SEG + lt, 1 - eio(lt / XF));
  let g = ctx.createLinearGradient(0, H * .3, 0, H); g.addColorStop(0, 'rgba(11,11,13,0)'); g.addColorStop(.5, 'rgba(11,11,13,.78)'); g.addColorStop(1, 'rgba(11,11,13,.97)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 240);
  g = ctx.createLinearGradient(0, 0, W * .7, 0); g.addColorStop(0, 'rgba(11,11,13,.45)'); g.addColorStop(1, 'rgba(11,11,13,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const a = tIn(lt); if (a <= 0) return;
  const MW = 920, BASE = H - 175, hs = tamanhoHead(n.head, MW), lh = hs, nl = wrapHead(n.head, hs, MW).length, fb = BASE - 70 - (nl - 1) * lh;
  numero(i, 80, fb - hs - 18, a * eo5(prog(lt, .3, .8)), RED);
  tagCat(n.cat, 262, fb - hs - 66, a * eo5(prog(lt, .45, .9)), '#fff', PRETO);
  manchete(n.head, lt, 80, fb, hs, lh, MW, '#fff', a);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = RED; ctx.fillRect(82, BASE - 44, 120 * eo5(prog(lt, 1.0, 1.6)), 5); ctx.restore();
  if (n.sub) txt(n.sub, 82, BASE + 2, `${fit(n.sub, 'mrSb', 34, MW)}px mrSb`, 'rgba(255,255,255,.92)', 'left', a * prog(lt, 1.2, 1.6));
  txt(n.fonte || 'FONTE: PORTAL DA CIDADE FOZ DO IGUAÇU', 82, BASE + 44, '20px jbBd', 'rgba(255,255,255,.55)', 'left', a * prog(lt, 1.4, 1.8), 1);
  ctx.save(); ctx.globalAlpha = a; selo(n, W - 250, 265, back(prog(lt, 1.5, 2.0), 1.4)); ctx.restore();
  const qs = 270; ctx.save(); ctx.globalAlpha = a; qrCard(i, W - 70 - qs, BASE + 44 - qs - 52, qs, back(prog(lt, 1.1, 1.6), 1.3)); ctx.restore();
  barra(lt, H - 76, a);
}

// ---------- BRASIL: foto em cima, painel claro editorial embaixo ----------
function storyBrasil(t) {
  const [i, lt] = idx(t), n = ITENS[i];
  const PH = Math.round(H * .44), PY = H - 72 - PH;               // painel claro
  foto(i, lt, 1, 0, 0, W, PY + 40, .4); if (i > 0 && lt < XF) foto(i - 1, SEG + lt, 1 - eio(lt / XF), 0, 0, W, PY + 40, .4);
  let g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 220);
  // painel: sobe na troca de notícia
  const sp = eo5(prog(lt, .05, .55)) * (1 - eio(prog(lt, SEG - .4, SEG))), py = PY + (1 - sp) * (PH * .25);
  ctx.save(); ctx.fillStyle = NEVOA; ctx.fillRect(0, py, W, H - py); ctx.fillStyle = FUNDO; ctx.fillRect(0, py, W, 10); ctx.restore();
  const a = tIn(lt); if (a <= 0) return;
  const MW = 960, hs = tamanhoHead(n.head, MW, 72, 50), lh = hs, nl = wrapHead(n.head, hs, MW).length;
  const top = py + 60;
  numero(i, 80, top + 52, a * eo5(prog(lt, .3, .8)), FUNDO, 'rgba(11,11,13,.55)');
  tagCat(n.cat, 262, top + 6, a * eo5(prog(lt, .45, .9)), PRETO, '#fff');
  const fb = top + 70 + hs;
  manchete(n.head, lt, 80, fb, hs, lh, MW, PRETO, a);
  const yb = fb + (nl - 1) * lh + 58;
  if (n.sub) txt(n.sub, 82, yb, `${fit(n.sub, 'mrSb', 32, MW)}px mrSb`, '#2a2a30', 'left', a * prog(lt, 1.2, 1.6));
  txt(n.fonte || 'FONTE: CNN BRASIL', 82, yb + 42, '20px jbBd', 'rgba(11,11,13,.5)', 'left', a * prog(lt, 1.4, 1.8), 1);
  ctx.save(); ctx.globalAlpha = a; selo(n, W - 250, 230, back(prog(lt, 1.5, 2.0), 1.4), FUNDO); ctx.restore();
  const qs = 250; ctx.save(); ctx.globalAlpha = a; qrCard(i, W - 70 - qs, py - qs * .42, qs, back(prog(lt, 1.1, 1.6), 1.3), PRETO); ctx.restore();
  barra(lt, H - 76, a, FUNDO, 'rgba(11,11,13,.12)');
}

// ---------- CURIOSIDADES: texto à esquerda, foto em círculo com zoom à direita ----------
function rich(html) { const out = []; html.replace(/<\/?em>/g, m => m === '<em>' ? '\u0001' : '\u0002').split(/\s+/).forEach(w => {
  out.push(w); }); let em = false; return out.map(w => { const s = w.includes('\u0001'); if (s) em = true; const clean = w.replace(/[\u0001\u0002]/g, ''); const r = { w: clean, em }; if (w.includes('\u0002')) em = false; return r; }).filter(r => r.w); }
function richLines(tokens, size, MW) { ctx.font = `${size}px mrXb`; const sp = ctx.measureText(' ').width, lines = [[]]; let x = 0;
  tokens.forEach(tk => { const w = ctx.measureText(tk.w).width; if (x + w > MW && lines[lines.length - 1].length) { lines.push([]); x = 0; } lines[lines.length - 1].push({ ...tk, x, wd: w }); x += w + sp; }); return lines; }
function storyCuriosidade(t) {
  const [i, lt] = idx(t), n = ITENS[i];
  ctx.fillStyle = GRAF; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.035)'; const off = (t * 6) % 36; for (let x = -36 + off; x < W; x += 36) for (let y = -36 + off; y < H; y += 36) ctx.fillRect(x, y, 3, 3); ctx.restore();
  const gx = W * .72 + Math.sin(t * .3) * 80, rg = ctx.createRadialGradient(gx, H * .45, 0, gx, H * .45, 700); rg.addColorStop(0, 'rgba(255,201,60,.10)'); rg.addColorStop(1, 'rgba(255,201,60,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  // círculo com a foto
  const R = Math.min(300, H * .28), CX = 1090, CY = H * .44;
  const cin = eo5(prog(lt, 0, .7)) * (1 - eio(prog(lt, SEG - .45, SEG - .05)));
  const desenhaCirc = (k, lti, al) => { if (al <= 0) return; ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(CX, CY, R * (.82 + .18 * k), 0, 7); ctx.clip();
    foto(k === 1 && lti === lt ? i : i, lti, 1, CX - R, CY - R, R * 2, R * 2, .5); ctx.restore(); };
  desenhaCirc(cin, lt, cin);
  ctx.save(); ctx.globalAlpha = cin; ctx.strokeStyle = AMAR; ctx.lineWidth = 8; ctx.lineCap = 'round'; const a0 = -Math.PI / 2 + t * .4;
  ctx.beginPath(); ctx.arc(CX, CY, R + 22, a0, a0 + Math.PI * 1.25 * eo(prog(lt, .2, 1.2))); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CX, CY, R + 44, 0, 7); ctx.stroke(); ctx.restore();
  const a = tIn(lt); if (a <= 0) return;
  // texto
  txt('VOCÊ SABIA?', 80, 150, '34px jbBd', AMAR, 'left', a * prog(lt, .3, .6), 4);
  numero(i, 80, 262, a * eo5(prog(lt, .3, .8)), AMAR);
  tagCat(n.cat, 262, 214, a * eo5(prog(lt, .45, .9)), '#fff', PRETO);
  const MW = 560, toks = rich(n.head); let size = 52, lines = richLines(toks, size, MW);
  const maxL = Math.floor((H - 330 - 200) / (size * 1.22)); while (lines.length > Math.max(5, maxL) && size > 34) { size -= 2; lines = richLines(toks, size, MW); }
  const lh = size * 1.22, y0 = 340 + size;
  lines.forEach((ln, k) => { const q = eo5(prog(lt, .6 + k * .09, 1.2 + k * .09)); if (q <= 0) return;
    ln.forEach(tk => txt(tk.w, 80 + tk.x, y0 + k * lh + (1 - q) * 30, `${size}px mrXb`, tk.em ? AMAR : '#fff', 'left', a * q)); });
  const yf = y0 + (lines.length - 1) * lh + 60;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = AMAR; ctx.fillRect(82, yf - 30, 100 * eo5(prog(lt, 1.2, 1.8)), 5); ctx.restore();
  txt('FONTE: ' + (n.fonte || '').toUpperCase(), 82, yf + 12, '22px jbBd', 'rgba(255,255,255,.6)', 'left', a * prog(lt, 1.5, 1.9), 1);
  const qs = 210; ctx.save(); ctx.globalAlpha = a; qrCard(i, W - 60 - qs, CY + R - qs * .55, qs, back(prog(lt, 1.3, 1.8), 1.3), AMAR, PRETO); ctx.restore();
  // pontos de progresso
  for (let k = 0; k < N; k++) { const on = k === i, wd = on ? 70 : 18; const x = 80 + k * 34 + (k > i ? 52 : 0);
    ctx.save(); ctx.globalAlpha = a * (on ? 1 : .35); rr(x, H - 70, wd, 14, 7); ctx.fillStyle = on ? AMAR : '#fff'; ctx.fill();
    if (on) { ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(x + wd * clamp(lt / SEG), H - 70, wd * (1 - clamp(lt / SEG)), 14, 7); ctx.fill(); } ctx.restore(); }
}

// ---------- moldura (sem logos durante o conteúdo) ----------
function chrome(t) {
  const a = prog(t, T0 - .2, T0 + .3); if (a <= 0) return;
  const chip = D.dataCurta, cs = fit(chip, 'jbBd', 28, 220);
  const chipBg = TEMA === 'brasil' ? 'rgba(11,11,13,.85)' : TEMA === 'curiosidades' ? 'rgba(255,255,255,.1)' : RED;
  ctx.save(); ctx.globalAlpha = a; rr(W - 300, 40, 240, 78, 14); ctx.fillStyle = chipBg; ctx.fill(); ctx.restore(); txt(chip, W - 180, 91, `${cs}px jbBd`, '#fff', 'center', a);
  if (!CFG.ticker) return;
  const lab = CFG.ticker; ctx.font = '28px jbBd'; const lw = ctx.measureText(lab).width + 50;
  const fundoT = TEMA === 'brasil' ? PRETO : '#fff', corT = TEMA === 'brasil' ? '#fff' : PRETO, labBg = TEMA === 'brasil' ? FUNDO : RED;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fundoT; ctx.fillRect(0, H - 72, W, 72); ctx.fillStyle = labBg; ctx.fillRect(0, H - 72, lw, 72);
  txt(lab, lw / 2, H - 26, '28px jbBd', '#fff', 'center'); ctx.beginPath(); ctx.rect(lw, H - 72, W - lw, 72); ctx.clip();
  const TK = D.ticker; ctx.font = '34px mrXb'; const tw = Math.max(ctx.measureText(TK).width, 1); const off = (t * 140) % tw; txt(TK + TK + TK, lw + 20 - off, H - 24, '34px mrXb', corT); ctx.restore();
}

function story(t) { if (t < T0 - .3) return; if (TEMA === 'brasil') storyBrasil(t); else if (TEMA === 'curiosidades') storyCuriosidade(t); else storyFoz(t); }
function frame(t) { ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = PRETO; ctx.fillRect(0, 0, W, H); story(t); chrome(t); opening(t); }
function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
window.renderAt = async t => frame(t);
let t0 = 0; function tick(now) { frame(((now - t0) / 1000) % DUR); requestAnimationFrame(tick); }
(async () => { await Promise.all(['bsBl', 'mrXb', 'mrBd', 'mrSb', 'jbBd'].map(f => document.fonts.load(`60px ${f}`)));
  for (const [k, v] of Object.entries(window.IMGS)) { const im = await loadImg(v); if (im) IM[k] = im; }
  ITENS.forEach((n, i) => { try { QRS[i] = makeQR(n.url); } catch (e) { QRS[i] = null; } });
  window.__ready = true;
  if (!window.__NO_PLAY && !new URLSearchParams(location.search).has('export')) { t0 = performance.now(); requestAnimationFrame(tick); } })();
