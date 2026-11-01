/*
 * EXA · compatibilidade da tela do elevador em navegador antigo (TV box com Chrome < 84).
 * O "gap" do flexbox só existe a partir do Chrome 84: sem ele, os cartões da tela grudam uns nos outros.
 * Se o navegador não tiver, este script reproduz o gap com margem nos filhos. Em navegador novo, não faz nada.
 * Fica fora de ui/ de propósito: ui/ é idêntica à tela dos NUCs; o build injeta este arquivo só na cópia publicada.
 */
(function () {
  try {
    var t = document.createElement('div');
    t.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
    t.appendChild(document.createElement('div'));
    t.appendChild(document.createElement('div'));
    (document.body || document.documentElement).appendChild(t);
    var temGap = t.scrollHeight === 1;
    t.parentNode.removeChild(t);
    if (temGap) return;
  } catch (e) { /* segue com o ajuste */ }

  var LADO = { row: 'marginLeft', 'row-reverse': 'marginRight', column: 'marginTop', 'column-reverse': 'marginBottom' };
  function aplicar() {
    var els = document.body ? document.body.getElementsByTagName('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var cs = window.getComputedStyle(el);
      if (cs.display !== 'flex' && cs.display !== 'inline-flex') continue;
      var dir = cs.flexDirection || 'row';
      var coluna = dir.indexOf('column') === 0;
      var g = parseFloat(coluna ? cs.rowGap : cs.columnGap) || 0;
      var prop = LADO[dir] || 'marginLeft';
      var primeiro = true;
      for (var k = 0; k < el.children.length; k++) {
        var c = el.children[k];
        var ccs = window.getComputedStyle(c);
        if (ccs.display === 'none' || ccs.position === 'absolute' || ccs.position === 'fixed') continue;
        var alvo = primeiro ? 0 : g;
        primeiro = false;
        if (c.__exaGap === alvo) continue;
        // não briga com margem definida no CSS da tela (ex.: margin-left:auto)
        if (c.__exaGap === undefined && parseFloat(ccs[prop]) !== 0) { c.__exaGap = -1; continue; }
        if (c.__exaGap === -1) continue;
        c.style[prop] = alvo ? alvo + 'px' : '';
        c.__exaGap = alvo;
      }
    }
  }
  function iniciar() {
    aplicar();
    var pend = null;
    if (window.MutationObserver) {
      new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = null; aplicar(); }, 250); })
        .observe(document.body, { childList: true, subtree: true });
    }
    setInterval(aplicar, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
