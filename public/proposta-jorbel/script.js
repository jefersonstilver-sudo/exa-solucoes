/* ═══════════════════════════════════════════════════════════════
   EXA Mídia × CellShop — Proposta Comercial 2026
   Animations & Interactions
   ═══════════════════════════════════════════════════════════════ */

// ── Lenis Smooth Scroll (desktop only — mobile uses native scroll) ──
gsap.registerPlugin(ScrollTrigger);
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

let lenis;
if (!isMobile) {
  lenis = new Lenis({
    duration: 0.9,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    wheelMultiplier: 1.2,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ── Reveal on Scroll ──
if (isMobile) {
  // Lightweight CSS-based reveal on mobile for better scroll performance
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "opacity .5s ease-out, transform .5s ease-out";
    revealObserver.observe(el);
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });
}

// ── Count-Up Animation ──
function countUp(el, target, duration = 1.2, prefix = "", suffix = "") {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: "power2.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      once: true,
    },
    onUpdate: () => {
      const formatted = Math.round(obj.val).toLocaleString("pt-BR");
      el.textContent = prefix + formatted + suffix;
    },
  });
}

document.querySelectorAll("[data-count]").forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (!isNaN(target)) {
    countUp(el, target, 1.4, prefix, suffix);
  }
});

// ── Hero Logo Animation ──
const heroLogos = document.querySelector(".hero-logos");
if (heroLogos) {
  const imgs = heroLogos.querySelectorAll("img");
  const divider = heroLogos.querySelector(".divider");
  if (imgs.length >= 2) {
    gsap.fromTo(
      imgs[0],
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 1, ease: "back.out(1.4)", delay: 0.3 }
    );
    gsap.fromTo(
      imgs[1],
      { opacity: 0, x: 60 },
      { opacity: 1, x: 0, duration: 1, ease: "back.out(1.4)", delay: 0.5 }
    );
    if (divider) {
      gsap.fromTo(
        divider,
        { opacity: 0, scaleY: 0 },
        { opacity: 1, scaleY: 1, duration: 0.6, ease: "power2.out", delay: 0.7 }
      );
    }
  }
}

// ── Anatomy Cards Stagger ──
const anatomyCards = document.querySelectorAll(".anatomy-card");
if (anatomyCards.length) {
  gsap.fromTo(
    anatomyCards,
    { opacity: 0, y: 30, scale: 0.97 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".anatomy-grid",
        start: "top 80%",
      },
    }
  );
}

// ── Timeline Animation ──
const timelineItems = document.querySelectorAll(".timeline-item");
if (timelineItems.length) {
  gsap.fromTo(
    timelineItems,
    { opacity: 0, x: -20 },
    {
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".timeline",
        start: "top 80%",
      },
    }
  );
}

// ── FAQ Accordion ──
document.querySelectorAll(".faq-item").forEach((item) => {
  const answer = item.querySelector(".faq-answer");
  const inner = item.querySelector(".faq-answer-inner");

  // Set initial state
  if (!item.classList.contains("open")) {
    answer.style.maxHeight = "0px";
  }

  // Observe class changes for toggle
  const observer = new MutationObserver(() => {
    if (item.classList.contains("open")) {
      answer.style.maxHeight = inner.scrollHeight + "px";
    } else {
      answer.style.maxHeight = "0px";
    }
  });
  observer.observe(item, { attributes: true, attributeFilter: ["class"] });
});

// ── Ticker — Inline Logo Scroll (fetches from Supabase) ──
const SUPABASE_URL = "https://aakenoljsycyrcrchgxj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk";

