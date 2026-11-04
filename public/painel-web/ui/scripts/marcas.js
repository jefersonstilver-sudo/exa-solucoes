// scripts/marcas.js — v34: faixa "Nesta tela" com o nome das marcas que estao no ar NESTE painel.
// Fonte: funcao exa2-marcas-tela (sistema EXA), cruzando os pedidos da playlist deste NUC com o cadastro.
// Sem internet usa a ultima lista guardada (ate 7 dias). Sem marcas, a faixa nao aparece e o layout fica como antes.
(function () {
  var FN = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-marcas-tela";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk";
  var CHAVE = "exa_marcas_v1";
  var VEL = 70; // px por segundo
  var ultima = "";

  function guardada(tela) {
    try {
      var g = JSON.parse(localStorage.getItem(CHAVE) || "null");
      if (g && g.tela === tela && Date.now() - g.t < 7 * 864e5 && Array.isArray(g.marcas)) return g.marcas;
    } catch (e) {}
    return null;
  }

  function desenhar(marcas) {
    var chave = JSON.stringify(marcas || []);
    if (chave === ultima) return;
    ultima = chave;
    var foot = document.querySelector("footer");
    if (!foot) return;
    if (!marcas || !marcas.length) { document.body.classList.remove("com-marcas"); return; }
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var itens = marcas.map(function (m) { return '<span class="marca-it">' + esc(m) + "</span>"; }).join("");
    // mantem o ticker antigo (escondido) para o watchdog do index.html continuar igual
    var antigo = document.getElementById("cotacao-lista");
    if (antigo && antigo.parentNode === foot) { antigo.style.display = "none"; }
    var caixa = document.getElementById("marcas-faixa");
    if (!caixa) {
      caixa = document.createElement("div");
      caixa.id = "marcas-faixa";
      caixa.style.cssText = "display:flex;align-items:center;width:100%;height:100%";
      caixa.innerHTML = '<div class="marcas-rotulo"><i></i>Nesta tela</div><div class="marcas-janela"><div class="marcas-trilho"></div></div>';
      foot.appendChild(caixa);
    }
    var trilho = caixa.querySelector(".marcas-trilho");
    document.body.classList.add("com-marcas");
    // repete ate encher 2x a largura (loop sem emenda), velocidade constante
    trilho.innerHTML = itens;
    var janela = caixa.querySelector(".marcas-janela").clientWidth || 800;
    var um = trilho.scrollWidth || 1, rep = 1;
    while (um * rep < janela && rep < 20) rep++;
    var bloco = new Array(rep + 1).join(itens);
    trilho.innerHTML = bloco + bloco;
    var meia = trilho.scrollWidth / 2;
    trilho.style.animationDuration = Math.max(12, meia / VEL).toFixed(1) + "s";
  }

  function atualizar() {
    fetch("/cache/updates.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var tela = String((d && d.cliente_id) || "").toLowerCase();
        if (!/^[0-9a-f]{4}$/.test(tela)) return;
        var pedidos = [];
        (d.PlaylistPronta || d.Propagandas || []).forEach(function (it) { if (it && it.id_pedido && pedidos.indexOf(String(it.id_pedido)) < 0) pedidos.push(String(it.id_pedido)); });
        var g = guardada(tela);
        if (g) desenhar(g);
        return fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON }, body: JSON.stringify({ tela: tela, pedidos: pedidos }) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j || !j.ok || !Array.isArray(j.marcas)) return;
            try { localStorage.setItem(CHAVE, JSON.stringify({ tela: tela, t: Date.now(), marcas: j.marcas })); } catch (e) {}
            desenhar(j.marcas);
          });
      })
      .catch(function (e) { console.warn("marcas: sem atualizar agora", e && e.message); });
  }

  try { atualizar(); setInterval(atualizar, 15 * 60 * 1000); } catch (e) { console.error("marcas.js", e); }
  window.__marcasLoaded = true;
})();
