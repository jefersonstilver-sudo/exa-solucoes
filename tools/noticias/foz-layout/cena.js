// EXA · Notícias Foz — layout "editorial" (estudo 2026-10-26). Render determinístico: window.renderAt(t)
const W = 1080, H = 890, DUR = window.DUR_TOTAL || 50; // 01/11: dura menos quando há menos de 6 notícias · layout oficial Notícias Foz (aprovado 26/10/2026)
const C = { creme: '#F2F6F9', verde: '#005C95', verde2: '#0A4A75', limao: '#98BE12', tinta: '#08263B', cinza: '#5E7385' };
const exaSvg = (cor, w) => `<svg viewBox="0 0 1000 ${LOGO.h}" style="width:${w}px;display:block">${LOGO.letters.map(l => `<path d="${l.d}" fill="${cor}" fill-rule="evenodd"/>`).join('')}</svg>`;
const lockup = (h) => `<div class="lock">${exaSvg(C.tinta, h * 2.1)}<i></i><img src="${IMG.portal}" style="height:${h * 1.15}px"></div>`;
const $ = id => document.getElementById(id);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const p = (t, a, b) => cl((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3), eo5 = x => 1 - Math.pow(1 - x, 5), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function st(el, o) { if (typeof el === 'string') el = $(el); for (const k in o) el.style[k] = o[k]; }
const show = (id, on) => st(id, { display: on ? 'block' : 'none' });

// ---------- dados ----------
const N = window.NEWS;
// linha do tempo (s)
const N0 = 3.4, FIM = 3.0, NS = (DUR - N0 - FIM) / window.NEWS.length;
const T = { s1: [0, N0], s2: [-2, -1], s3: [-2, -1], n: window.NEWS.map((_, i) => [N0 + i * NS, N0 + (i + 1) * NS]), rec: [-2, -1] };
T.fim = [DUR - FIM, DUR];

// ---------- montagem do DOM ----------
function build() {
  const root = $('stage');
  root.innerHTML = `
  <div id="s1" class="sc"><div id="s1img" class="bg" style="background-image:url(${IMG.capa})"></div><div class="shade"></div><div class="shadeL"></div>
    <div class="pill" id="s1pill">${lockup(40)}</div>
    <div id="s1a" class="mega big1" style="left:60px;top:120px;color:#fff;text-shadow:0 6px 40px rgba(0,0,0,.55)">FOZ</div>
    <div id="s1bw" class="hl" style="left:48px;top:318px"><div id="s1b" class="mega big1" style="position:relative;color:${C.tinta}">HOJE.</div></div>
    <div id="s1c" class="chip datag" style="left:60px;top:590px">${window.DATA_TXT}</div>
    </div>

  <div id="s2" class="sc" style="background:${C.limao}">
    <div id="s2a" class="mega2" style="left:120px;top:250px;color:${C.tinta}">PLANTÃO</div>
    <div id="s2b" class="mega2" style="left:64px;top:430px;color:rgba(8,38,59,.45)">DA CIDADE.</div></div>

  <div id="s3" class="sc" style="background:${C.creme}">
    <div class="kick" style="left:64px;top:60px">NA EDIÇÃO DE HOJE</div>
    <div id="s3t" class="h1" style="left:64px;top:96px">O que aconteceu<br><span style="color:${C.cinza}">em Foz.</span></div>
    ${N.map((n, i) => `<div id="s3r${i}" class="row" style="top:${292 + i * 92}px"><div class="num">0${i + 1}</div><div class="rt">${n.lista}</div><div class="ln" id="s3l${i}"></div>
      <div class="thumb" id="s3m${i}">${n.img ? `<img src="${IMG[n.img]}">` : `<div class="semimg" style="width:100%;height:100%"></div>`}</div></div>`).join('')}</div>

  ${N.map((n, i) => `
  <div id="n${i}" class="sc" style="background:${C.creme}">
    <div id="n${i}full" class="full">${n.img ? `<div id="n${i}bg" class="bg" style="background-image:url(${IMG[n.img]})"></div>` : `<div id="n${i}bg" class="bg semimg"></div>`}
      <div class="shade"></div>
      <div class="kchip" id="n${i}k" style="${n.tema ? `background:${n.tema.chip};color:#fff` : ``}">0${i + 1} · ${n.cat}</div>
      <div id="n${i}w" class="mega" style="left:60px;top:560px;color:#fff">${n.palavra}</div>
      <div id="n${i}s" class="chip" style="left:64px;top:735px">${n.chip}</div>
      ${n.foco ? `<div class="foco" id="n${i}f" style="left:${n.foco[0]}px;top:${n.foco[1]}px"></div>` : ''}
    </div>
    <div id="n${i}ed" class="ed">
      <div class="kick" style="left:64px;top:48px">0${i + 1} · ${n.cat} · NOTÍCIAS FOZ</div>
      <div id="n${i}h" class="h2" style="left:64px;top:80px">${n.manchete}</div>
      <div id="n${i}fr" class="frame">${n.img ? `<img src="${IMG[n.img]}">` : `<div class="semimg" style="position:absolute;inset:0"></div>`}</div>
      <div class="col">
        <div class="kick2">O QUE SABER</div>
        ${n.pontos.map((t, j) => `<div class="pt" id="n${i}p${j}"><div class="hlbg" id="n${i}hb${j}" style="${n.tema ? `background:${n.tema.hl}` : ``}"></div><div class="pn">0${j + 1}</div><div class="ptx">${t}</div></div>`).join('')}
      </div>
      <div class="qrc" id="n${i}q"><div class="qr" id="n${i}qr"></div><div class="qrl">LEIA A MATÉRIA ↗</div></div>
      <div class="fonte">FONTE <img src="${IMG.portal}"></div>
    </div>
  </div>`).join('')}

  <div id="rec" class="sc" style="background:${C.verde}">
    <div class="kick" style="left:64px;top:70px;color:${C.limao}">RESUMO</div>
    <div id="rect" class="h1" style="left:64px;top:104px;color:#fff">Hoje em Foz.</div>
    ${N.map((n, i) => `<div class="card" id="rc${i}" style="left:${64 + (i % 3) * 324}px;top:${232 + Math.floor(i / 3) * 262}px">
      <div class="cimg">${n.img ? `<img src="${IMG[n.img]}">` : `<div class="semimg" style="width:100%;height:100%"></div>`}</div>
      <div class="cw">${n.palavra}</div><div class="cn">0${i + 1}</div></div>`).join('')}
    <div id="recl" class="reclabel">Aponte a câmera para o QR de cada notícia e leia na íntegra.</div></div>

  <div id="fim" class="sc" style="background:#fff"><div class="fimbar"></div>
    <div id="fimlogo" class="fimlock">${exaSvg(C.tinta, 300)}<i></i><img src="${IMG.portal}"></div>
    <div id="fimt" class="fimt">Notícias de Foz do Iguaçu,<br>todo dia, no seu elevador.</div>
    <div id="fims" class="fims">EXA E PORTAL DA CIDADE INFORMAM · FOZ DO IGUAÇU</div>
    <div id="fimv" class="chev"></div></div>

  <div id="strip"></div>`;
  N.forEach((n, i) => { const q = qrcode(0, 'M'); q.addData(n.url); q.make(); $(`n${i}qr`).innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); });
  $('strip').innerHTML = N.map((n, i) => `<div class="st" id="st${i}">${n.img ? `<img src="${IMG[n.img]}">` : `<div class="semimg" style="width:84px;height:56px"></div>`}<b>0${i + 1}</b></div>`).join('');
}