async function loadTicker() {
  const scrollEl = document.getElementById("ticker-scroll");
  if (!scrollEl) return;
  try {
    const res = await fetch(
      SUPABASE_URL + "/rest/v1/logos?select=name,file_url,scale_factor&is_active=eq.true&order=sort_order",
      { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
    );
    const logos = await res.json();
    if (!logos.length) return;
    // Duplicate for seamless infinite loop
    const html = logos.map(l =>
      `<img src="${l.file_url}" alt="${l.name}" style="height:${Math.round(32 * (l.scale_factor || 1))}px" loading="lazy">`
    ).join("");
    scrollEl.innerHTML = html + html;
    // Adjust speed based on logo count
    const duration = Math.max(20, logos.length * 3);
    scrollEl.style.animationDuration = duration + "s";
  } catch (e) {
    console.warn("Ticker load failed:", e);
    scrollEl.closest(".ticker-wrap").style.display = "none";
  }
}
loadTicker();

// ── Building Grid — API Fetch ──
const PRIORITY_ORDER = [
  "riverside",
  "royal legacy",
  "miro",
  "miró",
  "provence",
  "viena",
];

const FALLBACK_BUILDINGS = [
  { nome: "Riverside Residence", bairro: "Centro", unidades: 52, statusGroup: "ativo" },
  { nome: "Royal Legacy", bairro: "Centro", unidades: 80, statusGroup: "ativo" },
  { nome: "Edifício Miró", bairro: "Centro", unidades: 64, statusGroup: "ativo" },
  { nome: "Provence Residence", bairro: "Centro", unidades: 88, statusGroup: "ativo" },
  { nome: "Viena Residence", bairro: "Vila A", unidades: 72, statusGroup: "ativo" },
  { nome: "Cheverny", bairro: "Centro", unidades: 96, statusGroup: "ativo" },
  { nome: "Residence Renoir", bairro: "Centro", unidades: 88, statusGroup: "ativo" },
  { nome: "Saint Peter", bairro: "Centro", unidades: 76, statusGroup: "ativo" },
  { nome: "Villa Appia", bairro: "Centro", unidades: 76, statusGroup: "ativo" },
  { nome: "Edifício Luiz XV", bairro: "Centro", unidades: 76, statusGroup: "ativo" },
  { nome: "Las Brisas", bairro: "Centro", unidades: 72, statusGroup: "ativo" },
  { nome: "Omoiru", bairro: "Centro", unidades: 68, statusGroup: "ativo" },
  { nome: "Foz Residence", bairro: "Centro", unidades: 60, statusGroup: "ativo" },
  { nome: "Edifício Barcelona", bairro: "Centro", unidades: 56, statusGroup: "ativo" },
  { nome: "Torres del Sol", bairro: "Vila A", unidades: 52, statusGroup: "ativo" },
];

function sortBuildings(buildings) {
  return buildings.sort((a, b) => {
    const na = (a.nome || "").toLowerCase();
    const nb = (b.nome || "").toLowerCase();
    const ia = PRIORITY_ORDER.findIndex((p) => na.includes(p));
    const ib = PRIORITY_ORDER.findIndex((p) => nb.includes(p));
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return (b.unidades || 0) - (a.unidades || 0);
  });
}

// Tipos comerciais a excluir
const EXCLUDED_TYPES = ["entrada_comercial", "tablet", "sala_reuniao", "comercial"];

function buildCard(b, isAtivo) {
  const initials = (b.nome || "EXA")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const imgHtml =
    b.fotoUrl && b.fotoUrl.startsWith("http")
      ? `<img class="building-img" src="${b.fotoUrl}" alt="${b.nome}" loading="lazy" onerror="this.outerHTML='<div class=building-placeholder><span>${initials}</span></div>'">`
      : `<div class="building-placeholder"><span>${initials}</span></div>`;

  let tags = "";
  if (b.temAirbnb) {
    tags +=
      '<span style="font-size:11px;padding:3px 10px;border-radius:5px;font-weight:800;font-family:var(--font-display);letter-spacing:.8px;background:rgba(255,88,93,.15);color:#FF585D;border:1px solid rgba(255,88,93,.35)">AIRBNB</span>';
  }
  if (isAtivo) {
    tags +=
      '<span style="font-size:7px;padding:2px 6px;border-radius:3px;font-weight:600;font-family:var(--font-display);letter-spacing:.5px;background:rgba(234,37,29,.08);color:var(--red);border:1px solid rgba(234,37,29,.15);text-transform:uppercase">Ativo</span>';
  } else {
    tags +=
      '<span style="font-size:7px;padding:2px 6px;border-radius:3px;font-weight:600;font-family:var(--font-display);letter-spacing:.5px;background:var(--surface-2);color:var(--t3);border:1px solid var(--border);text-transform:uppercase">Na fila</span>';
  }

  const cardStyle = isAtivo ? "" : "opacity:.5;border-color:rgba(255,255,255,.03)";

  return `
    <div class="building-card" style="${cardStyle}">
      ${imgHtml}
      <div class="building-info">
        <div class="building-name">${b.nome || "—"}</div>
        <div class="building-meta">${b.bairro || ""} · ${b.unidades || 0} unid.</div>
        <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${tags}</div>
      </div>
    </div>
  `;
}

function renderBuildings(buildings) {
  const gridAtivos = document.getElementById("building-grid-ativos");
  const gridPipeline = document.getElementById("pipeline-inner");
  const pipelineSection = document.getElementById("pipeline-section");
  if (!gridAtivos) return;

  // Filtrar tipos comerciais
  const residenciais = buildings.filter((p) => {
    const tipo = (p.tipo || "").toLowerCase();
    const nome = (p.nome || "").toLowerCase();
    return (
      !EXCLUDED_TYPES.includes(tipo) &&
      !nome.includes("tablet") &&
      !nome.includes("sala de") &&
      !nome.includes("entrada comercial") &&
      nome !== "entrada"
    );
  });

  // Separar ativos e pipeline
  const ativos = residenciais.filter(
    (p) => p.statusGroup === "ativo" || p.statusGroup === "instalacao"
  );
  const pipeline = residenciais.filter(
    (p) =>
      p.statusGroup !== "ativo" &&
      p.statusGroup !== "instalacao" &&
      p.statusGroup !== "inativo"
  );

  const sortedAtivos = sortBuildings(ativos);
  const sortedPipeline = pipeline.sort(
    (a, b) => (b.unidades || 0) - (a.unidades || 0)
  );

  // Render ativos
  gridAtivos.innerHTML = sortedAtivos.map((b) => buildCard(b, true)).join("");

  // Render pipeline
  if (gridPipeline && sortedPipeline.length > 0) {
    gridPipeline.innerHTML = sortedPipeline
      .map((b) => buildCard(b, false))
      .join("");
    if (pipelineSection) pipelineSection.style.display = "block";
  } else if (pipelineSection) {
    pipelineSection.style.display = "none";
  }

  // Animate active cards
  gsap.fromTo(
    gridAtivos.querySelectorAll(".building-card"),
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }
  );
}

