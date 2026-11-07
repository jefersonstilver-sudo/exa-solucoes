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

    // 06/11/2026 — app Android 1.0.14+: a abertura da EXA e a tela de carregamento são do próprio app (nativas).
    // A página manda o andamento real (ExaTela.progresso) e libera quando está fluida (ExaTela.liberar).
    var ponte = null;
    try { ponte = window.ExaTela || (window.parent !== window && window.parent.ExaTela) || null; } catch (e) { ponte = null; }
    var nativo = !!(ponte && ponte.progresso && ponte.liberar);
    if (nativo) { try { ponte.segurar(); } catch (e) { /* segue */ } }
    // enquanto a abertura (vídeo do app) toca, os vídeos da página esperam: não disputam o decodificador
    // (a KTC tem só 2). Só atrasa o play; a carga (download, primeiro quadro) já vai acontecendo.
    if (ponte && ponte.introVideo) {
      var playOrig = HTMLMediaElement.prototype.play;
      var naAbertura = function () { try { return !!ponte.introVideo(); } catch (e) { return false; } };
      HTMLMediaElement.prototype.play = function () {
        var el = this, args = arguments;
        if (!naAbertura() || typeof Promise === 'undefined') return playOrig.apply(el, args);
        return new Promise(function (ok, ko) {
          var t = setInterval(function () {
            if (naAbertura()) return;
            clearInterval(t);
            try { var r = playOrig.apply(el, args); if (r && r.then) r.then(ok, ko); else ok(); } catch (e) { ko(e); }
          }, 300);
        });
      };
    }

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
                c.style.cssText = 'position:absolute;pointer-events:none;z-index:3;object-fit:cover;opacity:0' + (+(String(navigator.userAgent).match(/Chrome\/(\d+)/) || [0, 0])[1] >= 100 ? ';will-change:transform,opacity' : '');
                v.parentNode.insertBefore(c, v.nextSibling);
              }
              c.width = Math.min(960, v.videoWidth); c.height = Math.round(c.width * v.videoHeight / v.videoWidth);
              c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
              c.style.left = v.offsetLeft + 'px'; c.style.top = v.offsetTop + 'px';
              c.style.width = v.offsetWidth + 'px'; c.style.height = v.offsetHeight + 'px';
              try { c.style.objectFit = getComputedStyle(v).objectFit || 'cover'; } catch (e2) {}
              c.style.opacity = '1';
              var some = function () { v.removeEventListener('playing', some); setTimeout(function () { c.style.opacity = '0'; }, 120); };
              v.addEventListener('playing', some);
              setTimeout(function () { c.style.opacity = '0'; }, 6000);
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
            // medição: quanto tempo a tela fica parada em cada troca (do novo arquivo até o primeiro quadro tocando)
            var info = window.__tvInfo = window.__tvInfo || { trocas: [], desmonta_sempre: false };
            info.desmonta_sempre = !!window.__tvSempreDesmonta;
            var t0 = Date.now(), tipo = (reaproveita ? 'r' : 'd') + forma(String(u));
            var fim = function () {
              v.removeEventListener('playing', fim);
              info.trocas.push(tipo + ':' + (Date.now() - t0));
              if (info.trocas.length > 12) info.trocas.shift();
            };
            v.addEventListener('playing', fim);
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
    // 06/11/2026 — TELA DE ESPERA DE VERDADE (boot): depois de faltar energia o Zeta ficava minutos engasgando, com tela
    // escura e a câmera parada. Agora uma tela EXA fica por cima e só sai quando é verdade que está tudo pronto:
    //  1) vídeos da programação guardados no aparelho (o service worker baixa um de cada vez);
    //  2) anúncio tocando com quadro novo; 3) câmera tocando (se a TV tem câmera);
    //  4) fluidez conferida: 4 s seguidos acima de 22 quadros/s, sem engasgo maior que 250 ms.
    // Tudo isso 4 s seguido -> some. Teto de 6 min (aí mostra assim mesmo e registra). O andamento aparece na tela.
    document.addEventListener('DOMContentLoaded', function () {
      try {
        var t0 = Date.now(), fim = false;
        var cx = document.createElement('div');
        cx.id = 'tv-espera';
        cx.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483647;background:#0c0610;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;transition:opacity .6s';
        cx.innerHTML = '<div style="font-size:120px;font-weight:800;letter-spacing:-4px;color:#fff">exa</div>' +
          '<div style="margin-top:28px;font-size:34px;font-weight:700">Preparando a tela</div>' +
          '<div id="tv-espera-passos" style="margin-top:36px;font-size:28px;line-height:1.7;opacity:.85;text-align:left;min-width:640px"></div>' +
          '<div style="margin-top:36px;width:640px;height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden"><div id="tv-espera-barra" style="height:100%;width:3%;background:#EA251D"></div></div>';
        if (nativo) cx.style.display = 'none'; // o app desenha a tela de carregamento (por cima de tudo)
        (document.body || document.documentElement).appendChild(cx);
        var passosEl = document.getElementById('tv-espera-passos'), barra = document.getElementById('tv-espera-barra');
        var est = { total: 0, prontos: 0, feito: false, rodando: false, sem_leve: 0 };
        navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', function (ev) { if (ev.data && ev.data.tipo === 'preparo') est = ev.data; });
        // fluidez: quadros da página
        var quadros = [], ultimo = 0;
        var medir = function (t) { if (fim) return; if (ultimo) quadros.push([t, t - ultimo]); ultimo = t; while (quadros.length && t - quadros[0][0] > 4000) quadros.shift(); requestAnimationFrame(medir); };
        requestAnimationFrame(medir);
        // vídeo andando de verdade: 3 conferências seguidas (1 s cada) com o tempo avançando e quadro novo decodificado
        var andou = function (v, k) {
          if (!v || !v.currentSrc || v.paused || v.readyState < 2) { if (v) v[k] = null; return false; }
          var q = 0; try { q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality().totalVideoFrames : (v.webkitDecodedFrameCount || 0); } catch (e) { q = 0; }
          var a = v[k] || { t: -1, q: -1, n: 0 };
          var foi = v.currentTime > a.t + 0.3 && (!q || q > a.q);
          v[k] = { t: v.currentTime, q: q, n: foi ? a.n + 1 : 0 };
          return v[k].n >= 3;
        };
        var okDesde = 0, hq = [], lat = { v: false, a: false, c: false, f: false, fDesde: 0 };
        var tique = setInterval(function () {
          try {
            if (fim) return;
            try { navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({ tipo: 'preparo' }); } catch (e) { /* segue */ }
            // sem service worker controlando a página (primeira abertura), não há como guardar: não prende a tela por isso
            var semSw = !(navigator.serviceWorker && navigator.serviceWorker.controller) && Date.now() - t0 > 20000;
            var videosOk = semSw || est.feito || (est.total > 0 && est.prontos >= est.total);
            var ad = window.videoElement || document.getElementById('video-propaganda');
            var adOk = andou(ad, '__esperaAd');
            var cam = document.getElementById('live-video');
            var semCam = /[?&]cam=0(&|$)/.test(location.search) || !document.querySelector('.camera-video-wrapper');
            var camOk = semCam || andou(cam, '__esperaCam') || Date.now() - t0 > 150000; // câmera fora do ar não prende a tela
            var fps = 0, pior = 0;
            if (quadros.length > 10) { fps = quadros.length / ((quadros[quadros.length - 1][0] - quadros[0][0]) / 1000 || 1); quadros.forEach(function (q) { if (q[1] > pior) pior = q[1]; }); }
            var fluido = fps >= 22 && pior < 250;
            // com a tela do app por cima, o navegador desenha a página "escondida" e o requestAnimationFrame não mede
            // nada de verdade (dá 13/s no Zeta): aí a fluidez é a do próprio anúncio — quadros decodificados por
            // segundo e quadros perdidos nos últimos 4 s.
            if (nativo) {
              var qa = null; try { qa = ad && ad.getVideoPlaybackQuality ? ad.getVideoPlaybackQuality() : null; } catch (e) { qa = null; }
              var agoraQ = Date.now();
              if (qa && adOk) { hq.push([agoraQ, qa.totalVideoFrames || 0, qa.droppedVideoFrames || 0]); } else hq = [];
              while (hq.length && agoraQ - hq[0][0] > 4500) hq.shift();
              fps = 0; fluido = false;
              if (hq.length >= 4) {
                var a0 = hq[0], a1 = hq[hq.length - 1], dt = (a1[0] - a0[0]) / 1000, dq = a1[1] - a0[1], dd = a1[2] - a0[2];
                if (dt > 0 && dq >= 0) { fps = dq / dt; fluido = dt >= 3 && fps >= 15 && (dq ? dd / dq : 1) < 0.08; }
              }
            }
            // cada etapa cumprida fica valendo (troca de anúncio pausa o vídeo por um instante e zerava tudo: a tela
            // nunca saía). A fluidez precisa de 3 s seguidos uma vez, depois das outras.
            if (videosOk) lat.v = true; if (adOk) lat.a = true; if (camOk) lat.c = true;
            videosOk = lat.v; adOk = lat.a; camOk = lat.c;
            if (videosOk && adOk && camOk && fluido) lat.fDesde = lat.fDesde || Date.now(); else if (!lat.f) lat.fDesde = 0;
            if (lat.fDesde && Date.now() - lat.fDesde >= 3000) { lat.f = true; (window.__tvInfo = window.__tvInfo || {}).boot_fluido = true; }
            // aparelho fraco (Zeta): com anúncio e câmera prontos, a fluidez espera no máximo 20 s — a tela não fica presa
            if (videosOk && adOk && camOk && !lat.f) { lat.prontoDesde = lat.prontoDesde || Date.now(); if (Date.now() - lat.prontoDesde > 20000) { lat.f = true; (window.__tvInfo = window.__tvInfo || {}).boot_fluido = false; } }
            if (lat.f) fluido = true;
            var tudo = videosOk && adOk && camOk && lat.f;
            okDesde = tudo ? (okDesde || Date.now()) : 0;
            var ck = function (b) { return b ? '✓' : '…'; };
            passosEl.innerHTML =
              '<div>' + ck(videosOk) + ' Vídeos no aparelho: ' + (est.total ? est.prontos + ' de ' + est.total : 'conferindo') + '</div>' +
              '<div>' + ck(adOk) + ' Anúncio tocando</div>' +
              '<div>' + ck(camOk) + ' Câmera ' + (semCam ? '(sem câmera)' : 'ao vivo') + '</div>' +
              '<div>' + ck(fluido) + ' Fluidez: ' + (fps ? Math.round(fps) + ' quadros/s' : 'medindo') + '</div>';
            var p = (est.total ? 0.55 * est.prontos / est.total : 0.05) + (adOk ? 0.15 : 0) + (camOk ? 0.1 : 0) + (fluido ? 0.1 : 0) + (okDesde ? 0.1 * Math.min(1, (Date.now() - okDesde) / 4000) : 0);
            barra.style.width = Math.max(3, Math.round(p * 100)) + '%';
            if (nativo) {
              var tit, det = '';
              if (!videosOk) { tit = 'Guardando os anúncios no aparelho'; det = est.total ? est.prontos + ' de ' + est.total : 'conferindo a programação'; }
              else if (!adOk) { tit = 'Ligando o player de anúncios'; det = 'anúncios guardados ✓'; }
              else if (!camOk) { tit = 'Conectando a câmera ao vivo'; det = 'anúncio tocando ✓'; }
              else if (!fluido) { tit = 'Conferindo a fluidez'; det = fps ? Math.round(fps) + ' quadros/s' : 'medindo'; }
              else { tit = 'Tudo pronto'; det = ''; }
              try { ponte.progresso(Math.min(0.97, p), tit, det); } catch (e) { /* segue */ }
            }
            var estourou = Date.now() - t0 > 60000; // nunca mais de 1 min escondendo a tela
            if (okDesde || estourou) {
              fim = true; clearInterval(tique);
              var info = window.__tvInfo = window.__tvInfo || {};
              info.boot_s = Math.round((Date.now() - t0) / 1000); info.boot_ok = !estourou; info.boot_nativo = nativo;
              if (nativo) { try { ponte.progresso(1, 'Tudo pronto', ''); ponte.liberar(); } catch (e) { /* segue */ } }
              cx.style.opacity = '0'; setTimeout(function () { try { cx.remove(); } catch (e) { cx.style.display = 'none'; } }, 700);
            }
          } catch (e) { /* segue */ }
        }, 1000);
      } catch (e) { /* sem tela de espera: segue como antes */ }
    });
    // 06/11/2026 (Zeta): vídeo vertical aparecendo no espaço horizontal e horizontal esticado em tela cheia.
    // O modo (tela cheia premium ou espaço horizontal) vinha só do isPlus da programação; quando ele não bate com o
    // arquivo, a imagem sai errada. Aqui a TV decide pelo formato REAL do vídeo (altura > largura = tela cheia) e
    // registra a divergência em __tvInfo.orient (vai no replica_saude) para corrigir o dado na origem.
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        try {
          var orig = window.applyVisualMode;
          if (typeof orig !== 'function' || orig.__exa) return;
          // 06/11/2026 (Del Fuego esticado no Zeta): o player do NUC usa object-fit:fill — o vídeo estica até
          // preencher o espaço. Vídeo vertical 4:5 em tela cheia 9:16, ou formato diferente do espaço, deformava.
          // Agora: formato do arquivo a até 4% do espaço = preenche (como antes); mais que isso = encaixa inteiro
          // (sobra borda preta, nunca deforma).
          var encaixar = function (el) {
            try {
              var w = el.videoWidth, h = el.videoHeight, ew = el.clientWidth, eh = el.clientHeight;
              if (!w || !h || !ew || !eh) return;
              var r = (w / h) / (ew / eh);
              el.style.objectFit = (r > 1.04 || r < 0.96) ? 'contain' : 'fill';
              el.style.backgroundColor = '#000';
            } catch (e) { /* segue */ }
          };
          var corrigir = function (el, isPlus) {
            var w = el.videoWidth, h = el.videoHeight;
            if (!w || !h) return;
            var vert = h > w * 1.1, plus = isPlus === true || isPlus === 'true';
            if (vert === plus) { encaixar(el); return; }
            orig(el, vert);
            encaixar(el);
            var info = window.__tvInfo = window.__tvInfo || {};
            var nome = String(el.currentSrc || '').split('/').pop().slice(-60);
            info.orient = (info.orient || []).filter(function (x) { return x.indexOf(nome) < 0; }).concat([nome + (vert ? ' vertical sem isPlus' : ' horizontal com isPlus')]).slice(-6);
          };
          var novo = function (el, isPlus) {
            orig(el, isPlus);
            try {
              // player já carregado (troca com dois players): decide na hora; senão, quando o arquivo novo abrir
              if (el.readyState >= 1) corrigir(el, isPlus);
              else el.addEventListener('loadedmetadata', function um() { el.removeEventListener('loadedmetadata', um); corrigir(el, isPlus); });
            } catch (e) { /* segue */ }
          };
          novo.__exa = true;
          window.applyVisualMode = novo;
          // rede de segurança: TODO anúncio que começa a tocar é conferido aqui, venha de onde vier a troca
          // (dois players, recarga, cache): horizontal em tela cheia volta para o espaço; vertical no espaço vai
          // para tela cheia; e o encaixe nunca deforma.
          document.addEventListener('playing', function (ev) {
            try {
              var el = ev.target;
              if (!el || el.tagName !== 'VIDEO' || el.id === 'live-video' || /mascote/.test(el.className || '')) return;
              if (!el.closest || !el.closest('.video-wrapper') && el.id !== 'video-propaganda' && el.getAttribute('data-fullscreen') !== 'true') return;
              var w = el.videoWidth, h = el.videoHeight;
              if (!w || !h) return;
              var vert = h > w * 1.1, fs = el.getAttribute('data-fullscreen') === 'true' || el.style.position === 'fixed';
              if (fs !== vert) {
                orig(el, vert);
                var info = window.__tvInfo = window.__tvInfo || {};
                var nome = String(el.currentSrc || '').split('/').pop().slice(-60);
                info.orient = (info.orient || []).filter(function (x) { return x.indexOf(nome) < 0; }).concat([nome + (vert ? ' vertical no espaço (corrigido ao tocar)' : ' horizontal em tela cheia (corrigido ao tocar)')]).slice(-6);
              }
              encaixar(el);
            } catch (e) { /* segue */ }
          }, true);
        } catch (e) { /* segue */ }
      }, 0);
    });
    document.addEventListener('DOMContentLoaded', function () { setTimeout(duploBuffer, 0); });

    /*
     * Troca sem engasgo: dois <video> se revezam. Uns 3 s antes do anúncio acabar, o próximo já é carregado no player
     * escondido (decodificador pronto, primeiro quadro na memória). No fim, o escondido começa a tocar e só aparece
     * quando já está rodando; o antigo é descarregado em seguida. Qualquer problema (erro de vídeo, player não ficou
     * pronto a tempo) cai na troca normal do propagandas.js. Duas falhas seguidas desligam o revezamento.
     */
    function duploBuffer() {
      try {
        // ?duplo=0 desliga. Medido no Zeta (Las Brisas, 05/11): 17 trocas seguidas, ~20–80 ms até o novo tocar e só 3–6 s
        // "parado" a cada 2 min (antes 10–16 s). Uma vez o anúncio parou de vez: por isso o vigia abaixo.
        if (/[?&]duplo=0(&|$)/.test(location.search)) return;
        if (window.__tvSemDuplo || typeof tocarProximo !== 'function' || typeof applyVisualMode !== 'function') return;
        var A = document.getElementById('video-propaganda');
        if (!A || !A.parentNode) return;
        var B = document.createElement('video');
        B.muted = true; B.setAttribute('muted', ''); B.setAttribute('playsinline', ''); B.preload = 'auto';
        B.className = A.className;
        B.style.cssText = A.style.cssText;
        A.parentNode.insertBefore(B, A);
        // os dois players ficam em camadas próprias do compositor e a troca é por opacidade: com
        // visibility/hidden a árvore de camadas muda e, na TV KTC (WebView 128, página girada 90°), a tela inteira
        // era redesenhada por partes na troca (imagem "dobrada" por ~0,3 s a cada anúncio, 06/11)
        // 06/11/2026: troca por opacidade em camada própria só no WebView novo (KTC, Chrome 128: sem ela a página girada
        // se redesenhava "dobrada"). No WebView 74 (Zeta) as camadas extras pesaram (25% de quadros perdidos e trocas
        // engasgando), então lá volta o visibility que era fluido.
        var cromo = +(String(navigator.userAgent).match(/Chrome\/(\d+)/) || [0, 0])[1];
        var camadas = cromo >= 100;
        var esconder = camadas ? function (x) { x.style.opacity = '0'; x.style.pointerEvents = 'none'; } : function (x) { x.style.visibility = 'hidden'; };
        var revelar = camadas ? function (x) { x.style.opacity = ''; x.style.pointerEvents = ''; } : function (x) { x.style.visibility = ''; };
        if (camadas) [A, B].forEach(function (x) { x.style.willChange = 'transform, opacity'; x.style.backfaceVisibility = 'hidden'; });
        esconder(B);
        window.__tvDuplo = true;
        var info = window.__tvInfo = { duplo: true, prontas: 0, normais: 0, falhas: 0, espera_ms: 0 };
        var pre = { el: B, src: '' };
        var falhas = 0;
        var fonteDe = function (it) { return '/cache/' + encodeURI(it.video); };
        var plusDe = function (it) { return it && (it.isPlus === true || it.isPlus === 'true'); };
        // TV com só 2 decodificadores (TV KTC/MediaTek: anúncio + câmera ocupam tudo, o 3º dá PIPELINE_ERROR_DECODE):
        // (no premium em tela cheia a câmera está coberta: o empréstimo começa 3,2 s antes, como no Zeta)
        // na troca a câmera é emprestada por ~1,5 s (LivePlayer.liberar/retomar) e o próximo anúncio carrega no lugar dela
        var doisDec = /[?&]doisdec=1(&|$)/.test(location.search), emprestou = false;
        var devolver = function () { if (!emprestou) return; emprestou = false; try { window.LivePlayer && window.LivePlayer.retomar(); } catch (e) { /* segue */ } };
        var errou = function (ev) {
          var alvoB = ev && ev.target === B, alvoEl = ev && ev.target, codigo = alvoEl && alvoEl.error ? alvoEl.error.code : 0;
          devolver();
          if ((alvoB || alvoEl === A) && codigo === 3 && !doisDec) {
            doisDec = true; info.dois_dec = true; pre.src = ''; info.ultimo_erro = 'B:3 (2 decodificadores: modo câmera emprestada)';
            return;
          }
          // no modo câmera emprestada um erro de decodificador (3) é só "não deu tempo de soltar a câmera":
          // a troca cai no modo normal uma vez e o revezamento continua (na noite de 05/11 ele se desligava
          // depois de 2 erros e a TV passava a noite com 20–60 s parada a cada 2 min)
          if (doisDec && codigo === 3) { pre.src = ''; info.decode_cam = (info.decode_cam || 0) + 1; info.ultimo_erro = 'B:3 (câmera ainda ocupada: troca normal)'; return; }
          falhas++; pre.src = ''; info.falhas++;
          // registra o motivo (aparece no replica_saude.tv) para entender as TVs onde o revezamento falha
          try {
            var alvo = ev && ev.target, er = alvo && alvo.error;
            info.ultimo_erro = (alvo === B ? 'B' : alvo === A ? 'A' : 'play') + ':' + (er ? er.code + ' ' + String(er.message || '').slice(0, 80) : String((ev && ev.message) || ev || '').slice(0, 80));
          } catch (e2) { /* segue */ }
          if (falhas >= 2) { window.__tvDuplo = false; window.__tvSemDuplo = true; info.duplo = false; console.log('tv: revezamento desligado'); }
        };
        B.addEventListener('error', errou); A.addEventListener('error', function (ev) { if (pre.el === A) errou(ev); });
        var carregar = function () {
          try {
            if (!window.__tvDuplo || !playlist.length) return;
            var i = currentIdx + 1; if (i >= playlist.length) i = 0;
            var it = playlist[i]; if (!it || !it.video) return;
            var src = fonteDe(it);
            if (pre.src === src) return;
            pre.src = src;
            if (doisDec && !emprestou) {
              try { emprestou = !!(window.LivePlayer && window.LivePlayer.liberar()); } catch (e) { emprestou = false; }
              // câmera não liberável (ao vivo em HLS, ou já carregando): não há decodificador livre, troca normal
              var camLigada = false; try { var cv = document.querySelector('.camera-video-wrapper video'); camLigada = !!(cv && cv.currentSrc && !cv.paused); } catch (e3) { /* segue */ }
              // sem a câmera emprestada não há decodificador livre: troca normal (sem tentar e falhar)
              if (!emprestou && (camLigada || !window.LivePlayer)) { pre.src = ''; info.sem_vaga = (info.sem_vaga || 0) + 1; return; }
            }
            pre.el.preload = 'auto';
            if (emprestou) {
              // a TV leva uns 300 ms para soltar o decodificador da câmera: carregar antes disso dá erro 3
              var alvo = pre.el;
              setTimeout(function () { if (pre.el === alvo && pre.src === src && window.__tvDuplo) { alvo.src = src; alvo.load(); } }, 350);
              return;
            }
            pre.el.src = src;
            pre.el.load();
          } catch (e) { /* segue */ }
        };
        setInterval(function () {
          try {
            var v = videoElement;
            if (v && isFinite(v.duration) && v.duration > 0 && v.duration - v.currentTime < (doisDec && v.getAttribute('data-fullscreen') !== 'true' ? 2.4 : 3.2)) carregar();
          } catch (e) { /* segue */ }
        }, 300);

        var normal = window.tocarProximo;
        var trocar = async function () {
          try {
            if (!window.__tvDuplo || !playlist.length) return normal();
            var i = currentIdx + 1;
            if (i >= playlist.length) { devolver(); return normal(); } // fim do ciclo: o propagandas.js recarrega a programação
            var it = playlist[i], el = pre.el, velho = videoElement;
            if (!it || el === velho || pre.src !== fonteDe(it) || el.readyState < 2 || el.error) { info.normais++; devolver(); return normal(); }
            var t0 = Date.now();
            currentIdx = i;
            var plus = plusDe(it);
            applyVisualMode(el, plus);
            esconder(el);
            el.onended = window.tocarProximo;
            if (velho) velho.onended = null;
            var feito = false;
            var mostrar = function () {
              if (feito) return; feito = true;
              info.prontas++; info.espera_ms = Date.now() - t0;
              revelar(el);
              if (velho) { esconder(velho); velho.removeAttribute('id'); velho.removeAttribute('data-fullscreen'); }
              el.id = 'video-propaganda';
              videoElement = el;
              try { applyQRCode(it, plus); } catch (e) { /* segue */ }
              setTimeout(function () {
                try { if (velho) { velho.pause(); velho.removeAttribute('src'); velho.load(); } } catch (e) { /* segue */ }
                pre = { el: velho || B, src: '' };
                setTimeout(devolver, 80);
              }, 250);
            };
            el.addEventListener('playing', function um() { el.removeEventListener('playing', um); mostrar(); });
            setTimeout(mostrar, 1500);
            try { await el.play(); } catch (e) { feito = true; errou(e); currentIdx = i - 1; esconder(el); return normal(); }
            if (el.currentTime > 0.05) mostrar();
          } catch (e) { console.error('tv: revezamento falhou, troca normal', e); return normal(); }
        };
        // vigia: se o anúncio que aparece ficar 4 s sem andar (fora da tela cheia de carregamento), sai do revezamento
        // nesta troca e segue pela troca normal; duas vezes = desliga o revezamento até a próxima recarga
        var ultT = -1, ultQ = -1, parouEm = 0, travadas = 0, tempos = [];
        // 06/11/2026 — AUTO-CURA da página: se o anúncio não troca há 3 min (ou o vídeo não mostra quadro novo há 90 s),
        // recarrega a página sozinha. No máximo 3 vezes por hora (depois o vigia do servidor reinicia o app e o Nando avisa).
        var curaSrc = '', curaTrocou = Date.now(), curaT = 0, curaQ = -1, curaQEm = Date.now();
        var autoCura = function (v) {
          try {
            var agora = Date.now();
            var src = (v && (v.currentSrc || v.src)) || '';
            var ct = (v && v.currentTime) || 0;
            // trocou de anúncio, ou o mesmo anúncio recomeçou (prédio com 1 anúncio só repete o mesmo arquivo)
            if (src !== curaSrc || ct + 1 < curaT) { curaSrc = src; curaTrocou = agora; }
            curaT = ct;
            var q = 0;
            try { q = v && v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality().totalVideoFrames : ((v && v.webkitDecodedFrameCount) || 0); } catch (e) { q = 0; }
            if (q !== curaQ || (v && v.paused && !v.ended)) { curaQ = q; curaQEm = agora; }
            var longo = v && isFinite(v.duration) && v.duration > 150;
            var parado = (!longo && agora - curaTrocou > 180000) || (q && agora - curaQEm > 90000);
            if (!parado) return;
            var hist = [];
            try { hist = JSON.parse(localStorage.getItem('exa_autocura') || '[]').filter(function (x) { return agora - x < 3600000; }); } catch (e) { hist = []; }
            if (hist.length >= 3) return;
            hist.push(agora);
            try { localStorage.setItem('exa_autocura', JSON.stringify(hist)); } catch (e) { /* segue */ }
            console.log('tv: auto-cura — anúncio parado, recarregando a página');
            location.reload();
          } catch (e) { /* segue */ }
        };
        try { info.autocura_1h = JSON.parse(localStorage.getItem('exa_autocura') || '[]').filter(function (x) { return Date.now() - x < 3600000; }).length; } catch (e) { /* segue */ }
        setInterval(function () {
          try {
            // quadro HTML intercalado (compat/peca.js) na tela: o anúncio está parado de propósito
            if (window.__exaPeca) { parouEm = Date.now(); curaTrocou = Date.now(); curaQEm = Date.now(); return; }
            var v = videoElement;
            autoCura(v);
            // com o revezamento desligado o vigia não age: senão, com o vídeo ainda baixando (prédio novo, sem cache),
            // ele pulava anúncio a cada 4 s e a tela ficava preta piscando o QR (TV KTC, Rio Negro, 05/11)
            if (!window.__tvDuplo) { ultT = -1; parouEm = Date.now(); return; }
            if (!v || !v.currentSrc) return;
            // 06/11/2026 (Zeta parado 6 min no anúncio novo da Oriente, 1310x1080 ainda sem versão leve): conta também os
            // quadros decodificados — tempo andando sem quadro novo = decodificador travado; e "acabou mas não trocou" > 3 s
            var q = 0;
            try { q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality().totalVideoFrames : (v.webkitDecodedFrameCount || 0); } catch (e) { q = 0; }
            var andou = v.currentTime !== ultT && (!q || q !== ultQ);
            if (andou) { ultT = v.currentTime; ultQ = q; parouEm = Date.now(); return; }
            if (v.ended && Date.now() - parouEm < 3000) return;
            if (Date.now() - parouEm > 4000) {
              parouEm = Date.now(); travadas++; info.travadas = travadas;
              console.log('tv: anúncio parado, troca normal');
              // 06/11/2026: só desliga com 3 travadas em 10 min (no boot, baixando os vídeos, 2 travadas desligavam para
              // sempre e o Zeta ficava a tarde no modo normal: 100 s parado a cada 2 min) e religa sozinho 10 min depois
              tempos = tempos.filter(function (x) { return Date.now() - x < 600000; }); tempos.push(Date.now());
              if (tempos.length >= 3 && !doisDec) {
                window.__tvDuplo = false; window.__tvSemDuplo = true; info.duplo = false; tempos = [];
                setTimeout(function () { window.__tvSemDuplo = false; window.__tvDuplo = true; info.duplo = true; }, 600000);
              }
              try { [A, B].forEach(function (x) { if (x !== v) { x.pause(); x.removeAttribute('src'); x.load(); esconder(x); } }); } catch (e) { /* segue */ }
              pre = { el: v === A ? B : A, src: '' };
              devolver();
              revelar(v);
              normal();
            }
          } catch (e) { /* segue */ }
        }, 1000);
        window.tocarProximo = trocar;
        if (A.onended) A.onended = trocar;
        console.log('tv: revezamento de players ligado');
      } catch (e) { window.__tvDuplo = false; }
    }
  } catch (e) { /* segue sem o ajuste */ }
})();
