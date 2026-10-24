/**
 * aviso-nando.js (v32) - desenha os avisos criados pelo Nando (modelo fixo, sem HTML livre).
 * Usado pelo painel E pela pagina de previa, para os dois ficarem identicos.
 *
 * O aviso e um "palco" 1080x1920 que e escalado inteiro para caber na caixa:
 * nunca distorce, nunca corta texto. As sobras sao preenchidas com o fundo desfocado.
 *
 * Dados (arquivo .nando.json):
 * { v:1, titulo, quando, texto, assinatura, cor, icone (dataURL/URL), fundo (dataURL/URL),
 *   foto (dataURL/URL, opcional: foto enviada pelo sindico, aparece nitida em destaque),
 *   selo (texto do selo no topo, padrao "AVISO DO CONDOMINIO"),
 *   itens [{icone, texto}] (v30: lista de regras com icone, ate 6), parte ("1/3", cartao de uma serie),
 *   qr (dataURL do QR code do documento completo), qr_legenda }
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
    return /^(data:image\/(png|jpe?g|webp|svg\+xml);base64,|https:\/\/|\.\.?\/|\/)/i.test(u) ? u : "";
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
    // tambem nao deixa palavra longa passar da largura (nunca quebra no meio da palavra)
    while (t > minPx && (no.scrollHeight > alturaMax || no.scrollWidth > no.clientWidth + 1)) { t -= 4; no.style.fontSize = t + "px"; }
    if (no.scrollWidth > no.clientWidth + 1) no.style.overflowWrap = "anywhere";
  }

  function montar(caixa, d) {
    d = d || {};
    var itens = Array.isArray(d.itens) ? d.itens.slice(0, 6) : [];
    var qr = seguro(d.qr);
    var raiz = el("div", "na-raiz" + (itens.length ? " na-com-itens" : "") + (qr ? " na-com-qr" : ""));
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
    if (d.parte) palco.appendChild(el("div", "na-parte na-entra", String(d.parte).slice(0, 7)));

    var bloco = el("div", "na-bloco");
    var tt = el("div", "na-titulo na-entra", d.titulo || "");
    bloco.appendChild(tt);
    var qd = null, tx = null;
    if (d.quando) { qd = el("div", "na-quando na-entra", d.quando); bloco.appendChild(qd); }
    if (d.texto) { tx = el("div", "na-texto na-entra", d.texto); bloco.appendChild(tx); }
    var lista = null;
    if (itens.length) {
      lista = el("div", "na-itens na-entra");
      itens.forEach(function (it) {
        var li = el("div", "na-item");
        var ii = seguro(it && it.icone);
        if (ii) { var im = el("img", "na-item-ic"); im.src = ii; im.alt = ""; li.appendChild(im); }
        li.appendChild(el("div", "na-item-tx", (it && it.texto) || ""));
        lista.appendChild(li);
      });
      bloco.appendChild(lista);
    }
    palco.appendChild(bloco);

    if (qr) {
      var cq = el("div", "na-qr na-entra");
      var qi = el("div", "na-qr-img"); var qimg = el("img"); qimg.src = qr; qimg.alt = "QR code"; qi.appendChild(qimg);
      cq.appendChild(qi);
      cq.appendChild(el("div", "na-qr-tx", d.qr_legenda || "Aponte a câmera e veja o documento completo"));
      palco.appendChild(cq);
    }

    if (d.credito) palco.appendChild(el("div", "na-credito", String(d.credito).slice(0, 60)));
    palco.appendChild(el("div", "na-assina na-entra", d.assinatura || "Administração do Condomínio"));
    raiz.appendChild(palco);

    caixa.appendChild(raiz);

    // escala o palco inteiro para caber (sem distorcer). Nunca desenha em tamanho real:
    // se a caixa ainda nao tem tamanho, esconde e tenta de novo ate ter.
    var tentativas = 0, vigia = null;
    function escalar() {
      var w = caixa.clientWidth, h = caixa.clientHeight;
      if (!(w > 20 && h > 20)) {
        palco.style.visibility = "hidden";
        if (tentativas++ < 120) setTimeout(escalar, 50);
        return;
      }
      var s = Math.min(w / W, h / H);
      palco.style.transform = "translate(" + ((w - W * s) / 2) + "px," + ((h - H * s) / 2) + "px) scale(" + s + ")";
      palco.style.visibility = "";
    }
    escalar();
    if (window.ResizeObserver) { try { vigia = new ResizeObserver(function () { escalar(); }); vigia.observe(caixa); } catch (e) { vigia = null; } }

    // texto: cabe sempre (titulo 2 linhas, texto ate a area disponivel)
    // letras grandes: o quadro e lido de longe no elevador (tela de 27")
    caber(tt, itens.length ? 110 : 150, itens.length ? 64 : 84, itens.length ? 230 : (foto ? 300 : 340));
    if (qd) { // data/horario numa linha so, se couber
      qd.style.whiteSpace = "nowrap"; var tq = 58; qd.style.fontSize = tq + "px";
      while (tq > 44 && qd.scrollWidth > qd.clientWidth + 1) { tq -= 2; qd.style.fontSize = tq + "px"; }
      if (qd.scrollWidth > qd.clientWidth + 1) { qd.style.whiteSpace = "normal"; caber(qd, 60, 44, 170); }
    }
    if (tx) caber(tx, itens.length ? 50 : 64, itens.length ? 36 : 42, itens.length ? 160 : (foto ? 300 : 420));
    if (lista) { // itens: letra o maior possivel sem passar da area do bloco
      var fi = 54;
      var aplicar = function () {
        lista.style.fontSize = fi + "px";
        lista.style.setProperty("--na-ic", Math.round(fi * 2.1) + "px");
      };
      aplicar();
      while (fi > 26 && bloco.scrollHeight > bloco.clientHeight + 2) { fi -= 2; aplicar(); }
      // ultimo recurso: nunca deixa a lista invadir o QR code nem a assinatura
      if (bloco.scrollHeight > bloco.clientHeight + 2) bloco.style.overflow = "hidden";
    }

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
    return { raiz: raiz, escalar: escalar, remover: function () { if (vigia) { try { vigia.disconnect(); } catch (e) {} } if (raiz.parentNode) raiz.parentNode.removeChild(raiz); } };
  }

  window.NandoAviso = { montar: montar, W: W, H: H, versao: 32 };
})();
