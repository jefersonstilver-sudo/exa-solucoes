function atualizarCotacao() {
  fetch('/cache/cotacao.json')
    .then(response => response.json())
    .then(data => {
      const wrapper = document.getElementById('cotacao-lista');
      let c = data?.cotacao;

      if (typeof c === "string") {
        try {
          c = JSON.parse(c);
        } catch (e) {
          console.error("Erro ao fazer JSON.parse no campo cotacao:", e);
          wrapper.innerHTML = "<span>Erro ao carregar cotações.</span>";
          return;
        }
      }

      console.log("🧾 Cotação final interpretada:", c);

      // Mapeia os dados para o novo formato HTML
      const items = Object.values(c.awesomeapi || {}).map(m => {
        const variacao = parseFloat(m.variacao || "0");
        const isUp = variacao >= 0;
        const icon = isUp ? "▲" : "▼";
        const cssClass = isUp ? "ticker-up" : "ticker-down";
        const sign = isUp ? "+" : "";
        
        // Simplifica o nome (ex: "Dólar Americano/Real Brasileiro" -> "USD/BRL")
        // No cache costuma vir como USD ou USDBRL
        const label = m.code ? `${m.code}/${m.codein}` : m.nome.split('/')[0];

        return `
          <span class="ticker-item">
            <span class="ticker-label">${label}</span>
            <span class="ticker-value">R$ ${m.compra}</span>
            <span class="ticker-change ${cssClass}">${icon} ${sign}${m.variacao}%</span>
          </span>
        `;
      });

      // Se houver dados de ações/índices (ex: Ibovespa)
      if (c.hgbrasil) {
        // Exemplo de como tratar HGBrasil se existir no seu JSON
      }

      const htmlContent = items.join("");
      // Repetimos o conteúdo várias vezes (ex: 4x) para garantir que o ticker 
      // esteja sempre cheio e o loop seja imperceptível.
      wrapper.innerHTML = htmlContent.repeat(4);
    })
    .catch(err => {
      console.error("❌ Erro ao carregar cotações:", err);
      const wrapper = document.getElementById('cotacao-lista');
      if (wrapper) wrapper.innerHTML = "<span>Cotações não disponíveis no momento.</span>";
    });
}

// 🚀 agenda para rodar às 05:20, 11:20 e 17:20
function agendarAtualizacoes() {
  function checarHorario() {
    const agora = new Date();
    const h = agora.getHours();
    const m = agora.getMinutes();

    if ((h === 5 || h === 11 || h === 17) && m === 20) {
      atualizarCotacao();
    }
  }

  setInterval(checarHorario, 60000);
}

atualizarCotacao();
agendarAtualizacoes();
window.__cotacaoLoaded = true;
