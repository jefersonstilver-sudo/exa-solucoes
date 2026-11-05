/*
 * EXA · réplica da tela do elevador numa TV box (só com ?tela=1).
 * Medido no Zeta Plus (Android 10, Chrome 74): "PIPELINE_ERROR_DECODE: video decoder reinitialization failed".
 * O mesmo <video> troca de arquivo a cada anúncio (1920×1080, 608×1080, 1310×1080…) e o Chrome tenta reaproveitar o
 * decodificador de hardware; no box isso falha e todos os anúncios passam a ser pulados (tela preta).
 * Aqui: antes de cada troca o player do anúncio é desmontado (decodificador novo a cada vídeo) e o mascote animado,
 * que abriria mais um decodificador por cima, fica parado na TV (só a imagem, quando não há aviso). Nada muda no NUC nem no navegador do síndico.
 */
(function () {
  try {
    if (!/[?&]tela=1(&|$)/.test(location.search)) return;
    // mascote: na TV fica só o boneco parado com "SEM AVISOS NO MOMENTO" (sem vídeo: não abre outro decodificador)
    window.__mascoteEstatico = true;

    var desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (!desc || !desc.set || !desc.get) return;
    var preparar = function () {
      var v = document.getElementById('video-propaganda');
      if (!v || v.__exaTroca) return;
      v.__exaTroca = true;
      Object.defineProperty(v, 'src', {
        configurable: true,
        get: function () { return desc.get.call(v); },
        set: function (u) {
          // troca com dois players (duploBuffer): o próximo já está carregado no outro <video>, nada a fazer aqui
          if (window.__tvDuplo) { desc.set.call(v, u); return; }
          try {
            // sem piscar preto entre anúncios: o último quadro fica por cima até o próximo vídeo começar a tocar
            // (só entre dois horizontais: saindo do vertical premium em tela cheia, o quadro ficava cortado lá em cima)
            var formaDe = function (x) { return /vertical/i.test(String(x || '')) ? 'v' : 'h'; };
            if (desc.get.call(v) && v.readyState >= 2 && v.videoWidth && v.getAttribute('data-fullscreen') !== 'true' &&
                formaDe(desc.get.call(v)) === 'h' && formaDe(u) === 'h') {
              var c = document.getElementById('tv-ultimo-quadro');
              if (!c) {
                c = document.createElement('canvas'); c.id = 'tv-ultimo-quadro';
                c.style.cssText = 'position:absolute;pointer-events:none;z-index:3;object-fit:cover';
                v.parentNode.insertBefore(c, v.nextSibling);
              }
              c.width = Math.min(960, v.videoWidth); c.height = Math.round(c.width * v.videoHeight / v.videoWidth);
              c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
              c.style.left = v.offsetLeft + 'px'; c.style.top = v.offsetTop + 'px';
              c.style.width = v.offsetWidth + 'px'; c.style.height = v.offsetHeight + 'px';
              try { c.style.objectFit = getComputedStyle(v).objectFit || 'cover'; } catch (e2) {}
              c.style.display = 'block';
              var some = function () { v.removeEventListener('playing', some); setTimeout(function () { c.style.display = 'none'; }, 120); };
              v.addEventListener('playing', some);
              setTimeout(function () { c.style.display = 'none'; }, 6000);
            }
          } catch (e) { /* segue */ }
          try {
            // v2: com as versões leves todos os horizontais têm o mesmo tamanho (874x720): entre dois horizontais
            // o decodificador é reaproveitado (troca sem a parada de 1–2 s). Vertical, mudança de formato ou
            // qualquer erro de vídeo: desmonta como antes (e, depois de um erro, sempre desmonta).
            var antes = String(desc.get.call(v) || '');
            var forma = function (x) { return /vertical/i.test(x) ? 'v' : 'h'; };
            var reaproveita = antes && !window.__tvSempreDesmonta && forma(antes) === forma(String(u)) && forma(antes) === 'h';
            if (antes && !reaproveita) { v.pause(); v.removeAttribute('src'); v.load(); }
          } catch (e) { /* segue */ }
          desc.set.call(v, u);
        }
      });
    };
    document.addEventListener('error', function (ev) {
      var t = ev.target;
      if (t && t.id === 'video-propaganda') window.__tvSempreDesmonta = true;
    }, true);
    // roda antes do iniciar() do propagandas.js (este script está no <head>, o listener dele é registrado antes)
    document.addEventListener('DOMContentLoaded', preparar);
    document.addEventListener('DOMContentLoaded', function () { setTimeout(duploBuffer, 0); });

    /*
     * Troca sem engasgo: dois <video> se revezam. Uns 3 s antes do anúncio acabar, o próximo já é carregado no player
     * escondido (decodificador pronto, primeiro quadro na memória). No fim, o escondido começa a tocar e só aparece
     * quando já está rodando; o antigo é descarregado em seguida. Qualquer problema (erro de vídeo, player não ficou
     * pronto a tempo) cai na troca normal do propagandas.js. Duas falhas seguidas desligam o revezamento.
     */
    function duploBuffer() {
      try {
        if (window.__tvSemDuplo || typeof tocarProximo !== 'function' || typeof applyVisualMode !== 'function') return;
        var A = document.getElementById('video-propaganda');
        if (!A || !A.parentNode) return;
        var B = document.createElement('video');
        B.muted = true; B.setAttribute('muted', ''); B.setAttribute('playsinline', ''); B.preload = 'auto';
        B.className = A.className;
        B.style.cssText = A.style.cssText; B.style.visibility = 'hidden';
        A.parentNode.insertBefore(B, A);
        window.__tvDuplo = true;
        var info = window.__tvInfo = { duplo: true, prontas: 0, normais: 0, falhas: 0, espera_ms: 0 };
        var pre = { el: B, src: '' };
        var falhas = 0;
        var fonteDe = function (it) { return '/cache/' + encodeURI(it.video); };
        var plusDe = function (it) { return it && (it.isPlus === true || it.isPlus === 'true'); };
        var errou = function () {
          falhas++; pre.src = ''; info.falhas++;
          if (falhas >= 2) { window.__tvDuplo = false; window.__tvSemDuplo = true; info.duplo = false; console.log('tv: revezamento desligado'); }
        };
        B.addEventListener('error', errou); A.addEventListener('error', function () { if (pre.el === A) errou(); });
        var carregar = function () {
          try {
            if (!window.__tvDuplo || !playlist.length) return;
            var i = currentIdx + 1; if (i >= playlist.length) i = 0;
            var it = playlist[i]; if (!it || !it.video) return;
            var src = fonteDe(it);
            if (pre.src === src) return;
            pre.src = src;
            pre.el.preload = 'auto';
            pre.el.src = src;
            pre.el.load();
          } catch (e) { /* segue */ }
        };
        setInterval(function () {
          try {
            var v = videoElement;
            if (v && isFinite(v.duration) && v.duration > 0 && v.duration - v.currentTime < 3.2) carregar();
          } catch (e) { /* segue */ }
        }, 300);

        var normal = window.tocarProximo;
        var trocar = async function () {
          try {
            if (!window.__tvDuplo || !playlist.length) return normal();
            var i = currentIdx + 1;
            if (i >= playlist.length) return normal(); // fim do ciclo: o propagandas.js recarrega a programação
            var it = playlist[i], el = pre.el, velho = videoElement;
            if (!it || el === velho || pre.src !== fonteDe(it) || el.readyState < 2 || el.error) { info.normais++; return normal(); }
            var t0 = Date.now();
            currentIdx = i;
            var plus = plusDe(it);
            applyVisualMode(el, plus);
            el.style.visibility = 'hidden';
            el.onended = window.tocarProximo;
            if (velho) velho.onended = null;
            var feito = false;
            var mostrar = function () {
              if (feito) return; feito = true;
              info.prontas++; info.espera_ms = Date.now() - t0;
              el.style.visibility = '';
              if (velho) { velho.style.visibility = 'hidden'; velho.removeAttribute('id'); velho.removeAttribute('data-fullscreen'); }
              el.id = 'video-propaganda';
              videoElement = el;
              try { applyQRCode(it, plus); } catch (e) { /* segue */ }
              setTimeout(function () {
                try { if (velho) { velho.pause(); velho.removeAttribute('src'); velho.load(); } } catch (e) { /* segue */ }
                pre = { el: velho || B, src: '' };
              }, 250);
            };
            el.addEventListener('playing', function um() { el.removeEventListener('playing', um); mostrar(); });
            setTimeout(mostrar, 1500);
            try { await el.play(); } catch (e) { feito = true; errou(); currentIdx = i - 1; el.style.visibility = 'hidden'; return normal(); }
            if (el.currentTime > 0.05) mostrar();
          } catch (e) { console.error('tv: revezamento falhou, troca normal', e); return normal(); }
        };
        window.tocarProximo = trocar;
        if (A.onended) A.onended = trocar;
        console.log('tv: revezamento de players ligado');
      } catch (e) { window.__tvDuplo = false; }
    }
  } catch (e) { /* segue sem o ajuste */ }
})();
