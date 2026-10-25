/**
 * Widget Clima - EXA (v11)
 * Agora: API da EXA (/api/clima). Proximos 3 dias: Open-Meteo (gratis, sem chave);
 * se o Open-Meteo falhar, usa os 2 dias que vem da API da EXA.
 * Cena animada so com CSS (sol, nuvens, chuva, lua).
 */

const CLIMA_API_BASE = "http://18.228.252.149:8000";
const CLIMA_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hora
const CLIMA_OPEN_METEO = "https://api.open-meteo.com/v1/forecast?latitude=-25.5163&longitude=-54.5854" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&timezone=America%2FSao_Paulo&forecast_days=4";
const CLIMA_DIAS_SEM = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CLIMA_SVG = {
  sol: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3"/></g></svg>',
  parcial: '<svg viewBox="0 0 32 32"><circle cx="13" cy="12" r="6" fill="#ffd23f"/><path d="M9 25h15a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0-2 8z" fill="#fff"/></svg>',
  nublado: '<svg viewBox="0 0 32 32"><path d="M7 24h17a6 6 0 0 0 0-12 8 8 0 0 0-15 2 5 5 0 0 0-2 10z" fill="#e6edf7"/></svg>',
  chuva: '<svg viewBox="0 0 32 32"><path d="M8 20h16a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0-3 8z" fill="#e6edf7"/><path d="M11 23l-2 5M17 23l-2 5M23 23l-2 5" stroke="#8fd0ff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  trovoada: '<svg viewBox="0 0 32 32"><path d="M8 19h16a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0-3 8z" fill="#c9d3e3"/><path d="M17 20l-4 6h4l-2 5 6-8h-4l2-3z" fill="#ffd23f"/></svg>',
  neblina: '<svg viewBox="0 0 32 32"><path d="M5 12h22M3 17h26M6 22h20" stroke="#e6edf7" stroke-width="2.6" stroke-linecap="round"/></svg>'
};

function climaIconeCodigo(c) {
  if (c === 0) return "sol";
  if (c === 1 || c === 2) return "parcial";
  if (c === 3) return "nublado";
  if (c === 45 || c === 48) return "neblina";
  if (c >= 95) return "trovoada";
  if (c >= 51) return "chuva";
  return "parcial";
}

function climaTemaAgora(agora) {
  const cond = (agora.condicao || "").toLowerCase();
  const noite = (agora.icone || "").includes("/night/");
  const chuva = /chuv|garoa|trovo|tempest|aguaceiro|chuvisco/.test(cond);
  const fechado = /nublado|encoberto|neblina|nevoeiro|névoa|nevoa/.test(cond) && !/parcial/.test(cond);
  const parcial = /parcial|nuvens/.test(cond);
  if (chuva) return { ceu: noite ? "noite" : "chuva", cena: "chuva" };
  if (noite) return { ceu: "noite", cena: fechado ? "noite-nublada" : "noite" };
  if (fechado) return { ceu: "nublado", cena: "nublado" };
  return { ceu: "sol", cena: parcial ? "parcial" : "sol" };
}

function climaCenaHtml(cena) {
  const sol = '<div class="c-raios"></div><div class="c-sol"></div>';
  const nuvens = '<div class="c-nuvem n2"></div><div class="c-nuvem n1"></div>';
  const gotas = '<i class="c-gota g1"></i><i class="c-gota g2"></i><i class="c-gota g3"></i><i class="c-gota g4"></i><i class="c-gota g5"></i><i class="c-gota g6"></i>';
  const estrelas = '<i class="c-estrela e1"></i><i class="c-estrela e2"></i><i class="c-estrela e3"></i><i class="c-estrela e4"></i>';
  switch (cena) {
    case "sol": return sol;
    case "parcial": return sol + '<div class="c-nuvem n1"></div>';
    case "nublado": return nuvens;
    case "chuva": return '<div class="escura">' + nuvens + gotas + '</div>';
    case "noite": return estrelas + '<div class="c-lua"></div>';
    case "noite-nublada": return estrelas + '<div class="c-lua"></div><div class="c-nuvem n1"></div>';
    default: return sol;
  }
}

