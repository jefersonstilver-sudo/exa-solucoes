/**
 * Widget Clima - EXA (v12, 07/11/2026)
 * Agora: Open-Meteo (modelo de alta resolucao, a cada 10 min) olhando tambem a PROXIMA hora —
 * a API da EXA (WeatherAPI, 1x por hora) dizia "chuva passageira fraca" no meio de tempestade em Foz.
 * A API da EXA fica so de reserva. Proximos 3 dias: Open-Meteo.
 * ALERTA: avisos ativos do INMET (os mesmos que a Defesa Civil repassa) para Foz do Iguacu (IBGE 4108304):
 * no lugar dos 3 dias aparece o alerta com a cor oficial, o risco e o telefone 199 da Defesa Civil.
 * Cena animada so com CSS (sol, nuvens, chuva, lua).
 */

const CLIMA_API_BASE = "http://18.228.252.149:8000";
const CLIMA_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 min (tempo muda rapido em tempestade)
const CLIMA_AGORA_URL = "https://api.open-meteo.com/v1/forecast?latitude=-25.5163&longitude=-54.5854" +
  "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day" +
  "&hourly=precipitation,precipitation_probability,weather_code,wind_gusts_10m&forecast_hours=3&timezone=America%2FSao_Paulo";
const CLIMA_INMET_URL = "https://apiprevmet3.inmet.gov.br/avisos/ativos";
const CLIMA_IBGE_FOZ = "4108304";
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

function climaNomeCodigo(c) {
  if (c === 0) return "Céu limpo";
  if (c === 1) return "Predomínio de sol";
  if (c === 2) return "Parcialmente nublado";
  if (c === 3) return "Nublado";
  if (c === 45 || c === 48) return "Neblina";
  if (c === 51 || c === 53) return "Garoa";
  if (c === 55 || c === 56 || c === 57) return "Garoa forte";
  if (c === 61) return "Chuva fraca";
  if (c === 63) return "Chuva moderada";
  if (c === 65 || c === 66 || c === 67) return "Chuva forte";
  if (c === 80) return "Pancadas de chuva";
  if (c === 81) return "Pancadas fortes de chuva";
  if (c === 82) return "Chuva muito forte";
  if (c === 95) return "Tempestade";
  if (c === 96 || c === 99) return "Tempestade com granizo";
  return "";
}

// peso de cada codigo para escolher o pior entre agora e a proxima hora
function climaGravidade(c) {
  if (c >= 95) return 10;
  if (c === 82) return 9;
  if (c === 65 || c === 67 || c === 81) return 8;
  if (c === 63 || c === 66 || c === 80) return 6;
  if (c === 61 || c === 55 || c === 57) return 4;
  if (c >= 51) return 3;
  if (c === 45 || c === 48 || c === 3) return 2;
  return c === 2 ? 1 : 0;
}

