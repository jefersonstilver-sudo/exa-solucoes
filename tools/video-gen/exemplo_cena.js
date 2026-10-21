// Exemplo de cena (Bike J). Funciona nos dois formatos: usa K.vert para trocar o layout.
const tl = K.init(); const P = K.P, V = K.vert, C = K.C;
// Cena 1 - gancho: roda de bicicleta girando (SVG proprio) + headline
K.scene(tl, 0, V ? 3.4 : 2.6, (L, t) => {
  const box = V ? { x: 140, y: 290, w: 800, h: 1000 } : { x: 1060, y: 160, w: 760, h: 820 };
  if (P.media) K.media(tl, t + .1, { parent: L, rect: box }); // video/foto do cliente e o protagonista
  else {
  const wheel = K.el(K.R(box), `<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="88" fill="none" stroke="${C.accent}" stroke-width="10"/><circle cx="100" cy="100" r="12" fill="#fff"/>${Array.from({ length: 16 }, (_, i) => `<line x1="100" y1="100" x2="${100 + 84 * Math.cos(i * Math.PI / 8)}" y2="${100 + 84 * Math.sin(i * Math.PI / 8)}" stroke="#fff" stroke-width="2.5" opacity=".7"/>`).join('')}</svg>`, L);
  tl.from(wheel, { scale: .2, opacity: 0, duration: .7, ease: 'back.out(1.6)' }, t + .1).to(wheel, { rotation: 540, duration: 3.2, ease: 'power1.inOut' }, t + .1);
  }
  const h = K.text(L, P.mensagem, V ? K.zone('text') : K.zone('left'), { font: 'black', size: V ? 116 : 132, align: V ? 'center' : 'left', accentLast: true });
  K.reveal(tl, h, t + .35);
});
// Cena 2 - demonstracao: o cliente pede pelo WhatsApp e recebe a oferta
K.scene(tl, V ? 3.2 : 2.45, V ? 7 : 5.3, (L, t) => {
  K.header(tl, t + .1, 'Pede pelo WhatsApp', L);
  K.phone(tl, t + .15, { parent: L, rect: V ? { x: 150, y: 290, w: 780, h: 1000 } : { x: 1150, y: 130, w: 600, h: 860 },
    msgs: [[.35, 'r', 'Minha bike ta fazendo barulho :('], [1.2, 'l', 'Traz que a gente resolve hoje!'], [2.1, 'l', { title: P.frases[0] || 'Revisao em 24h', sub: P.empresa, cta: 'AGENDAR' }]] });
  const tt = K.text(L, P.frases[0] || P.mensagem, V ? { x: 64, y: 1340, w: 952, h: 380 } : { x: 110, y: 240, w: 960, h: 680 }, { font: 'black', size: V ? 92 : 112, align: V ? 'center' : 'left', accentLast: true });
  K.reveal(tl, tt, t + .5);
});
// Cena 3 - oferta + agenda do fim de semana
K.scene(tl, V ? 6.8 : 5.15, V ? 10.6 : 7.75, (L, t) => {
  K.offer(tl, t + .1, { parent: L, big: '20%', title: P.frases[2] || 'Promo de sabado', sub: 'Acessorios selecionados', tag: 'SO NO SABADO', cx: V ? 540 : 1420, cy: V ? 720 : 560, w: V ? 600 : 520 });
  if (V) { const tt = K.text(L, 'Todo sabado tem novidade', { x: 64, y: 1330, w: 952, h: 360 }, { font: 'black', size: 96, accentLast: true }); K.reveal(tl, tt, t + .6); }
  else K.checks(tl, t + .3, { parent: L, items: P.frases.slice(1, 4), rect: { x: 110, y: 220, w: 840, h: 700 } });
});
if (V) K.scene(tl, 10.4, 12.6, (L, t) => { K.header(tl, t + .1, 'Por que a ' + P.empresa, L); K.stats(tl, t + .2, { parent: L, items: P.numeros.map(n => ({ v: n.valor, sufixo: n.sufixo, rotulo: n.rotulo })), rect: { x: 64, y: 300, w: 952, h: 620 } }); K.checks(tl, t + .7, { parent: L, items: P.frases.slice(1, 3), rect: { x: 64, y: 1000, w: 952, h: 420 } }); });
K.end(tl, V ? 12.4 : 7.6);
K.finish(tl);