// ---------- quadros ----------
function frame(t) {
  const inS = (a) => t >= a[0] && t < a[1];
  // S1
  show('s1', inS(T.s1));
  if (inS(T.s1)) {
    st('s1img', { transform: `scale(${1.04 + .06 * p(t, 0, 3.4)})` });
    const a = eo5(p(t, .15, .55)), b = eo5(p(t, .8, 1.25)), w = eo(p(t, .75, 1.15));
    st('s1a', { opacity: a, transform: `translateY(${(1 - a) * 60}px)` });
    st('s1bw', { clipPath: `inset(0 ${(1 - w) * 100}% 0 0)` });
    st('s1b', { opacity: b, transform: `translateX(${(1 - b) * -30}px)` });
    const c = eo(p(t, 1.5, 1.9)); st('s1c', { opacity: c, transform: `translateY(${(1 - c) * 20}px)` });
    st('s1pill', { opacity: eo(p(t, .1, .5)) }); 
    const out = eo(p(t, 3.1, 3.4)); st('s1', { opacity: 1 - out * .0 });
  }
  // S2 — "slam" em duas linhas
  show('s2', inS(T.s2));
  if (inS(T.s2)) {
    const lt = t - T.s2[0]; const a = eo5(p(lt, 0, .45)), b = eo5(p(lt, .25, .7));
    st('s2a', { transform: `translateX(${(1 - a) * 500 - lt * 18}px)` });
    st('s2b', { transform: `translateX(${(1 - b) * -500 + lt * 18}px)` });
  }
  // S3 — índice com linhas desenhando e miniaturas
  show('s3', inS(T.s3));
  if (inS(T.s3)) {
    const lt = t - T.s3[0];
    st('s3t', { opacity: eo(p(lt, 0, .4)), transform: `translateY(${(1 - eo(p(lt, 0, .4))) * 24}px)` });
    N.forEach((_, i) => { const a = eo5(p(lt, .4 + i * .35, .9 + i * .35));
      st(`s3r${i}`, { opacity: a, transform: `translateY(${(1 - a) * 30}px)` });
      st(`s3l${i}`, { transform: `scaleX(${eo(p(lt, .6 + i * .35, 1.4 + i * .35))})` });
      const m = back(p(lt, 1.0 + i * .35, 1.5 + i * .35)); st(`s3m${i}`, { transform: `scale(${m})` }); });
  }
  // notícias
  N.forEach((n, i) => {
    const [a0, a1] = T.n[i]; const on = t >= a0 && t < a1; show(`n${i}`, on); if (!on) return;
    const lt = t - a0, MUDA = 2.4; // 0–3.6 foto cheia; depois layout editorial
    // foto cheia
    const fullOn = lt < MUDA + .6; st(`n${i}full`, { display: fullOn ? 'block' : 'none' });
    if (fullOn) {
      const pr = eio(p(lt, MUDA, MUDA + .6)); // foto encolhe para o quadro do layout
      st(`n${i}full`, { transform: `translate(${pr * 64}px, ${pr * 230}px) scale(${1 - pr * .52})`, transformOrigin: '0 0', borderRadius: `${pr * 6}px` });
      st(`n${i}bg`, { transform: `scale(${1.03 + .07 * p(lt, 0, MUDA)})` });
      const w = eo5(p(lt, .15, .55)); st(`n${i}w`, { opacity: w * (1 - pr), transform: `translateY(${(1 - w) * 70}px)` });
      st(`n${i}k`, { opacity: eo(p(lt, .1, .4)) * (1 - pr) });
      const s = eo(p(lt, .6, .95)); st(`n${i}s`, { opacity: s * (1 - pr), transform: `translateY(${(1 - s) * 16}px)` });
      if (n.foco) { const f = p(lt, .8, 1.3); st(`n${i}f`, { opacity: eo(f) * (1 - pr), transform: `translate(-50%,-50%) scale(${.6 + .4 * back(f)}) rotate(${lt * 30}deg)` }); }
    }
    // layout editorial
    const ed = lt >= MUDA; st(`n${i}ed`, { display: ed ? 'block' : 'none' });
    if (ed) {
      const e = lt - MUDA;
      st(`n${i}h`, { opacity: eo(p(e, .3, .7)), transform: `translateY(${(1 - eo(p(e, .3, .7))) * 20}px)` });
      st(`n${i}fr`, { opacity: p(e, .5, .55), transform: `scale(${1.0 + .03 * p(e, .5, 6)})` });
      n.pontos.forEach((_, j) => { const a = eo5(p(e, .5 + j * .2, .9 + j * .2));
        st(`n${i}p${j}`, { opacity: a, transform: `translateX(${(1 - a) * 30}px)` });
        // destaque limão percorre os pontos
        const h0 = 1.0 + j * 1.9, h = eo(p(e, h0, h0 + .35)) * (1 - eo(p(e, h0 + 1.35, h0 + 1.6)));
        st(`n${i}hb${j}`, { transform: `scaleX(${j === n.pontos.length - 1 ? eo(p(e, h0, h0 + .35)) : h})` }); });
      const q = back(p(e, .7, 1.2)); st(`n${i}q`, { transform: `scale(${q})` });
    }
  });
  // faixa de miniaturas acumulando (como na referência)
  const stOn = T.n.some(([a0, a1]) => t >= a0 + 2.5 && t < a1); st('strip', { display: stOn ? 'flex' : 'none' });
  if (stOn) N.forEach((_, i) => { const k = T.n[i][0] + 2.5, a = back(p(t, k, k + .45)); st(`st${i}`, { transform: `scale(${t >= k ? a : 0})`, width: t >= k ? '84px' : '0px', marginRight: t >= k ? '8px' : '0' }); });
  // resumo
  show('rec', inS(T.rec));
  if (inS(T.rec)) { const lt = t - T.rec[0];
    st('rect', { opacity: eo(p(lt, 0, .35)) });
    N.forEach((_, i) => { const a = eo5(p(lt, .15 + i * .1, .55 + i * .1)); st(`rc${i}`, { opacity: a, transform: `translateY(${(1 - a) * 60}px)` }); });
    st('recl', { opacity: eo(p(lt, 1.0, 1.3)) }); }
  // fim
  show('fim', inS(T.fim));
  if (inS(T.fim)) { const lt = t - T.fim[0]; const a = eo5(p(lt, 0, .5));
    st('fimlogo', { clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`, transform: `translateY(${(1 - a) * 20}px)` });
    st('fimt', { opacity: eo(p(lt, .6, 1.0)), transform: `translateY(${(1 - eo(p(lt, .6, 1.0))) * 16}px)` });
    st('fims', { opacity: eo(p(lt, 1.0, 1.4)) });
    st('fimv', { opacity: eo(p(lt, .8, 1.2)), transform: `translateY(${-8 * Math.sin(lt * 3)}px) rotate(45deg)` }); }
}
window.renderAt = async t => frame(t);
build(); frame(0); window.__ready = true;
