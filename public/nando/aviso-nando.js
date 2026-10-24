/**
 * aviso-nando.js (v26) - desenha os avisos criados pelo Nando (modelo fixo, sem HTML livre).
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

  // fundo desfocado barato: desenha pequeno e amplia (sem filtro pesado no NUC)
  function desfocar(src, cb) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      try {
        var p = document.createElement("canvas"); p.width = 54; p.height = 96;
        var c = p.getContext("2d");
        var r = Math.max(54 / img.width, 96 / img.height);
        c.drawImage(img, (54 - img.width * r) / 2, (96 - img.height * r) / 2, img.width * r, img.height * r);
        var g = document.createElement("canvas"); g.width = 270; g.height = 480;
        var gc = g.getContext("2d"); gc.imageSmoothingEnabled = true; gc.imageSmoothingQuality = "high";
        gc.drawImage(p, 0, 0, 270, 480);
        cb(g.toDataURL("image/jpeg", 0.85));
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

    var topo = el("div", "na-topo na-entra");
    topo.appendChild(el("span", "na-selo", d.selo || "AVISO DO CONDOMÍNIO"));
    palco.appendChild(topo);

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
    caber(tt, foto ? 104 : 120, 60, foto ? 250 : 290);
    if (qd) caber(qd, 52, 34, 140);
    if (tx) caber(tx, 46, 30, foto ? 300 : 360);

    var fsrc = seguro(d.fundo) || foto;   // nunca usar o icone ampliado como fundo
    if (fsrc) desfocar(fsrc, function (u) {
      if (!u) return;
      fundo.style.backgroundImage = "url(" + u + ")";
      bg.style.backgroundImage = "url(" + u + ")";
    });

    requestAnimationFrame(function () { raiz.classList.add("na-on"); });
    return { raiz: raiz, escalar: escalar, remover: function () { if (raiz.parentNode) raiz.parentNode.removeChild(raiz); } };
  }

  window.NandoAviso = { montar: montar, W: W, H: H, versao: 1 };
})();
