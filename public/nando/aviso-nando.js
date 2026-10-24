/**
 * aviso-nando.js (v28) - desenha os avisos criados pelo Nando (modelo fixo, sem HTML livre).
 * Usado pelo painel E pela pagina de previa, para os dois ficarem identicos.
 *
 * O aviso e um "palco" 1080x1920 que e escalado inteiro para caber na caixa:
 * nunca distorce, nunca corta texto. As sobras sao preenchidas com o fundo desfocado.
 *
 * Dados (arquivo .nando.json):
 * { v:1, titulo, quando, texto, assinatura, cor, icone (dataURL/URL), fundo (dataURL/URL),
 *   foto (dataURL/URL, opcional: foto enviada pelo sindico, aparece nitida em destaque),
 *   selo (texto do selo no topo, padrao "AVISO DO CONDOMINIO") }
 * Somente texto e imagens: nada de codigo vindo de fora.
 */
(function () {
  if (window.NandoAviso) return;

  var W = 1080, H = 1920;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = String(txt);
    return e;
  }
  function seguro(u) {
    u = String(u || "");
    return /^(data:image\/(png|jpe?g|webp);base64,|https:\/\/|\.\.?\/|\/)/i.test(u) ? u : "";
  }
  function cor(c) {
    return /^#[0-9a-f]{6}$/i.test(String(c || "")) ? c : "#7c3aed";
  }

  // fundo desfocado em boa qualidade: blur real no canvas (uma vez so), sem pixelar
  function desfocar(src, cb) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      try {
        var w = 540, h = 960, g = document.createElement("canvas"); g.width = w; g.height = h;
        var c = g.getContext("2d");
        var r = Math.max(w / img.width, h / img.height) * 1.08;   // um pouco maior: o desfoque nao mostra borda
        var dw = img.width * r, dh = img.height * r;
        if ("filter" in c) { c.filter = "blur(12px)"; c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh); }
        else {   // navegador antigo: reduz e amplia com suavizacao
          var p = document.createElement("canvas"); p.width = 135; p.height = 240;
          var pc = p.getContext("2d"); var rp = Math.max(135 / img.width, 240 / img.height);
          pc.drawImage(img, (135 - img.width * rp) / 2, (240 - img.height * rp) / 2, img.width * rp, img.height * rp);
          c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.drawImage(p, 0, 0, w, h);
        }
        cb(g.toDataURL("image/jpeg", 0.9));
      } catch (e) { cb(src); }
    };
    img.onerror = function () { cb(""); };
    img.src = src;
  }

  // reduz a fonte ate o texto caber na altura maxima
  function caber(no, maxPx, minPx, alturaMax) {
    var t = maxPx;
    no.style.fontSize = t + "px";
    while (t > minPx && no.scrollHeight > alturaMax) { t -= 4; no.style.fontSize = t + "px"; }
  }

  function montar(caixa, d) {
    d = d || {};
    var raiz = el("div", "na-raiz");
    raiz.style.setProperty("--na-cor", cor(d.cor));

    var bg = el("div", "na-bg");
    raiz.appendChild(bg);

    var palco = el("div", "na-palco");
    var fundo = el("div", "na-fundo");
    var veu = el("div", "na-veu");
    palco.appendChild(fundo); palco.appendChild(veu);

    // o titulo "Avisos do <predio>" ja aparece no painel: so mostra selo se vier no aviso
    if (d.selo) {
      var topo = el("div", "na-topo na-entra");
      topo.appendChild(el("span", "na-selo", d.selo));
      palco.appendChild(topo);
    }

    var foto = seguro(d.foto), icone = seguro(d.icone);
    var midia = el("div", "na-midia na-entra" + (foto ? " com-foto" : ""));
    midia.appendChild(el("div", "na-brilho"));
    if (foto) {
      var f = el("img", "na-foto"); f.src = foto; f.alt = "";
      midia.appendChild(f);
      if (icone) { var bi = el("img", "na-icone-mini na-flutua"); bi.src = icone; bi.alt = ""; midia.appendChild(bi); }
    } else if (icone) {
      var ic = el("img", "na-icone na-flutua"); ic.src = icone; ic.alt = "";
      midia.appendChild(ic);
    }
    palco.appendChild(midia);

    var bloco = el("div", "na-bloco");
    var tt = el("div", "na-titulo na-entra", d.titulo || "");
    bloco.appendChild(tt);
    var qd = null, tx = null;
    if (d.quando) { qd = el("div", "na-quando na-entra", d.quando); bloco.appendChild(qd); }
    if (d.texto) { tx = el("div", "na-texto na-entra", d.texto); bloco.appendChild(tx); }
    palco.appendChild(bloco);

    if (d.credito) palco.appendChild(el("div", "na-credito", String(d.credito).slice(0, 60)));
    palco.appendChild(el("div", "na-assina na-entra", d.assinatura || "Administração do Condomínio"));
    raiz.appendChild(palco);

    caixa.appendChild(raiz);

    // escala o palco inteiro para caber (sem distorcer)
    function escalar() {
      var w = caixa.clientWidth || W, h = caixa.clientHeight || H;
      var s = Math.min(w / W, h / H);
      palco.style.transform = "translate(" + ((w - W * s) / 2) + "px," + ((h - H * s) / 2) + "px) scale(" + s + ")";
    }
    escalar();

    // texto: cabe sempre (titulo 2 linhas, texto ate a area disponivel)
    // letras grandes: o quadro e lido de longe no elevador (tela de 27")
    caber(tt, 150, 84, foto ? 300 : 340);
    if (qd) { // data/horario numa linha so, se couber
      qd.style.whiteSpace = "nowrap"; var tq = 66; qd.style.fontSize = tq + "px";
      while (tq > 44 && qd.scrollWidth > qd.clientWidth + 1) { tq -= 2; qd.style.fontSize = tq + "px"; }
      if (qd.scrollWidth > qd.clientWidth + 1) { qd.style.whiteSpace = "normal"; caber(qd, 60, 44, 170); }
    }
    if (tx) caber(tx, 64, 42, foto ? 300 : 420);

    var fsrc = seguro(d.fundo) || foto;   // nunca usar o icone ampliado como fundo
    if (fsrc && d.fundo_nitido && seguro(d.fundo)) {   // wallpaper: nitido, sem desfoque
      raiz.classList.add("na-nitido");
      fundo.style.backgroundImage = "url(" + seguro(d.fundo) + ")";
      bg.style.backgroundImage = "url(" + seguro(d.fundo) + ")";
    } else if (fsrc) desfocar(fsrc, function (u) {
      if (!u) return;
      fundo.style.backgroundImage = "url(" + u + ")";
      bg.style.backgroundImage = "url(" + u + ")";
    });

    requestAnimationFrame(function () { raiz.classList.add("na-on"); });
    return { raiz: raiz, escalar: escalar, remover: function () { if (raiz.parentNode) raiz.parentNode.removeChild(raiz); } };
  }

  window.NandoAviso = { montar: montar, W: W, H: H, versao: 1 };
})();
