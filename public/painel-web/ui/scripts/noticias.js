// Variáveis de controle globais
let intervaloNoticias = null;
let ultimoMinutoProcessado = -1;
let __primeiraNoticia = true;

function carregarNoticias() {
  console.log("🟡 Iniciando carregamento de notícias...");

  fetch("/cache/noticias.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const noticias = intercalarNoticias(data);

      if (noticias.length === 0) {
        console.warn("⚠️ Nenhuma notícia disponível após filtro.");
        return;
      }

      // Limpa o intervalo anterior se ele existir
      if (intervaloNoticias) {
        clearInterval(intervaloNoticias);
      }

      let i = 0;
      function exibir() {
        const noticia = noticias[i];
        atualizarNoticia(noticia);
        i = (i + 1) % noticias.length;
      }

      exibir();
      window.__noticiasLoaded = true;
      console.log("✅ Módulo de notícias carregado com sucesso.");

      intervaloNoticias = setInterval(exibir, 30000); // 30 segundos
    })
    .catch(err => {
      console.error("❌ Erro ao carregar notícias:", err);
    });

  setTimeout(() => {
    if (!window.__noticiasLoaded) {
      console.warn("⚠️ Notícias não carregaram no tempo esperado.");
    }
  }, 15000);
}

function intercalarNoticias(data) {
  const jp = data.jovempan || [];
  const pc = data.portal_cidade || [];

  const lista = [];
  const max = Math.max(jp.length, pc.length);
  for (let i = 0; i < max; i++) {
    if (jp[i]) lista.push(jp[i]);
    if (pc[i]) lista.push(pc[i]);
  }
  return lista;
}

// v11: escreve a manchete palavra por palavra (entrada fluida)
function escreverTitulo(el, titulo) {
  el.classList.remove('sai');
  el.innerHTML = '';
  titulo.split(/\s+/).forEach((palavra, k) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.style.animationDelay = (k * 45) + 'ms';
    s.textContent = palavra + ' ';
    el.appendChild(s);
  });
}

function atualizarNoticia(noticia) {
  const categoria = noticia.categoria || "Sem categoria";
  const titulo = noticia.titulo || "Sem título";
  const origem = noticia.origem || "";
  const qrCode = noticia.qr_code ? `../../${noticia.qr_code}` : "";

  try {
    const tituloEl = document.querySelector(".noticia-titulo");

    const aplicar = () => {
      document.querySelector(".noticia-categoria").innerText = categoria;
      escreverTitulo(tituloEl, titulo);

      const fonteTxt = document.querySelector(".noticia-fonte");
      if (fonteTxt) {
        fonteTxt.innerText = (origem === "jovempan" ? "Jovem Pan" : "Portal da Cidade");
      }

      const qr = document.querySelector(".noticia-qr img");
      qr.src = qrCode;
      qr.style.display = qrCode ? "block" : "none";
      if (qr.parentElement) qr.parentElement.style.display = qrCode ? "" : "none";

      const prog = document.querySelector(".noticia-prog");
      if (prog) {
        prog.classList.remove('corre');
        void prog.offsetWidth;
        prog.classList.add('corre');
      }
    };

    if (__primeiraNoticia) {
      __primeiraNoticia = false;
      aplicar();
    } else {
      // a manchete atual sai desfocando para cima e a nova entra
      tituloEl.classList.add('sai');
      setTimeout(aplicar, 450);
    }
  } catch (e) {
    console.error("❌ Erro ao atualizar DOM da notícia:", e);
  }
}

// Agendamento para não repetir no mesmo minuto
function agendarNoticias() {
  function checarHorario() {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();

    if ((h === 5 || h === 11 || h === 17) && m === 20 && ultimoMinutoProcessado !== m) {
      ultimoMinutoProcessado = m;
      console.log(`⏰ Hora de atualizar notícias (${h}:${m})!`);
      carregarNoticias();
    }

    if (m !== 20) {
      ultimoMinutoProcessado = -1;
    }
  }

  setInterval(checarHorario, 30000);
}

carregarNoticias();
agendarNoticias();
