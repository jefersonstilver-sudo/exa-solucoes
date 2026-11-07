/*
 * EXA · "peça HTML" intercalada no player do anúncio (só na réplica das TVs, ?tela=1) — TESTE 07/11/2026.
 * Pedido do Jeferson: no LOCAL DE TESTE NOVO, uma volta toca o vídeo "Notícias Brasil", na volta seguinte entra,
 * no lugar dele, o quadro animado de câmbio (K2 · Fortuna Jebai · cripto, /painel-web/pecas/cambio.html), e assim alterna.
 * - Só nos prédios da lista PREDIOS (o NUC não carrega este arquivo).
 * - O quadro fica pré-carregado num iframe escondido; ao entrar, recomeça da 1ª cena e dura o que ele informar
 *   (3 cenas × 15 s = 45 s; sem cripto, 30 s). Depois a programação segue do anúncio seguinte.
 * - window.__exaPeca = true enquanto o quadro está na tela: o vigia do tv.js e a medição de saúde da réplica não
 *   contam esse tempo como "vídeo parado", e a prova de exibição não soma esses segundos ao anúncio anterior.
 */
(function () {
  try {
    if (!/[?&]tela=1(&|$)/.test(location.search)) return;
    var PREDIOS = ['969f12ca']; // LOCAL DE TESTE NOVO
    var p = (location.search.match(/[?&]p=([0-9a-f]{8})/i) || [])[1];
    if (!p || PREDIOS.indexOf(p.toLowerCase()) < 0) return;
    var NOTICIAS_BRASIL = 'c08f3154-e0dc-4c39-b8a2-721d8acdde7f';
    var URL_PECA = '/painel-web/pecas/cambio.html?v=' + Date.now();
    var vez = 1; // a 1ª vez que as Notícias Brasil chegam já entra o quadro (para testar logo); depois alterna
    var quadro = null, caixa = null, interno = null, prontoEm = 0;
    var info = window.__pecaInfo = { mostrou: 0, noticias: 0, ultimo: null };

    function montar() {
      var v = document.getElementById('video-propaganda');
      var wrap = v && v.parentNode;
      if (!wrap || quadro) return;
      caixa = document.createElement('div');
      caixa.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;z-index:50;background:#070b16;display:none';
      quadro = document.createElement('iframe');
      quadro.setAttribute('scrolling', 'no');
      quadro.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:890px;border:0;transform-origin:0 0';
      quadro.onload = function () { prontoEm = Date.now(); };
      quadro.src = URL_PECA;
      caixa.appendChild(quadro);
      wrap.appendChild(caixa);
    }

    function encaixar() {
      if (!caixa) return;
      var w = caixa.clientWidth || 1080, h = caixa.clientHeight || 890;
      quadro.style.transform = 'scale(' + (w / 1080) + ',' + (h / 890) + ')';
    }

    function mostrar(seguir) {
      var dur = 45000;
      try { var jw = quadro.contentWindow; if (jw && jw.exaReiniciar) dur = jw.exaReiniciar() || dur; } catch (e) { /* segue com 45 s */ }
      window.__exaPeca = true;
      info.mostrou++; info.ultimo = new Date().toISOString();
      try { var v = document.getElementById('video-propaganda'); if (v) v.pause(); } catch (e) { /* segue */ }
      var qr = document.getElementById('qr-propaganda'), qrVis = qr ? qr.style.visibility : '';
      if (qr) qr.style.visibility = 'hidden';
      caixa.style.display = 'block';
      encaixar();
      setTimeout(function () {
        caixa.style.display = 'none';
        if (qr) qr.style.visibility = qrVis;
        window.__exaPeca = false;
        seguir();
      }, dur);
    }

    // envolve a troca de anúncio (a que estiver valendo: a do propagandas.js ou o revezamento do tv.js)
    var embrulho = function () {
      try {
        if (window.__exaPeca) return;
        if (typeof playlist !== 'undefined' && playlist.length && quadro && prontoEm) {
          var i = currentIdx + 1;
          if (i < playlist.length) {
            var it = playlist[i];
            if (it && String(it.id_pedido) === NOTICIAS_BRASIL) {
              vez++;
              if (vez % 2 === 0) {
                currentIdx = i; // pula as Notícias Brasil desta volta
                mostrar(function () { var f = interno; if (f) f(); });
                return;
              }
              info.noticias++;
            }
          }
        }
      } catch (e) { console.error('peca: falhou, segue a programação', e); }
      return interno.apply(this, arguments);
    };

    var tentativas = 0;
    var vigia = setInterval(function () {
      tentativas++;
      try {
        if (typeof window.tocarProximo !== 'function') return;
        montar();
        // espera o revezamento do tv.js se instalar (ou desistir) antes de envolver
        if (window.__tvDuplo === undefined && !window.__tvSemDuplo && tentativas < 40) return;
        if (window.tocarProximo !== embrulho) { interno = window.tocarProximo; window.tocarProximo = embrulho; }
        var vs = document.querySelectorAll('.video-wrapper video');
        for (var k = 0; k < vs.length; k++) if (typeof vs[k].onended === 'function' && vs[k].onended !== embrulho) vs[k].onended = embrulho;
      } catch (e) { /* segue */ }
    }, 500);
    window.addEventListener('resize', encaixar);
  } catch (e) { /* sem a peça */ }
})();
