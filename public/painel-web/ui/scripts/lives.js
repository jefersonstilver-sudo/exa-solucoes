/**
 * Cameras ao vivo (v13) - feito para NUC fraco
 * - UM player so (nada de 2 videos 1080p decodificando ao mesmo tempo).
 * - Um "quadro congelado" (canvas) fica sempre atras do video com a ultima imagem boa:
 *   na troca de camera, travada de rede ou falha de decodificacao, a tela mostra a
 *   ultima imagem em vez de sumir.
 * - O video fica com opacidade 0.99 (evita o modo "overlay" da placa de video, que em
 *   alguns PCs Linux faz o video ficar invisivel depois do primeiro quadro).
 * - Vigia: se o video parar de andar por 8 s, recarrega/troca de camera.
 * - Linha de diagnostico discreta no canto (temporaria, para o teste).
 */
(() => {
  if (window.LivePlayer) {
    window.LivePlayer.reload();
    return;
  }

  const HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: false,
    capLevelToPlayerSize: true,
    maxBufferLength: 10,
    backBufferLength: 0,
    liveSyncDurationCount: 3,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 2,
    manifestLoadingRetryDelay: 1500,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 2,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 3,
    fragLoadingRetryDelay: 1500,
  };
  const TEMPO_MAX_CARREGAR = 25000;
  const TEMPO_MIN_NO_AR = 15000;
  const PARADO_MAX = 8000;
  const RECARREGAR_LISTA = 10 * 60 * 1000;

  const st = {
    lives: [], idx: -1, hls: null, video: null, canvas: null, ctx: null,
    timer: null, carregando: false, ultimoTempo: -1, ultimoAvanco: 0, falhasSeguidas: 0, off: {},
  };

  // ---------- diagnostico (temporario) ----------
  const diag = (txt) => {
    const el = document.querySelector(".camera-diag");
    if (el) el.textContent = txt;
    console.log("📷 " + txt);
  };

  const FORA_DO_AR_MS = 2 * 60 * 1000;   // camera que falhou fica fora da roda por 2 min
  const estaFora = (k) => st.off[k] && (Date.now() - st.off[k] < FORA_DO_AR_MS);

  // bolinhas: uma por camera (branca = no ar agora, vazada vermelha = sem sinal)
  const indicador = () => {
    const el = document.querySelector(".camera-dots");
    if (!el) return;
    const n = st.lives.length;
    let fora = 0, html = "";
    for (let k = 0; k < n; k++) {
      const off = estaFora(k);
      if (off) fora++;
      html += `<i class="${k === st.idx && !off ? "atual" : ""} ${off ? "off" : ""}"></i>`;
    }
    if (fora) html += `<span>${n - fora} de ${n} câmeras</span>`;
    el.innerHTML = n > 1 ? html : "";
  };

  const barra = (ms) => {
    const p = document.querySelector(".camera-prog");
    if (!p) return;
    p.classList.remove("corre");
    p.style.transitionDuration = "0ms";
    void p.offsetWidth;
    if (ms > 0) {
      p.style.transitionDuration = ms + "ms";
      p.classList.add("corre");
    }
  };

  const espera = (txt) => {
    const t = document.querySelector(".camera-espera-txt");
    if (t) t.textContent = txt;
  };

  const rotulo = (live) => {
    if (live.local || live.nome) return String(live.local || live.nome).toUpperCase();
    const u = String(live.url || "").toLowerCase();
    if (u.includes("aduana")) return "ADUANA · PONTE DA AMIZADE";
    if (u.includes("sentidobrasil")) return "PONTE · SENTIDO BRASIL";
    if (u.includes("sentidoparaguai")) return "PONTE · SENTIDO PARAGUAI";
    return "PONTE DA AMIZADE · BR-277";
  };

  const preparar = () => {
    if (st.video) return true;
    st.video = document.getElementById("live-video");
    if (!st.video) { console.error("❌ #live-video não encontrado."); return false; }
    st.video.muted = true;
    st.video.playsInline = true;
    // canvas com a ultima imagem boa, logo abaixo do video
    st.canvas = document.createElement("canvas");
    st.canvas.className = "camera-congelada";
    st.canvas.width = 640;
    st.canvas.height = 360;
    st.video.before(st.canvas);
    st.ctx = st.canvas.getContext("2d");
    // guarda um quadro por segundo enquanto o video anda
    setInterval(guardarQuadro, 1000);
    setInterval(vigiar, 2000);
    return true;
  };

  const guardarQuadro = () => {
    const v = st.video;
    if (!v || v.readyState < 2 || v.videoWidth === 0 || v.paused) return;
    try {
      st.ctx.drawImage(v, 0, 0, st.canvas.width, st.canvas.height);
      st.canvas.classList.add("on");
    } catch (_) {}
  };

  const vigiar = () => {
    const v = st.video;
    if (!v || st.carregando || !st.hls) return;
    if (v.currentTime !== st.ultimoTempo) {
      st.ultimoTempo = v.currentTime;
      st.ultimoAvanco = Date.now();
      return;
    }
    if (Date.now() - st.ultimoAvanco > PARADO_MAX) {
      diag("parado " + Math.round((Date.now() - st.ultimoAvanco) / 1000) + "s rs" + v.readyState + " → próxima");
      st.ultimoAvanco = Date.now();
      agendar(0);
    }
  };

  const desligar = () => {
    try { if (st.hls) st.hls.destroy(); } catch (_) {}
    st.hls = null;
    if (st.video) {
      st.video.classList.remove("on");
      try { st.video.pause(); st.video.removeAttribute("src"); st.video.load(); } catch (_) {}
    }
  };

  const agendar = (ms) => {
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(() => tentar(st.idx + 1, 0), ms);
  };

  const tocar = (index, ok, falhou) => {
    guardarQuadro();          // congela a imagem atual antes de trocar
    const wrapT = document.querySelector(".camera-video-wrapper");
    if (wrapT) wrapT.classList.add("trocando");
    desligar();
    const live = st.lives[index];
    if (typeof Hls === "undefined" || !Hls.isSupported()) { falhou("sem hls.js"); return; }
    st.carregando = true;
    let fim = false;
    const v = st.video;
    const terminar = (sucesso, motivo) => {
      if (fim) return;
      fim = true;
      clearTimeout(limite);
      v.removeEventListener("playing", aoTocar);
      st.carregando = false;
      if (sucesso) ok(); else { desligar(); falhou(motivo); }
    };
    const aoTocar = () => terminar(true);
    const limite = setTimeout(() => terminar(false, "demorou"), TEMPO_MAX_CARREGAR);

    const hls = new Hls(HLS_CONFIG);
    st.hls = hls;
    v.addEventListener("playing", aoTocar);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { v.play().catch(() => {}); });
    hls.on(Hls.Events.ERROR, (ev, data) => {
      if (hls !== st.hls) return;
      if (!data.fatal) {
        if (data.details !== "bufferStalledError") diag("aviso " + data.details);
        return;
      }
      diag("ERRO " + data.type + " " + data.details);
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !st._recuperou) {
        st._recuperou = true;
        try { hls.recoverMediaError(); return; } catch (_) {}
      }
      if (!fim) { terminar(false, data.details); return; }
      agendar(0);
    });
    st._recuperou = false;
    hls.loadSource(live.url);
    hls.attachMedia(v);
  };

  const noAr = (index) => {
    const live = st.lives[index];
    st.idx = index;
    st.falhasSeguidas = 0;
    st.ultimoTempo = -1;
    st.ultimoAvanco = Date.now();
    // v18: entrada suave (so opacidade + escala: leve para o NUC)
    const wrapN = document.querySelector(".camera-video-wrapper");
    if (wrapN) wrapN.classList.remove("trocando");
    st.video.classList.remove("entra");
    void st.video.offsetWidth;
    st.video.classList.add("on", "entra");
    const locEl = document.querySelector(".camera-location-full");
    if (locEl) {
      locEl.innerText = rotulo(live);
      locEl.classList.remove("novo");
      void locEl.offsetWidth;
      locEl.classList.add("novo");
    }
    delete st.off[index];
    indicador();
    window.__livesLoaded = true;
    diag("ok " + (index + 1) + "/" + st.lives.length + " " + st.video.videoWidth + "x" + st.video.videoHeight);
    const tempo = Math.max((Number.parseInt(live.timing, 10) || 30) * 1000, TEMPO_MIN_NO_AR);
    barra(tempo);
    agendar(tempo);
  };

  const tentar = (i, tentativas) => {
    const n = st.lives.length;
    if (!n) { agendar(60000); return; }
    if (tentativas >= n) {
      diag("nenhuma câmera respondeu; nova tentativa em 30s");
      st.canvas.classList.remove("on");
      espera("Câmeras da ponte indisponíveis no momento");
      barra(0);
      indicador();
      st.timer = setTimeout(() => tentar(st.idx + 1, 0), 30000);
      return;
    }
    // pula as cameras que falharam ha pouco (se todas falharam, tenta todas de novo)
    let k = ((i % n) + n) % n;
    let pulos = 0;
    while (estaFora(k) && pulos < n) { k = (k + 1) % n; pulos++; }
    if (pulos >= n) k = ((i % n) + n) % n;
    barra(0);
    tocar(k, () => noAr(k), (motivo) => {
      diag("falhou " + (k + 1) + ": " + motivo);
      st.off[k] = Date.now();
      indicador();
      tentar(k + 1, tentativas + 1);
    });
  };


  // v17 teste Foz: cameras extras do Portal da Cidade (Argentina e Ponte da Integracao), somadas a lista do servidor
  const EXTRAS = [
    { url: "https://video02.logicahost.com.br/portaldacidade/fozpontetancredoneves.stream/playlist.m3u8", timing: 14, nome: "Ponte Tancredo Neves · Argentina" },
    { url: "https://video02.logicahost.com.br/portaldacidade/fozpontedaintegracao.stream/playlist.m3u8", timing: 14, nome: "Ponte da Integração · Paraguai" },
  ];
  const NOMES = { fozsentidopontedaamizade01: "BR-277 · Sentido Ponte da Amizade", fozaduanapontedaamizade: "BR-277 · Aduana da Ponte", fozpontedaamizadesentidoparaguai: "Ponte da Amizade · Sentido Paraguai", fozpontedaamizadesentidobrasil: "Ponte da Amizade · Sentido Brasil" };
  const comExtras = (lista) => {
    const tem = new Set(lista.map((x) => String(x.url)));
    return lista.concat(EXTRAS.filter((e) => !tem.has(e.url))).map((x) => {
      if (x.nome || x.local) return x;
      const m = String(x.url).match(/\/([a-z0-9]+)\.stream\//i);
      return m && NOMES[m[1]] ? { ...x, nome: NOMES[m[1]] } : x;
    });
  };
  const buscarLista = async () => {
    for (const url of ["/cache/live.json", "/cache/lives.json"]) {
      try {
        const r = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) continue;
        const data = await r.json();
        const lista = Array.isArray(data) ? data : (data && data.lives);
        if (Array.isArray(lista)) return comExtras(lista.filter(x => x && x.url));
      } catch (e) {
        console.warn("⚠️ Erro ao ler", url, e);
      }
    }
    return null;
  };

  const carregarLives = async () => {
    const lista = await buscarLista();
    if (!lista || !lista.length) {
      diag("sem lista de câmeras");
      setTimeout(carregarLives, 60000);
      return;
    }
    const primeiraVez = !st.lives.length;
    st.lives = lista;
    if (st.idx >= lista.length) st.idx = -1;
    if (primeiraVez) {
      if (!preparar()) return;
      tentar(0, 0);
    }
  };

  const api = {
    start: () => { carregarLives(); setInterval(carregarLives, RECARREGAR_LISTA); },
    reload: () => carregarLives(),
    next: () => agendar(0),
    _state: st,
  };
  window.LivePlayer = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", api.start);
  } else {
    api.start();
  }
})();
