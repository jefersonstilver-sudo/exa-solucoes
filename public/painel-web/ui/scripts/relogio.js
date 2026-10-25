// v11: dia da semana + data por extenso grande; hora grande com segundos pequenos
const __DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const __MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
let __ultimaData = '', __ultimaHora = '';

function atualizarRelogio() {
  const agora = new Date();
  const dataElem = document.getElementById('data-relogio');
  const horaElem = document.getElementById('hora-relogio');
  if (!dataElem || !horaElem) return;

  const dataHtml = `<span class="dsem">${__DIAS[agora.getDay()]}</span><span class="dt">${agora.getDate()} de ${__MESES[agora.getMonth()]}</span>`;
  if (dataHtml !== __ultimaData) { dataElem.innerHTML = dataHtml; __ultimaData = dataHtml; }

  const hh = String(agora.getHours()).padStart(2, '0');
  const mm = String(agora.getMinutes()).padStart(2, '0');
  const ss = String(agora.getSeconds()).padStart(2, '0');
  if (hh + mm !== __ultimaHora) {
    horaElem.innerHTML = `${hh}<span class="pt">:</span>${mm}<span class="seg"></span>`;
    __ultimaHora = hh + mm;
  }
  const seg = horaElem.querySelector('.seg');
  if (seg) seg.textContent = ss;
  const pt = horaElem.querySelector('.pt');
  if (pt) pt.classList.toggle('off', agora.getSeconds() % 2 === 1);

  if (!window.__relogioLoaded) {
    window.__relogioLoaded = true;
    console.log("✅ Relógio iniciado e funcional.");
  }
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);
