/**
 * mascote.js (v25) - boneco animado do quadro de avisos.
 *
 * MODO 1 - SEM AVISOS (igual a v23):
 * - Parado, mostra parado.jpg (igual ao 1o/ultimo quadro de todos os clipes): troca imagem<->video invisivel.
 * - A cada 7-14 s toca 1 clipe de 10 s, sorteado sem repetir ate passar por todos.
 * - So comeca se termina antes do proximo vertical premium; se a tela cheia entrar, pausa e retoma.
 * - "SEM AVISOS NO MOMENTO" / "CONTATE SEU SINDICO" no HTML; somem quando o boneco sobe.
 *
 * MODO 2 - COM AVISOS (v25): o boneco TRAZ o aviso novo.
 * - A cada troca de aviso (com 2+ avisos; com 1 aviso so, no maximo a cada 40 s), o quadro do boneco
 *   entra deslizando por cima do aviso atual e ele empurra/arrasta uma placa branca ate cobrir a tela
 *   (~5 s; clipes e1/e2/e3, todos terminam em branco). Por baixo o proximo aviso ja carrega; o branco
 *   some suavemente e o aviso aparece, como se a placa tivesse virado o aviso.
 * - Nunca durante a tela cheia, nem se nao der tempo antes do proximo vertical: ai o rodizio segue normal.
 * - Qualquer falha -> o rodizio do avisos.js segue exatamente como antes.
 *
 * NUC fraco: 1 video pequeno (504x896) por vez, carregado na hora e descarregado ao terminar;
 * opacidade animando enquanto toca (bug do Firefox); nao mexe no #aviso-img (vigia do index.html ok).
 */