// Toggle pipeline visibility
let pipelineOpen = false;
function togglePipeline() {
  const container = document.getElementById("building-grid-pipeline");
  const inner = document.getElementById("pipeline-inner");
  const text = document.getElementById("pipeline-toggle-text");
  const arrow = document.getElementById("pipeline-arrow");
  if (!container || !inner) return;

  pipelineOpen = !pipelineOpen;
  if (pipelineOpen) {
    container.style.maxHeight = inner.scrollHeight + 100 + "px";
    text.textContent = "Ocultar prédios na fila";
    arrow.style.transform = "rotate(180deg)";
    // Animate pipeline cards
    gsap.fromTo(
      inner.querySelectorAll(".building-card"),
      { opacity: 0, y: 15 },
      { opacity: 0.5, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", delay: 0.15 }
    );
  } else {
    container.style.maxHeight = "0px";
    text.textContent = "Mostrar prédios na fila de instalação";
    arrow.style.transform = "rotate(0deg)";
  }
}

async function loadBuildings() {
  try {
    const res = await fetch(
      "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/catalogo-predios",
      {
        headers: {
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"
        }
      }
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    renderBuildings(data.predios || []);
    autoExpandPipeline();
  } catch (e) {
    console.warn("API indisponível, usando fallback:", e);
    renderBuildings(FALLBACK_BUILDINGS);
    autoExpandPipeline();
  }
}

function autoExpandPipeline() {
  const container = document.getElementById("building-grid-pipeline");
  const inner = document.getElementById("pipeline-inner");
  const text = document.getElementById("pipeline-toggle-text");
  const arrow = document.getElementById("pipeline-arrow");
  if (!container || !inner || !inner.children.length) return;

  pipelineOpen = true;
  container.style.maxHeight = inner.scrollHeight + 100 + "px";
  if (text) text.textContent = "Ocultar prédios na fila";
  if (arrow) arrow.style.transform = "rotate(180deg)";
  gsap.fromTo(
    inner.querySelectorAll(".building-card"),
    { opacity: 0, y: 15 },
    { opacity: 0.5, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out", delay: 0.15 }
  );
}

loadBuildings();

// ── Comparison Line Animation ──
const compareEl = document.querySelector(".compare");
if (compareEl) {
  gsap.fromTo(
    ".compare-side.dim",
    { opacity: 0, x: -40 },
    {
      opacity: 0.6,
      x: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: compareEl, start: "top 80%" },
    }
  );
  gsap.fromTo(
    ".compare-side.highlight",
    { opacity: 0, x: 40 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.15,
      scrollTrigger: { trigger: compareEl, start: "top 80%" },
    }
  );
}

// ── Map Stats Animation ──
const mapStats = document.querySelectorAll("#mapa [data-count]");
if (mapStats.length) {
  mapStats.forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!isNaN(target)) countUp(el, target, 1, "", "");
  });
}

// ── Copa Bar Animation ──
const copaBar = document.querySelector(".copa-bar-fill");
if (copaBar) {
  gsap.fromTo(
    copaBar,
    { scaleX: 0, transformOrigin: "left center" },
    {
      scaleX: 1,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: copaBar,
        start: "top 85%",
      },
    }
  );
}