function climaTemaAgora(agora) {
  const cond = (agora.condicao || "").toLowerCase();
  const noite = (agora.icone || "").includes("/night/");
  const chuva = /chuv|garoa|trovo|tempest|aguaceiro|chuvisco/.test(cond);
  const fechado = /nublado|encoberto|neblina|nevoeiro|névoa|nevoa/.test(cond) && !/parcial/.test(cond);
  const parcial = /parcial|nuvens/.test(cond);
  if (/tempest|trovo/.test(cond)) return { ceu: "chuva", cena: "tempestade" };
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
    case "tempestade": return '<div class="escura">' + nuvens + gotas + '<i class="c-raio"></i></div>';
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
    await Promise.all([this.fetchDias(), this.fetchAlerta()]);
    if (await this.fetchAgora()) { this.render(); return; }
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

  // tempo de agora pelo Open-Meteo: o pior entre o codigo atual e o da proxima hora (com chuva de verdade prevista)
  async fetchAgora() {
    try {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 10000) : null;
      const r = await fetch(CLIMA_AGORA_URL, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      if (t) clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const c = j.current, h = j.hourly || {};
      if (!c || typeof c.temperature_2m !== "number") throw new Error("sem dados");
      const agoraIso = String(c.time || "").slice(0, 13);
      let i0 = (h.time || []).findIndex(x => String(x).slice(0, 13) === agoraIso);
      if (i0 < 0) i0 = 0;
      let codigo = c.weather_code;
      const prox = (h.weather_code || [])[i0 + 1];
      const proxMm = (h.precipitation || [])[i0 + 1] || 0;
      const estaMm = (h.precipitation || [])[i0] || 0;
      if (prox !== undefined && climaGravidade(prox) > climaGravidade(codigo) && (proxMm >= 1 || prox >= 95)) codigo = prox;
      if (climaGravidade(codigo) < 10 && (h.weather_code || [])[i0] >= 95) codigo = h.weather_code[i0];
      let condicao = climaNomeCodigo(codigo) || "";
      const mm = Math.max(estaMm, proxMm);
      if (codigo < 95 && mm >= 10) condicao = "Chuva muito forte";
      else if (codigo < 95 && mm >= 4 && climaGravidade(codigo) < 8) condicao = "Chuva forte";
      const rajada = Math.max(c.wind_gusts_10m || 0, (h.wind_gusts_10m || [])[i0 + 1] || 0);
      const prob = Math.max((h.precipitation_probability || [])[i0] || 0, (h.precipitation_probability || [])[i0 + 1] || 0);
      const noite = c.is_day === 0;
      // tempo ruim agora ou nas proximas 3 h? (para o alerta de tempestade nao ficar piscando com o tempo bom)
      const cods = [c.weather_code].concat(h.weather_code || []), mms = h.precipitation || [], raj = h.wind_gusts_10m || [];
      this.tempoRuim = cods.some(x => x >= 61) || mms.some(x => x >= 1) || raj.some(x => x >= 50) || (c.wind_gusts_10m || 0) >= 50;
      this.data = {
        agora: {
          temp: c.temperature_2m,
          condicao: condicao,
          chuva: mm >= 0.5 && prob < 80 ? 80 : prob,
          vento: Math.round(rajada >= 40 ? rajada : (c.wind_speed_10m || 0)),
          rajada: rajada >= 40,
          umidade: Math.round(c.relative_humidity_2m || 0),
          icone: noite ? "/night/" : "/day/"
        }
      };
      return true;
    } catch (e) {
      console.warn("⚠️ Widget Clima: Open-Meteo agora falhou, usando a API da EXA.", e);
      return false;
    }
  }

  // aviso ativo do INMET (Defesa Civil) para Foz do Iguacu — o de maior gravidade que vale agora
  async fetchAlerta() {
    try {
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
      const r = await fetch(CLIMA_INMET_URL, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      if (t) clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const agora = Date.now();
      const quando = (s) => { const d = new Date(String(s || "").replace(" ", "T") + ":00-03:00"); return isNaN(d.getTime()) ? null : d.getTime(); };
      const lista = [].concat(j.hoje || [], j.futuro || []).filter(a => {
        if (!a || a.encerrado === true || a.encerrado === 1) return false;
        if (String(a.geocodes || "").split(",").map(x => x.trim()).indexOf(CLIMA_IBGE_FOZ) < 0) return false;
        const ini = quando(a.inicio), fim = quando(a.fim);
        return (ini === null || ini <= agora + 30 * 60000) && (fim === null || fim >= agora);
      });
      lista.sort((a, b) => (Number(b.id_severidade) || 0) - (Number(a.id_severidade) || 0));
      this.alerta = lista[0] || null;
    } catch (e) {
      console.warn("⚠️ Widget Clima: avisos do INMET indisponíveis.", e);
      // sem resposta: mantem o ultimo alerta ate ele vencer
      if (this.alerta) {
        const fim = new Date(String(this.alerta.fim || "").replace(" ", "T") + ":00-03:00").getTime();
        if (!isNaN(fim) && fim < Date.now()) this.alerta = null;
      }
    }
  }

  alertaCheioHtml() {
    const a = this.alerta;
    const sev = String(a.severidade || "Alerta");
    const cor = /^#[0-9a-f]{6}$/i.test(a.aviso_cor || "") ? a.aviso_cor : "#F96602";
    const texto = /grande/i.test(sev) ? "#fff" : "#1a1206";
    const ev = String(a.descricao || "Tempo severo");
    const risco = String(a.riscos || "").split(/[.;]/)[0].replace(/\s+/g, " ").trim().slice(0, 120);
    const instr = String(a.instrucoes || "").split(/[.;]/).map(x => x.trim()).filter(x => x.length > 8)[0] || "Evite sair durante a tempestade e não se abrigue sob árvores";
    const fim = String(a.fim || "").slice(11, 16);
    return `<div class="clima-alerta-cheio" style="background:${cor};color:${texto}">
      <div class="cac-tit"><span class="cac-sino">⚠</span>ALERTA DA DEFESA CIVIL</div>
      <div class="cac-ev">${ev.toUpperCase()}</div>
      <div class="cac-sev">${sev}${fim ? " · até " + fim : ""}</div>
      <div class="cac-risco">${risco}.</div>
      <div class="cac-instr">${instr.slice(0, 90)}.</div>
      <div class="cac-pe">Emergência: <b>Defesa Civil 199</b> · <b>Bombeiros 193</b></div>
    </div>`;
  }

  alertaHtml() {
    const a = this.alerta;
    if (!a) return "";
    const sev = String(a.severidade || "Alerta");
    const cor = /^#[0-9a-f]{6}$/i.test(a.aviso_cor || "") ? a.aviso_cor : "#F96602";
    const escuro = /grande/i.test(sev) ? "#fff" : "#1a1206";
    const risco = String(a.riscos || "").split(/[.;]/)[0].replace(/\s+/g, " ").trim().slice(0, 110);
    const ev = String(a.descricao || "Tempo severo");
    const fim = String(a.fim || "").slice(11, 16);
    return `<div class="clima-alerta" style="background:${cor};color:${escuro}">
      <div class="ca-top"><span class="ca-sino">⚠</span><b>ALERTA DE ${ev.toUpperCase()}</b><span class="ca-sev">${sev}</span></div>
      <div class="ca-risco">${risco}${risco && !/\.$/.test(risco) ? "." : ""}</div>
      <div class="ca-pe">Defesa Civil <b>199</b> · Bombeiros <b>193</b> · INMET${fim ? " · até " + fim : ""}</div>
    </div>`;
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
      <div class="clima-linha"><div class="clima-temp">${Math.round(agora.temp)}<sup>°C</sup></div><div class="clima-cond${String(agora.condicao || "").length > 18 ? " longa" : ""}">${agora.condicao || ""}</div></div>
      <div class="clima-meta"><span>Chuva <b>${agora.chuva}%</b></span><span>${agora.rajada ? "Rajadas" : "Vento"} <b>${agora.vento} km/h</b></span><span>Umid. <b>${agora.umidade}%</b></span></div>
      ${this.alerta ? this.alertaHtml() + this.alertaCheioHtml() : `<div class="clima-dias ${dias.n === 2 ? "d2" : ""}">${dias.html}</div>`}`;
    this.container.classList.toggle("com-alerta", !!this.alerta);
    // modo alerta: o card inteiro alterna a cada 3 s entre o tempo e o alerta da Defesa Civil
    // aviso de chuva/tempestade/vento com o tempo firme (agora e nas proximas 3 h): fica so a faixa, sem tomar o card
    const eventoDeChuva = this.alerta && /tempest|chuva|vendaval|granizo|tornado|ciclone/i.test(String(this.alerta.descricao || ""));
    const piscar = this.alerta && !(eventoDeChuva && this.tempoRuim === false);
    if (!piscar && this.piscaAlerta) { clearInterval(this.piscaAlerta); this.piscaAlerta = null; this.container.classList.remove("mostra-alerta"); }
    if (piscar && !this.piscaAlerta) {
      this.piscaAlerta = setInterval(() => { this.container.classList.toggle("mostra-alerta"); }, 3000);
    }
  }

  renderErro() {
    this.container.innerHTML = '<div class="clima-ceu nublado"></div><div class="clima-msg">Clima indisponível no momento</div>';
  }
}

(function climaEstiloAlerta() {
  const css = `.widget-clima .clima-alerta{position:absolute;left:12px;right:12px;bottom:12px;border-radius:14px;padding:9px 12px 8px;box-shadow:0 4px 18px rgba(0,0,0,.35);animation:caPulso 2.4s ease-in-out infinite}
.clima-alerta .ca-top{display:flex;align-items:center;gap:8px;font-size:15px;letter-spacing:.6px;line-height:1.1}
.clima-alerta .ca-sino{font-size:18px}
.clima-alerta .ca-sev{margin-left:auto;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:3px 7px;border-radius:999px;background:rgba(0,0,0,.18)}
.clima-alerta .ca-risco{font-size:13px;font-weight:600;line-height:1.25;margin-top:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.clima-alerta .ca-pe{font-size:11.5px;margin-top:4px;opacity:.92}
.c-raio{position:absolute;left:58px;top:58px;width:22px;height:36px;background:#ffd23f;clip-path:polygon(55% 0,0 58%,42% 58%,25% 100%,100% 38%,58% 38%,80% 0);animation:caRaio 3.2s steps(1) infinite}
.clima-cond.longa{font-size:15px}
.widget-clima .clima-alerta-cheio{position:absolute;top:0;left:0;right:0;bottom:0;z-index:6;padding:16px 18px;display:flex;flex-direction:column;justify-content:center;gap:3px;opacity:0;transition:opacity .45s ease;pointer-events:none}
.widget-clima.mostra-alerta .clima-alerta-cheio{opacity:1}
.clima-alerta-cheio .cac-tit{font-size:14px;font-weight:800;letter-spacing:2px;display:flex;align-items:center;gap:8px}
.clima-alerta-cheio .cac-sino{font-size:22px;animation:caSino 1s ease-in-out infinite}
.clima-alerta-cheio .cac-ev{font-size:40px;font-weight:900;letter-spacing:.5px;line-height:1.02}
.clima-alerta-cheio .cac-sev{font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px}
.clima-alerta-cheio .cac-risco{font-size:14px;font-weight:600;line-height:1.25;margin-top:4px}
.clima-alerta-cheio .cac-instr{font-size:13px;line-height:1.25;opacity:.95}
.clima-alerta-cheio .cac-pe{font-size:14px;margin-top:6px}
@keyframes caSino{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
@keyframes caPulso{0%,100%{filter:none}50%{filter:brightness(1.12)}}
@keyframes caRaio{0%,70%{opacity:0}72%,76%{opacity:1}78%,100%{opacity:0}}`;
  try { const st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st); } catch (e) {}
})();

document.addEventListener("DOMContentLoaded", () => {
  window.climaWidget = new ClimaWidget();
  window.__climaLoaded = true;
});

// 07/11/2026: quadro de câmbio intercalado nas Notícias Brasil (scripts/peca.js decide em quais prédios liga)
(function () {
  try {
    if (window.__pecaCarregado || /[?&]tela=1(&|$)/.test(location.search)) return; // na réplica vem pelo compat/
    var s = document.createElement("script");
    s.src = "scripts/peca.js?v=" + Date.now();
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* sem o quadro */ }
})();