class ClimaWidget {
  constructor() {
    this.container = document.getElementById("widget-clima");
    this.data = null;
    this.dias = null;
    if (this.container) this.init();
  }

  async init() {
    this.container.innerHTML = '<div class="clima-msg">Carregando clima...</div>';
    await this.fetchData();
    setInterval(() => this.fetchData(), CLIMA_UPDATE_INTERVAL);
  }

  async fetchDias() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(CLIMA_OPEN_METEO, { cache: "no-store", signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = (await r.json()).daily;
      const dias = [];
      for (let i = 1; i <= 3 && i < d.time.length; i++) {
        dias.push({
          data: d.time[i],
          max: Math.round(d.temperature_2m_max[i]),
          min: Math.round(d.temperature_2m_min[i]),
          chuva: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null,
          icone: CLIMA_SVG[climaIconeCodigo(d.weather_code[i])]
        });
      }
      if (dias.length) this.dias = dias;
    } catch (e) {
      console.warn("⚠️ Widget Clima: previsão de 3 dias indisponível (usando a da API).", e);
    }
  }

  async fetchData() {
    await this.fetchDias();
    try {
      const response = await fetch(`${CLIMA_API_BASE}/api/clima`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = await response.json();
      if (typeof data === "string") data = JSON.parse(data);
      this.data = data;
      this.render();
    } catch (error) {
      console.warn("⚠️ Widget Clima: Falha ao buscar dados.", error);
      if (!this.data) this.renderErro();
    }
  }

  diasHtml() {
    let dias = this.dias;
    if (!dias) {
      dias = (this.data.previsao || []).slice(0, 3).map(dia => ({
        data: dia.data, max: dia.max, min: dia.min, chuva: null,
        icone: `<img src="${(dia.icone || "").startsWith("//") ? "https:" + dia.icone : dia.icone}" alt="">`
      }));
    }
    const html = dias.map(dia => {
      const dt = new Date(dia.data + "T12:00:00");
      const nome = CLIMA_DIAS_SEM[dt.getDay()];
      const ch = dia.chuva === null || dia.chuva === undefined ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}` : `${dia.chuva}%`;
      return `<div class="clima-dia"><div class="l"><span class="d">${nome}</span><span class="ch">${ch}</span></div>${dia.icone}<span class="mm"><span class="mx">${dia.max}°</span><span class="mn">${dia.min}°</span></span></div>`;
    }).join("");
    return { html, n: dias.length };
  }

  render() {
    if (!this.data || !this.data.agora) { this.renderErro(); return; }
    const agora = this.data.agora;
    const tema = climaTemaAgora(agora);
    const dias = this.diasHtml();
    this.container.innerHTML = `
      <div class="clima-ceu ${tema.ceu}"></div>
      <div class="clima-cena">${climaCenaHtml(tema.cena)}</div>
      <div class="clima-tit">Foz do Iguaçu · agora</div>
      <div class="clima-linha"><div class="clima-temp">${Math.round(agora.temp)}<sup>°C</sup></div><div class="clima-cond">${agora.condicao || ""}</div></div>
      <div class="clima-meta"><span>Chuva <b>${agora.chuva}%</b></span><span>Vento <b>${agora.vento} km/h</b></span><span>Umid. <b>${agora.umidade}%</b></span></div>
      <div class="clima-dias ${dias.n === 2 ? "d2" : ""}">${dias.html}</div>`;
  }

  renderErro() {
    this.container.innerHTML = '<div class="clima-ceu nublado"></div><div class="clima-msg">Clima indisponível no momento</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.climaWidget = new ClimaWidget();
  window.__climaLoaded = true;
});