(() => {
  if (window.__mascote) return;

  const BASE = window.MASCOTE_BASE || "../assets/mascote/";
  const CLIPES = [
    { id: "bater", dur: 10.04, texto: [[4.4, 8.5]] },
    { id: "soquinho", dur: 10.04, texto: [[4.1, 8.8]] },
    { id: "papel", dur: 10.04, texto: [] },
    { id: "esconder", dur: 10.04, texto: [] },
    { id: "aviao", dur: 10.04, texto: [[6.4, 7.5]] },
  ];
  const APRESENTA = [
    { id: "e1_empurra", dur: 5.04, texto: [] },
    { id: "e2_arrasta", dur: 5.04, texto: [] },
    { id: "e3_desce", dur: 5.04, texto: [] },
  ];
  const ESPERA = [7000, 14000];
  const ESPERA_POS_TELA_CHEIA = [1500, 3000];
  const PRIMEIRA_ESPERA = [3000, 6000];
  const APRESENTA_MIN_MS = 40000;        // intervalo minimo entre apresentacoes de aviso
  const DESLIZE_MS = 450;
  const TRAVADO_MS = 4000;
  const FORA_MS = 10 * 60 * 1000;

  const st = {
    raiz: null, video: null, tocando: null, modo: "vazio", pausadoTelaCheia: false, estavaTelaCheia: false,
    proximoEm: Date.now() + rnd(PRIMEIRA_ESPERA), saco: [], sacoA: [], ultimo: null, fora: {},
    ultimoTempo: -1, ultimoAvanco: 0, apresentando: false, ultimaApresentacao: 0, aoTerminar: null,
  };

  function rnd([a, b]) { return a + Math.random() * (b - a); }
  const log = (m) => console.log("mascote: " + m);

  function montar() {
    const caixa = document.querySelector(".aviso-container");
    if (!caixa) return false;
    const r = document.createElement("div");
    r.className = "mascote";
    r.innerHTML =
      '<img class="mascote-parado" src="' + BASE + 'parado.jpg" alt="">' +
      '<video class="mascote-video" muted playsinline preload="none"></video>' +
      '<div class="mascote-texto tx-vazio">' +
      '  <img class="mascote-logo" src="' + (window.MASCOTE_LOGO || "../assets/logo-exa-branca.png") + '" alt="" onerror="this.style.display=\'none\'">' +
      '  <div class="mascote-t1">SEM AVISOS</div><div class="mascote-t2">NO MOMENTO</div>' +
      "</div>" +
      '<div class="mascote-texto tx-aviso">' +
      '  <div class="mascote-t1">ATEN&Ccedil;&Atilde;O</div><div class="mascote-t2 menor">AVISO DO S&Iacute;NDICO</div>' +
      "</div>" +
      '<div class="mascote-selo">CONTATE SEU S&Iacute;NDICO</div>' +
      '<div class="mascote-branco"></div>';
    caixa.appendChild(r);
    st.raiz = r;
    st.video = r.querySelector("video");
    st.video.muted = true;
    st.video.addEventListener("playing", () => r.classList.add("em-cena"));
    st.video.addEventListener("ended", () => { if (st.apresentando) r.classList.add("branco"); terminar("fim"); });
    st.video.addEventListener("error", () => {
      if (st.tocando) st.fora[st.tocando.id] = Date.now();
      terminar("erro");
    });
    instalarApresentacao();
    return true;
  }

  // ---------- leitura do resto do painel ----------
  function semAvisos() {
    try {
      return typeof _avisos !== "undefined" && Array.isArray(_avisos) && _avisos.length === 0 &&
        typeof _listaSig !== "undefined" && _listaSig !== null;
    } catch (e) { return false; }
  }
  function telaCheia() {
    try {
      const v = typeof videoElement !== "undefined" ? videoElement : document.getElementById("video-propaganda");
      return !!v && v.getAttribute("data-fullscreen") === "true";
    } catch (e) { return false; }
  }
  // um clipe de `dur` segundos cabe antes do proximo vertical premium?
  function cabe(dur) {
    try {
      const v = videoElement;
      if (!v || typeof playlist === "undefined" || !playlist.length) return true;
      const resta = isFinite(v.duration) && v.duration > 0 ? v.duration - v.currentTime : 0;
      const prox = playlist[(currentIdx + 1) % playlist.length];
      const proxPlus = !!prox && (prox.isPlus === true || prox.isPlus === "true");
      if (!proxPlus) return resta > 1;
      return resta >= dur + 1;
    } catch (e) { return true; }
  }

  function sortear(lista, chaveSaco) {
    const ok = (c) => !(st.fora[c.id] && Date.now() - st.fora[c.id] < FORA_MS);
    if (!st[chaveSaco].length) {
      st[chaveSaco] = lista.filter(ok).sort(() => Math.random() - 0.5);
      if (st[chaveSaco].length > 1 && st[chaveSaco][0].id === st.ultimo) st[chaveSaco].push(st[chaveSaco].shift());
    }
    return st[chaveSaco].shift() || null;
  }

  function tocarClipe(c) {
    st.tocando = c;
    st.ultimo = c.id;
    st.ultimoTempo = -1;
    st.ultimoAvanco = Date.now();
    st.video.src = BASE + c.id + ".mp4";
    st.video.currentTime = 0;
    const p = st.video.play();
    if (p && p.catch) p.catch(() => terminar("play falhou"));
    log("toca " + c.id);
  }

  function tocar() {
    const c = sortear(CLIPES, "saco");
    if (!c) { st.proximoEm = Date.now() + 60000; return; }
    tocarClipe(c);
  }

  function terminar(motivo) {
    const r = st.raiz;
    if (!r) return;
    r.classList.remove("em-cena", "texto-fora");
    try { st.video.pause(); st.video.removeAttribute("src"); st.video.load(); } catch (e) {}
    if (st.tocando) log("fim " + st.tocando.id + " (" + motivo + ")");
    st.tocando = null;
    st.pausadoTelaCheia = false;
    st.proximoEm = Date.now() + rnd(ESPERA);
    if (st.aoTerminar) { const f = st.aoTerminar; st.aoTerminar = null; f(); }
  }

  function textoNaHora() {
    const c = st.tocando;
    if (!c) return;
    const t = st.video.currentTime;
    st.raiz.classList.toggle("texto-fora", c.texto.some(([a, b]) => t >= a && t <= b));
  }

  // ---------- MODO 2: apresentar avisos ----------
  function podeApresentar(umSo) {
    return !!st.raiz && !st.apresentando && !st.tocando && !telaCheia() &&
      (!umSo || Date.now() - st.ultimaApresentacao >= APRESENTA_MIN_MS) && cabe(5.04 + 1.5);
  }

  function apresentar(seguir) {
    const r = st.raiz;
    const c = sortear(APRESENTA, "sacoA");
    if (!c) { seguir(); return; }
    st.apresentando = true;
    st.ultimaApresentacao = Date.now();
    r.classList.add("on", "apresenta");
    void r.offsetWidth;                  // garante que comeca fora da tela e desliza
    r.classList.add("entrando");
    log("traz aviso com " + c.id);
    let fim = false;
    const sair = () => {
      if (fim) return; fim = true;
      r.classList.add("branco");            // segura o branco enquanto o proximo aviso carrega por baixo
      try { seguir(); } catch (e) { console.error("mascote: rodizio", e); }
      setTimeout(() => {
        r.classList.add("saindo");          // o branco some e o aviso novo aparece
        setTimeout(() => {
          r.classList.remove("on", "apresenta", "entrando", "saindo", "branco");
          st.apresentando = false;
        }, 500);
      }, 450);
    };
    // seguranca: se algo travar, o aviso volta em no maximo 9 s
    const guarda = setTimeout(() => { st.aoTerminar = null; if (st.tocando) terminar("tempo"); sair(); }, 9000);
    setTimeout(() => {
      st.aoTerminar = () => { clearTimeout(guarda); sair(); };
      tocarClipe(c);
    }, DESLIZE_MS);
  }

  function instalarApresentacao() {
    try {
      if (typeof _avancar !== "function" || typeof _avisos === "undefined") return;
      const original = _avancar;
      // eslint-disable-next-line no-global-assign
      _avancar = function () {
        try {
          const len = _avisos.length;
          if (len > 0 && podeApresentar(len === 1)) { apresentar(() => original()); return; }
        } catch (e) { console.error("mascote: apresentar (ignorado)", e); }
        return original();
      };
      log("apresentacao de avisos ligada");
    } catch (e) { console.error("mascote: nao instalou apresentacao", e); }
  }

  // ---------- laco principal ----------
  function tick() {
    try {
      if (!st.raiz && !montar()) return;
      const r = st.raiz;

      if (st.apresentando) {             // modo 2 em andamento
        if (st.tocando) {
          const t = st.video.currentTime;
          if (t !== st.ultimoTempo) { st.ultimoTempo = t; st.ultimoAvanco = Date.now(); }
          else if (Date.now() - st.ultimoAvanco > TRAVADO_MS) terminar("travou");
        }
        return;
      }

      if (!semAvisos()) {                // tem aviso: fora de cena (so entra para apresentar)
        if (st.tocando) terminar("chegou aviso");
        r.classList.remove("on");
        return;
      }
      r.classList.add("on");

      if (telaCheia()) {
        st.estavaTelaCheia = true;
        if (st.tocando && !st.video.paused) { st.video.pause(); st.pausadoTelaCheia = true; }
        return;
      }
      if (st.estavaTelaCheia) {
        st.estavaTelaCheia = false;
        if (st.pausadoTelaCheia) {
          st.pausadoTelaCheia = false;
          st.ultimoAvanco = Date.now();
          const p = st.video.play(); if (p && p.catch) p.catch(() => terminar("retomar falhou"));
        } else if (!st.tocando) {
          st.proximoEm = Date.now() + rnd(ESPERA_POS_TELA_CHEIA);
        }
      }

      if (st.tocando) {
        textoNaHora();
        const t = st.video.currentTime;
        if (t !== st.ultimoTempo) { st.ultimoTempo = t; st.ultimoAvanco = Date.now(); }
        else if (Date.now() - st.ultimoAvanco > TRAVADO_MS) terminar("travou");
        return;
      }

      if (Date.now() >= st.proximoEm && cabe(10.04)) tocar();
    } catch (e) {
      console.error("mascote: erro (ignorado)", e);
    }
  }

  window.__mascote = { st, tocar, terminar, apresentar };
  setInterval(tick, 250);
  log("pronto (v25)");
})();
