// v11: titulo dos avisos em 2 linhas ("AVISOS DO" + nome do predio, centralizado e grande)
function ajustarNomeAviso(el) {
  // reduz a fonte ate o nome caber na largura do cartao (nomes longos)
  let tam = 32;
  el.style.fontSize = tam + 'px';
  while (el.scrollWidth > el.clientWidth && tam > 18) {
    tam -= 1;
    el.style.fontSize = tam + 'px';
  }
}

fetch('/cache/updates.json')
  .then(response => response.json())
  .then(data => {
    let screenName = data.ScreenName || "Sem Nome";

    // Formata o nome (ex: ResidencialMiró -> Residencial Miró)
    screenName = screenName.replace(/([a-z])([A-Z])/g, '$1 $2');

    const avisosTitulo = document.getElementById('avisos-titulo');
    if (avisosTitulo) {
      const nomeEl = avisosTitulo.querySelector('.aviso-nome');
      if (nomeEl) {
        nomeEl.textContent = screenName;
        ajustarNomeAviso(nomeEl);
      } else {
        avisosTitulo.textContent = `Avisos: ${screenName}`;
      }
    }

    const nomeTela = document.querySelector('.NomeTela');
    if (nomeTela) {
      nomeTela.textContent = screenName;
    }

    console.log("✅ Dados de tela carregados:", screenName);
    window.__nomeTelaLoaded = true;
  })
  .catch(error => {
    console.error("Erro ao carregar updates.json:", error);
    const nomeEl = document.querySelector('#avisos-titulo .aviso-nome');
    if (nomeEl) nomeEl.textContent = "Condomínio";
  });
