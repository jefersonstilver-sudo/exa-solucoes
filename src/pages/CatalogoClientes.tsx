import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';

// ============================================================
// EXA MIDIA KIT 2025 - Catálogo Clientes
// Página pública independente. Não usa layout/auth do site.
// ============================================================

const SUPABASE_URL = 'https://aakenoljsycyrcrchgxj.supabase.co';

type Predio = {
  id?: string;
  nome: string;
  bairro?: string;
  endereco?: string;
  unidades?: number;
  andares?: number;
  blocos?: number;
  elevadores?: number;
  publicoEstimado?: number;
  telas?: number;
  tipo?: string;
  status?: string;
  statusGroup?: string;
  fotoUrl?: string;
  fotos?: string[];
  temAirbnb?: boolean;
};

const FALLBACK_BUILDINGS: Predio[] = [
  { nome: 'Riverside Residence', bairro: 'Centro', unidades: 52, andares: 11, endereco: 'R. Belarmino de Mendonça, 358', temAirbnb: true },
  { nome: 'Riverside Residence 2', bairro: 'Centro', unidades: 52, andares: 11, endereco: 'R. Belarmino de Mendonça, 358', temAirbnb: true },
  { nome: 'Royal Legacy 1', bairro: 'Vila Yolanda', unidades: 48, andares: 12, endereco: 'Av. dos Imigrantes, 522', temAirbnb: true },
  { nome: 'Royal Legacy 2', bairro: 'Vila Yolanda', unidades: 48, andares: 12, endereco: 'Av. dos Imigrantes, 522', temAirbnb: true },
  { nome: 'Royal Legacy 3', bairro: 'Vila Yolanda', unidades: 48, andares: 12, endereco: 'Av. dos Imigrantes, 522', temAirbnb: true },
  { nome: 'Residencial Miro', bairro: 'Centro', unidades: 68, andares: 17, endereco: 'R. Mal. Floriano Peixoto, 1210', temAirbnb: true },
  { nome: 'Provence 1', bairro: 'Centro', unidades: 72, andares: 18, endereco: 'Av. Pedro Basso, 341', temAirbnb: false },
  { nome: 'Provence 2', bairro: 'Centro', unidades: 72, andares: 18, endereco: 'Av. Pedro Basso, 341', temAirbnb: false },
  { nome: 'Edifício Viena', bairro: 'Vila Maracanã', unidades: 40, andares: 9, endereco: 'R. Patrulheiro Venanti Otremba, 293', temAirbnb: false },
  { nome: 'Residence Renoir Foz', bairro: 'Centro', unidades: 88, andares: 22, endereco: 'R. Mal. Deodoro, 1185', temAirbnb: false },
  { nome: 'Cond. Res. Saint Peter', bairro: 'Centro', unidades: 76, andares: 19, endereco: 'R. Rui Barbosa, 1786', temAirbnb: true },
  { nome: 'Residencial Villa Appia', bairro: 'Centro', unidades: 76, andares: 19, endereco: 'R. Bartolomeu de Gusmão, 1564', temAirbnb: false },
  { nome: 'Luis XV', bairro: 'Centro', unidades: 76, andares: 19, endereco: 'R. Mal. Floriano Peixoto, 1157', temAirbnb: false },
  { nome: 'Cond. Ed. Torre Azul', bairro: 'Centro', unidades: 76, andares: 19, endereco: 'R. Jorge Sanwais, 1523', temAirbnb: false },
  { nome: 'Edifício Las Brisas', bairro: 'Centro', unidades: 72, andares: 18, endereco: 'Av. Juscelino Kubitscheck, 133', temAirbnb: false },
  { nome: 'Omoiru', bairro: 'Centro', unidades: 68, andares: 19, endereco: 'R. Padre Montoya, 490', temAirbnb: true },
  { nome: 'Edifício Rio Negro', bairro: 'Centro', unidades: 68, andares: 17, endereco: 'R. Mal. Deodoro, 366', temAirbnb: false },
  { nome: 'Cond. Ed. Cheverny', bairro: 'Centro', unidades: 64, andares: 16, endereco: 'Av. José Maria de Brito, 2930', temAirbnb: true },
  { nome: 'Cond. Ed. Cheverny 2', bairro: 'Centro', unidades: 64, andares: 13, endereco: 'Av. José Maria de Brito, 2930', temAirbnb: true },
  { nome: 'Edifício Vale do Monjolo', bairro: 'Centro', unidades: 64, andares: 16, endereco: 'Alameda Rui Ferreira, 26', temAirbnb: false },
  { nome: 'Edifício Barcelona', bairro: 'Centro', unidades: 56, andares: 14, endereco: 'R. Dom Pedro II, 519', temAirbnb: false },
  { nome: 'Edifício Foz Residence', bairro: 'Centro', unidades: 48, andares: 12, endereco: 'R. Santos Dumont, 1085', temAirbnb: true },
  { nome: 'Edifício Pietro Angelo', bairro: 'Centro', unidades: 36, andares: 9, endereco: 'Av. Juscelino Kubitscheck, 626', temAirbnb: false },
];

const PRIORITY_ORDER = ['riverside', 'royal legacy', 'mir', 'provence', 'viena'];

function sortBuildings(list: Predio[]): Predio[] {
  return [...list].sort((a, b) => {
    const na = (a.nome || '').toLowerCase();
    const nb = (b.nome || '').toLowerCase();
    let ia = PRIORITY_ORDER.length;
    let ib = PRIORITY_ORDER.length;
    for (let k = 0; k < PRIORITY_ORDER.length; k++) {
      if (na.includes(PRIORITY_ORDER[k])) { ia = k; break; }
    }
    for (let k = 0; k < PRIORITY_ORDER.length; k++) {
      if (nb.includes(PRIORITY_ORDER[k])) { ib = k; break; }
    }
    if (ia !== ib) return ia - ib;
    return (b.unidades || 0) - (a.unidades || 0);
  });
}

function getInitials(name: string): string {
  return (name || 'EXA').split(/\s+/).map(w => w[0]).join('').substring(0, 3).toUpperCase();
}

// Counter animation hook
function useCountUp(target: number, trigger: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, duration]);
  return value;
}

// ============================================================
// CSS — ported from reference HTML
// ============================================================
const PAGE_CSS = `
.exa-mk *,.exa-mk *::before,.exa-mk *::after{box-sizing:border-box;margin:0;padding:0}
.exa-mk{
  --r:#E8000D;--r2:#ff2d2d;--r-dim:rgba(232,0,13,.12);--r-glow:rgba(232,0,13,.25);
  --bg:#07070c;--bg2:#0b0b12;--bg3:#0f0f18;
  --surf:rgba(255,255,255,.025);--surf2:rgba(255,255,255,.05);
  --brd:rgba(255,255,255,.06);--brd2:rgba(255,255,255,.1);
  --t1:rgba(255,255,255,.93);--t2:rgba(255,255,255,.58);--t3:rgba(255,255,255,.3);
  --hd:'Barlow Condensed',sans-serif;--bd:'DM Sans',system-ui,sans-serif;
  --px:clamp(20px,5vw,80px);--max:1180px;--rad:14px;
  font-family:var(--bd);color:var(--t1);background:var(--bg);
  -webkit-font-smoothing:antialiased;overflow-x:hidden;line-height:1.65;
  min-height:100vh;position:relative;
}
.exa-mk img{max-width:100%;display:block}
.exa-mk a{color:inherit;text-decoration:none}
.exa-mk::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.03;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.exa-mk .topnav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:18px var(--px);display:flex;justify-content:space-between;align-items:center;background:transparent;border-bottom:1px solid transparent;transition:all .5s cubic-bezier(.16,1,.3,1)}
.exa-mk .topnav.scrolled{padding:12px var(--px);background:rgba(7,7,12,.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom-color:var(--brd)}
.exa-mk .logo{display:flex;align-items:center;gap:8px;font-family:var(--hd);font-weight:900;letter-spacing:6px;font-size:18px;color:#fff;text-transform:uppercase}
.exa-mk .logo-dot{width:10px;height:10px;border-radius:50%;background:var(--r);box-shadow:0 0 12px var(--r-glow)}
.exa-mk .nav-links{display:flex;gap:28px;font-size:13px;font-weight:500;color:var(--t2);letter-spacing:.3px}
.exa-mk .nav-links a{transition:color .3s;position:relative}
.exa-mk .nav-links a:hover{color:#fff}
.exa-mk .nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:1.5px;background:var(--r);transition:width .3s}
.exa-mk .nav-links a:hover::after{width:100%}
.exa-mk .nav-cta{padding:9px 22px;background:var(--r);color:#fff;border-radius:8px;font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-family:var(--hd);transition:all .3s;box-shadow:0 2px 16px var(--r-glow)}
.exa-mk .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 24px var(--r-glow);background:#ff1a1a}
@media(max-width:768px){.exa-mk .nav-links{display:none}}
.exa-mk section{position:relative;overflow:hidden}
.exa-mk .container{max-width:var(--max);margin:0 auto;padding:0 var(--px)}
.exa-mk .section-pad{padding:clamp(64px,12vh,140px) 0}
.exa-mk .reveal{opacity:0;transform:translateY(36px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
.exa-mk .reveal.visible{opacity:1;transform:none}
.exa-mk .reveal-d1{transition-delay:.1s}.exa-mk .reveal-d2{transition-delay:.2s}.exa-mk .reveal-d3{transition-delay:.3s}
.exa-mk .reveal-d4{transition-delay:.4s}.exa-mk .reveal-d5{transition-delay:.5s}.exa-mk .reveal-d6{transition-delay:.6s}
.exa-mk .eyebrow{font-family:var(--hd);font-size:12px;letter-spacing:5px;text-transform:uppercase;color:var(--r);margin-bottom:10px;font-weight:600}
.exa-mk .h1{font-family:var(--hd);font-size:clamp(48px,9vw,100px);font-weight:900;line-height:.92;letter-spacing:-.02em;text-transform:uppercase}
.exa-mk .h2{font-family:var(--hd);font-size:clamp(36px,5.5vw,64px);font-weight:800;line-height:1;letter-spacing:-.01em;text-transform:uppercase}
.exa-mk .h3{font-family:var(--hd);font-size:clamp(22px,3vw,32px);font-weight:700;line-height:1.15;text-transform:uppercase}
.exa-mk .red{color:var(--r)}
.exa-mk .sub{font-size:clamp(16px,1.8vw,20px);font-weight:300;color:var(--t2);line-height:1.7;max-width:560px}
.exa-mk .body-text{font-size:clamp(14px,1.2vw,16px);color:var(--t2);line-height:1.75}
.exa-mk .red-line{width:52px;height:3px;background:var(--r);border-radius:2px;margin:18px 0;box-shadow:0 0 14px var(--r-glow)}
.exa-mk .card{background:var(--surf);border:1px solid var(--brd);border-radius:var(--rad);padding:clamp(20px,2.5vw,32px);transition:all .4s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.exa-mk .card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .4s;background:radial-gradient(ellipse at 50% 0%,rgba(232,0,13,.04),transparent 70%);pointer-events:none}
.exa-mk .card:hover{border-color:rgba(232,0,13,.2);transform:translateY(-2px)}
.exa-mk .card:hover::before{opacity:1}
.exa-mk .grid{display:grid;gap:clamp(14px,2vw,24px)}
.exa-mk .g2{grid-template-columns:repeat(2,1fr)}
.exa-mk .g3{grid-template-columns:repeat(3,1fr)}
.exa-mk .g4{grid-template-columns:repeat(4,1fr)}
@media(max-width:900px){.exa-mk .g2,.exa-mk .g3,.exa-mk .g4{grid-template-columns:1fr}}
@media(min-width:901px) and (max-width:1100px){.exa-mk .g3,.exa-mk .g4{grid-template-columns:repeat(2,1fr)}}
.exa-mk .stat-num{font-family:var(--hd);font-size:clamp(40px,6vw,72px);font-weight:900;color:var(--r);line-height:1;letter-spacing:-.03em}
.exa-mk .stat-label{font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:2.5px;margin-top:6px;font-family:var(--hd);font-weight:500}
.exa-mk .frame{border-radius:var(--rad);overflow:hidden;border:1px solid var(--brd);position:relative}
.exa-mk .frame img{width:100%;display:block}
.exa-mk .frame::after{content:'';position:absolute;inset:0;border-radius:var(--rad);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);pointer-events:none}
.exa-mk .glow{position:absolute;border-radius:50%;background:var(--r);filter:blur(160px);opacity:.07;pointer-events:none}
.exa-mk .divider{height:1px;background:linear-gradient(90deg,transparent,var(--brd),transparent);margin:0}
.exa-mk .hero{min-height:100vh;display:flex;align-items:flex-end;position:relative;padding-bottom:clamp(60px,10vh,120px)}
.exa-mk .hero-bg{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 70% 30%,rgba(232,0,13,.15),transparent 50%),linear-gradient(135deg,#1a0508 0%,#07070c 60%)}
.exa-mk .hero-bg img{width:100%;height:100%;object-fit:cover;filter:blur(4px) brightness(.65);transform:scale(1.05)}
.exa-mk .hero-overlay{position:absolute;inset:0;background:linear-gradient(160deg,rgba(7,7,12,.92) 0%,rgba(7,7,12,.5) 40%,rgba(7,7,12,.85) 100%)}
.exa-mk .hero-accent{position:absolute;bottom:0;left:0;right:0;height:320px;background:linear-gradient(0deg,var(--bg) 5%,rgba(7,7,12,.6) 50%,transparent);pointer-events:none;z-index:1}
.exa-mk .hero .container{position:relative;z-index:2}
.exa-mk .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(232,0,13,.08);border:1px solid rgba(232,0,13,.15);color:var(--r);font-family:var(--hd);letter-spacing:3px;margin-bottom:24px;text-transform:uppercase}
.exa-mk .hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--r);animation:exaPulse 2s ease-in-out infinite}
@keyframes exaPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 var(--r-glow)}50%{opacity:.4;box-shadow:0 0 0 8px transparent}}
.exa-mk .hero-metric{display:inline-flex;align-items:baseline;gap:14px;margin-top:28px;padding:14px 28px;border-radius:12px;background:rgba(232,0,13,.06);border:1px solid rgba(232,0,13,.12)}
.exa-mk .hero-metric-num{font-family:var(--hd);font-size:clamp(48px,7vw,80px);font-weight:900;color:var(--r);line-height:1;letter-spacing:-.03em}
.exa-mk .hero-metric-label{font-family:var(--hd);font-size:clamp(13px,1.4vw,16px);color:var(--t2);letter-spacing:1px;text-transform:uppercase;font-weight:500}
.exa-mk .hero-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10px;color:var(--t3);letter-spacing:2px;text-transform:uppercase;font-family:var(--hd)}
.exa-mk .hero-scroll-line{width:1px;height:40px;background:linear-gradient(to bottom,var(--r),transparent);animation:scrollDown 2s ease-in-out infinite}
@keyframes scrollDown{0%{opacity:0;transform:scaleY(0);transform-origin:top}50%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(0);transform-origin:bottom}}
.exa-mk .quote-section{padding:clamp(48px,8vh,100px) 0;text-align:center;position:relative}
.exa-mk .quote-big{font-family:var(--hd);font-size:clamp(28px,4.5vw,52px);font-weight:700;line-height:1.15;text-transform:uppercase;max-width:900px;margin:0 auto;letter-spacing:-.01em}
.exa-mk .xmira{position:relative;display:inline-block}
.exa-mk .xmira::before,.exa-mk .xmira::after{content:'';position:absolute;width:18px;height:18px;border:2px solid var(--r);opacity:.4}
.exa-mk .xmira::before{top:-8px;left:-10px;border-right:none;border-bottom:none}
.exa-mk .xmira::after{bottom:-8px;right:-10px;border-left:none;border-top:none}
.exa-mk .bld-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.exa-mk .bld-card{border-radius:var(--rad);overflow:hidden;background:var(--surf);border:1px solid var(--brd);transition:all .4s cubic-bezier(.16,1,.3,1);position:relative}
.exa-mk .bld-card:hover{transform:translateY(-4px);border-color:rgba(232,0,13,.25);box-shadow:0 20px 60px rgba(232,0,13,.08)}
.exa-mk .bld-photo{width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--bg2);object-position:center 30%}
.exa-mk .bld-placeholder{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;position:relative;overflow:hidden;background:var(--bg2)}
.exa-mk .bld-placeholder::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%,rgba(232,0,13,.10) 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,rgba(232,0,13,.05) 0%,transparent 50%),linear-gradient(135deg,rgba(255,255,255,.015) 0%,transparent 50%)}
.exa-mk .bld-initial{font-family:var(--hd);font-size:46px;font-weight:900;letter-spacing:6px;text-transform:uppercase;line-height:1;position:relative;z-index:1;background:linear-gradient(135deg,rgba(232,0,13,.55),rgba(232,0,13,.22));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.exa-mk .bld-icon{font-size:9px;color:var(--t3);font-family:var(--hd);letter-spacing:3px;text-transform:uppercase;position:relative;z-index:1;opacity:.55;font-weight:600;border:1px solid rgba(255,255,255,.06);padding:3px 10px;border-radius:4px}
.exa-mk .bld-info{padding:14px 16px}
.exa-mk .bld-name{font-family:var(--hd);font-weight:700;font-size:15px;margin-bottom:2px;letter-spacing:.3px;text-transform:uppercase}
.exa-mk .bld-addr{font-size:11px;color:var(--t3);margin-bottom:8px;letter-spacing:.2px}
.exa-mk .bld-tags{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.exa-mk .bld-tag{font-size:9px;padding:2px 7px;border-radius:4px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;background:var(--surf2);color:var(--t2);border:1px solid var(--brd);font-family:var(--hd)}
.exa-mk .bld-tag-active{background:rgba(232,0,13,.08);color:var(--r2);border-color:rgba(232,0,13,.15)}
.exa-mk .bld-tag-airbnb{background:rgba(255,88,93,.12);color:#FF585D;border-color:rgba(255,88,93,.3);font-size:11px;padding:4px 10px;font-weight:700;letter-spacing:.6px}
.exa-mk .spinner{width:24px;height:24px;border:2px solid var(--brd);border-top-color:var(--r);border-radius:50%;animation:exaSpin .7s linear infinite}
@keyframes exaSpin{to{transform:rotate(360deg)}}
.exa-mk .num-list{display:flex;flex-direction:column;gap:18px}
.exa-mk .num-item{display:flex;gap:16px;align-items:flex-start}
.exa-mk .num-badge{flex-shrink:0;width:44px;height:44px;border-radius:10px;background:rgba(232,0,13,.06);border:1px solid rgba(232,0,13,.1);display:flex;align-items:center;justify-content:center;font-family:var(--hd);font-size:14px;font-weight:800;color:var(--r)}
.exa-mk .num-item h4{font-family:var(--hd);font-size:16px;font-weight:700;margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}
.exa-mk .num-item p{font-size:13px;color:var(--t2);line-height:1.6}
.exa-mk .step{position:relative;padding-left:24px}
.exa-mk .step::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--r);border-radius:2px;box-shadow:0 0 10px var(--r-glow)}
.exa-mk .step-num{font-family:var(--hd);font-size:10px;color:var(--r);letter-spacing:3px;margin-bottom:3px;font-weight:700;text-transform:uppercase}
.exa-mk .step h4{font-family:var(--hd);font-size:16px;font-weight:700;margin-bottom:3px;text-transform:uppercase}
.exa-mk .step p{font-size:13px;color:var(--t2);line-height:1.6}
.exa-mk .dtable{width:100%;border-collapse:collapse}
.exa-mk .dtable td{padding:14px 18px;border-bottom:1px solid var(--brd);font-size:14px}
.exa-mk .dtable td:first-child{font-family:var(--hd);font-size:12px;color:var(--t3);letter-spacing:2px;text-transform:uppercase;width:38%;font-weight:600}
.exa-mk .dtable tr:last-child td{border-bottom:none}
.exa-mk .dtable strong{color:var(--t1)}
.exa-mk .cta-section{background:linear-gradient(180deg,var(--bg) 0%,rgba(232,0,13,.03) 50%,var(--bg) 100%)}
.exa-mk .cta-btn{display:inline-flex;align-items:center;gap:8px;padding:16px 36px;background:var(--r);color:#fff;border-radius:10px;font-family:var(--hd);font-weight:700;font-size:16px;letter-spacing:1px;text-transform:uppercase;transition:all .3s;box-shadow:0 4px 24px var(--r-glow)}
.exa-mk .cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 40px var(--r-glow);background:#ff1a1a}
.exa-mk .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;padding:16px 36px;background:transparent;color:#fff;border-radius:10px;font-family:var(--hd);font-weight:500;font-size:16px;letter-spacing:.5px;border:1px solid var(--brd2);transition:all .3s}
.exa-mk .cta-btn-outline:hover{border-color:var(--r);color:var(--r)}
.exa-mk .metric-pill{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:var(--surf);border:1px solid var(--brd);border-radius:10px;transition:all .3s}
.exa-mk .metric-pill:hover{border-color:rgba(232,0,13,.15)}
.exa-mk .metric-pill .label{font-size:13px;color:var(--t2)}
.exa-mk .metric-pill .value{font-family:var(--hd);font-weight:700;font-size:15px;letter-spacing:.3px}
.exa-mk .icp-card{padding:clamp(24px,3vw,40px);position:relative}
.exa-mk .icp-icon{font-size:32px;margin-bottom:14px;opacity:.85}
.exa-mk .icp-title{font-family:var(--hd);font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.exa-mk .icp-pain{font-size:13px;color:var(--t2);line-height:1.7;margin-bottom:14px}
.exa-mk .icp-phrase{font-family:var(--hd);font-size:14px;font-weight:600;color:var(--r);font-style:italic;letter-spacing:.3px}
.exa-mk .screenshot-row{display:flex;gap:20px;overflow-x:auto;padding:0 0 16px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.exa-mk .screenshot-row::-webkit-scrollbar{height:3px}
.exa-mk .screenshot-row::-webkit-scrollbar-track{background:var(--surf)}
.exa-mk .screenshot-row::-webkit-scrollbar-thumb{background:var(--r);border-radius:2px}
.exa-mk .screenshot-item{flex:0 0 min(80vw,400px);scroll-snap-align:start}
.exa-mk footer{border-top:1px solid var(--brd);padding:48px 0;text-align:center}
.exa-mk footer p{font-size:12px;color:var(--t3);letter-spacing:.3px}
.exa-mk .ph-vertical{aspect-ratio:9/16;background:linear-gradient(160deg,#1a0408 0%,#0b0b12 60%,#07070c 100%);display:flex;align-items:center;justify-content:center;color:rgba(232,0,13,.35);font-family:var(--hd);font-size:14px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
.exa-mk .ph-horizontal{aspect-ratio:16/10;background:linear-gradient(135deg,#180408 0%,#0b0b12 60%);display:flex;align-items:center;justify-content:center;color:rgba(232,0,13,.4);font-family:var(--hd);font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
`;

// ============================================================
// Reveal wrapper using IntersectionObserver
// ============================================================
function Reveal({ children, delay, as: As = 'div', className = '', ...rest }: any) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setVisible(true); io.disconnect(); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const delayClass = delay ? ` reveal-d${delay}` : '';
  return (
    <As ref={ref as any} className={`reveal${delayClass} ${visible ? 'visible' : ''} ${className}`} {...rest}>
      {children}
    </As>
  );
}

// ============================================================
// Building Card with photo + initials fallback
// ============================================================
function BuildingCard({ p }: { p: Predio }) {
  const initials = useMemo(() => getInitials(p.nome), [p.nome]);
  const hasPhoto = !!(p.fotoUrl && p.fotoUrl.startsWith('http'));
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = hasPhoto && !imgFailed;
  return (
    <div className="bld-card">
      {showPhoto ? (
        <img className="bld-photo" src={p.fotoUrl} alt={p.nome} loading="lazy" onError={() => setImgFailed(true)} />
      ) : (
        <div className="bld-placeholder">
          <span className="bld-initial">{initials}</span>
          <span className="bld-icon">ponto ativo</span>
        </div>
      )}
      <div className="bld-info">
        <div className="bld-name">{p.nome}</div>
        <div className="bld-addr">{p.bairro || 'Foz do Iguaçu'}</div>
        <div className="bld-tags">
          {p.unidades ? <span className="bld-tag">{p.unidades} un</span> : null}
          {p.andares ? <span className="bld-tag">{p.andares} and</span> : null}
          {p.temAirbnb ? <span className="bld-tag bld-tag-airbnb">Airbnb</span> : null}
          <span className="bld-tag bld-tag-active">Ativo</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Catalog section with live API + fallback
// ============================================================
function CatalogoSection() {
  const [predios, setPredios] = useState<Predio[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/catalogo-predios`);
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        const active: Predio[] = (d.predios || []).filter(
          (p: Predio) => p.statusGroup === 'ativo' || p.statusGroup === 'instalacao'
        );
        if (!cancelled) setPredios(active.length ? active : FALLBACK_BUILDINGS);
      } catch (e) {
        console.warn('[catalogo-clientes] API indisponivel, usando fallback:', e);
        if (!cancelled) setPredios(FALLBACK_BUILDINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => predios ? sortBuildings(predios) : [], [predios]);
  const totalUnidades = useMemo(() => sorted.reduce((s, p) => s + (p.unidades || 0), 0), [sorted]);
  const totalPessoas = useMemo(() => Math.round(totalUnidades * 2.5), [totalUnidades]);

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setStatsVisible(true); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [predios]);

  const ativos = useCountUp(sorted.length, statsVisible && !loading);
  const unid = useCountUp(totalUnidades, statsVisible && !loading);
  const pess = useCountUp(totalPessoas, statsVisible && !loading);

  return (
    <section id="predios">
      <div className="container section-pad">
        <Reveal as="div" className="eyebrow">Rede Ativa</Reveal>
        <Reveal as="h2" className="h2" delay={1}>Catálogo de <span className="red">Prédios</span></Reveal>
        <Reveal as="p" className="body-text" delay={2} style={{ marginBottom: 24, maxWidth: 600 }}>
          Todos os edifícios com painéis EXA instalados e ativos. A rede que faz sua marca virar rotina.
        </Reveal>
        <Reveal delay={2}>
          <div ref={statsRef} style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '14px 24px', textAlign: 'center', minWidth: 120 }}>
              <div className="stat-num" style={{ fontSize: 36 }}>{loading ? '—' : ativos}</div>
              <div className="stat-label">Ativos</div>
            </div>
            <div className="card" style={{ padding: '14px 24px', textAlign: 'center', minWidth: 120 }}>
              <div className="stat-num" style={{ fontSize: 36 }}>{loading ? '—' : unid.toLocaleString('pt-BR')}</div>
              <div className="stat-label">Unidades</div>
            </div>
            <div className="card" style={{ padding: '14px 24px', textAlign: 'center', minWidth: 120 }}>
              <div className="stat-num" style={{ fontSize: 36 }}>{loading ? '—' : `~${(pess / 1000).toFixed(1)} mil`}</div>
              <div className="stat-label">Pessoas</div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={3}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
              <div className="spinner" />
              <span style={{ color: 'var(--t3)', fontSize: 13, fontFamily: 'var(--hd)', letterSpacing: 1 }}>
                Carregando prédios ativos...
              </span>
            </div>
          ) : (
            <div className="bld-grid">
              {sorted.map((p, i) => <BuildingCard key={p.id || `${p.nome}-${i}`} p={p} />)}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function CatalogoClientes() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const WPP_PRINCIPAL = 'https://wa.me/5545991415856';
  const WPP_JENNI = 'https://wa.me/5545998323225';

  return (
    <>
      <Helmet>
        <title>Mídia Kit 2025 | EXA Mídia — Sua marca na rotina dele</title>
        <meta name="description" content="A única mídia que fala com o mesmo cliente, todos os dias. 23 pontos ativos em elevadores residenciais premium de Foz do Iguaçu." />
        <link rel="canonical" href="https://examidia.com.br/catalogo-clientes" />
        <meta property="og:title" content="Mídia Kit 2025 | EXA Mídia" />
        <meta property="og:description" content="Sua marca na rotina dele. 23 pontos ativos em elevadores residenciais premium." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://examidia.com.br/catalogo-clientes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap"
          rel="stylesheet"
        />
        <style>{PAGE_CSS}</style>
      </Helmet>

      <div className="exa-mk">
        {/* NAVBAR */}
        <nav className={`topnav ${scrolled ? 'scrolled' : ''}`}>
          <div className="logo"><span className="logo-dot" />EXA</div>
          <div className="nav-links">
            <a href="#ideia">A Ideia</a>
            <a href="#metricas">Métricas</a>
            <a href="#predios">Prédios</a>
            <a href="#plataforma">Plataforma</a>
            <a href="#clientes">Para quem</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={WPP_PRINCIPAL} target="_blank" rel="noopener noreferrer" className="nav-cta">Fale Conosco</a>
        </nav>

        {/* HERO */}
        <section className="hero" id="hero">
          <div className="hero-bg" />
          <div className="hero-overlay" />
          <div className="hero-accent" />
          <div className="glow" style={{ width: 700, height: 700, right: -300, bottom: -200, opacity: 0.1 }} />
          <div className="container">
            <Reveal className="hero-badge">Mídia Kit 2025</Reveal>
            <Reveal as="h1" className="h1" delay={1} style={{ marginBottom: 16 }}>
              Sua marca na<br /><span className="red">rotina dele.</span>
            </Reveal>
            <Reveal as="p" className="sub" delay={2} style={{ marginBottom: 0, fontSize: 'clamp(16px,1.8vw,21px)', maxWidth: 480 }}>
              A única mídia que fala com o mesmo cliente, todos os dias. Dentro do elevador onde ele mora.
            </Reveal>
            <Reveal delay={3} className="hero-metric">
              <span className="hero-metric-num">40x</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-metric-label">por semana</span>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--hd)', letterSpacing: '.5px' }}>
                  mesmo morador, mesma marca
                </span>
              </div>
            </Reveal>
            <Reveal delay={4} style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#predios" className="cta-btn">Ver Prédios Ativos</a>
              <a href="#contato" className="cta-btn-outline">Falar com a EXA →</a>
            </Reveal>
          </div>
          <div className="hero-scroll"><span>Scroll</span><div className="hero-scroll-line" /></div>
        </section>

        {/* A DOR */}
        <section className="quote-section" style={{ background: 'var(--bg2)' }}>
          <div className="glow" style={{ width: 500, height: 500, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.04 }} />
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <Reveal className="eyebrow" style={{ color: 'var(--t3)' }}>O problema que ninguém fala</Reveal>
            <Reveal as="p" className="quote-big" delay={1} style={{ color: 'var(--t2)' }}>
              Você <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>não precisa aparecer para mais gente.</span>
            </Reveal>
            <Reveal as="p" className="quote-big" delay={2} style={{ marginTop: 8 }}>
              Precisa aparecer <span className="red">mais vezes</span> para a <span className="red">gente certa.</span>
            </Reveal>
            <Reveal className="red-line" delay={3} style={{ margin: '28px auto' }} />
            <Reveal as="p" className="body-text" delay={4} style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
              O mercado de mídia vende alcance — número grande, gráfico bonito. Mas ver uma vez não constrói nada. A decisão de compra nasce de <strong style={{ color: '#fff' }}>repetição sobre a pessoa certa</strong>. E é isso que a EXA entrega.
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* A IDEIA */}
        <section id="ideia">
          <div className="container section-pad">
            <div className="grid g2" style={{ alignItems: 'center', gap: 'clamp(32px,5vw,80px)' }}>
              <div>
                <Reveal className="eyebrow">A Ideia</Reveal>
                <Reveal as="h2" className="h2" delay={1}>Onde não existe scroll, existe <span className="red">atenção.</span></Reveal>
                <Reveal className="red-line" delay={2} />
                <Reveal as="p" className="body-text" delay={3} style={{ marginBottom: 14 }}>
                  No elevador, o morador encontra silêncio, pausa e foco. Não tem celular na mão, não tem feed para rolar, não tem concorrência visual.
                </Reveal>
                <Reveal as="p" className="body-text" delay={4}>
                  <strong style={{ color: '#fff' }}>A EXA faz sua marca virar rotina.</strong> O mesmo morador vê a sua marca ~40 vezes por semana. Repetição vira familiaridade. Familiaridade vira preferência. Preferência vira venda.
                </Reveal>
              </div>
              <Reveal delay={3}>
                <div className="frame"><div className="ph-vertical" style={{ aspectRatio: '3/4' }}>EXA Player</div></div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* QUEM SOMOS */}
        <section style={{ background: 'var(--bg2)' }} id="sobre">
          <div className="container section-pad">
            <div className="grid g2" style={{ alignItems: 'center', gap: 'clamp(32px,5vw,80px)' }}>
              <Reveal delay={2}>
                <div className="frame"><div className="ph-vertical" style={{ aspectRatio: '3/4' }}>EXA no Elevador</div></div>
              </Reveal>
              <div>
                <Reveal className="eyebrow">Quem somos</Reveal>
                <Reveal as="h2" className="h2" delay={1}>A primeira. <span className="red">A única.</span></Reveal>
                <Reveal className="red-line" delay={2} />
                <Reveal as="p" className="body-text" delay={3}>
                  A EXA é a primeira rede de mídia indoor nos elevadores dos prédios residenciais premium de Foz do Iguaçu — a tecnologia que as grandes capitais já têm, agora dentro de casa do seu cliente.
                </Reveal>
                <Reveal as="p" className="body-text" delay={4} style={{ marginTop: 14 }}>
                  Não vendemos espaço em tela. Vendemos <strong style={{ color: '#fff' }}>presença diária</strong> para empresas que querem se posicionar dentro do mundo verticalizado de Foz.
                </Reveal>
                <Reveal delay={5} style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div><div className="stat-num" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>23</div><div className="stat-label">Pontos ativos</div></div>
                  <div><div className="stat-num" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>1ª</div><div className="stat-label">É única em Foz</div></div>
                  <div><div className="stat-num" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>27"</div><div className="stat-label">Telas Full HD</div></div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* MECANISMO */}
        <section>
          <div className="container section-pad">
            <Reveal className="eyebrow">O Mecanismo</Reveal>
            <Reveal as="h2" className="h2" delay={1} style={{ marginBottom: 12 }}>Por que o elevador <span className="red">funciona</span></Reveal>
            <Reveal as="p" className="sub" delay={2} style={{ marginBottom: 32 }}>
              O único lugar onde a atenção é garantida. Sem scroll. Sem skip. Sem concorrência.
            </Reveal>
            <div className="grid g2" style={{ gap: 20 }}>
              <div>
                <Reveal className="card" delay={2} style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', letterSpacing: 3, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Rotina do Elevador</div>
                  <p className="body-text">Um morador usa o elevador em média <strong style={{ color: '#fff' }}>6 a 8 vezes por dia</strong>. Isso representa <strong style={{ color: 'var(--r)' }}>~40 visualizações semanais</strong> da tela — com a mesma marca, a mesma pessoa.</p>
                </Reveal>
                <Reveal className="card" delay={3}>
                  <div style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', letterSpacing: 3, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Atenção Cativa</div>
                  <p className="body-text"><strong style={{ color: 'var(--r)' }}>90%</strong> dos anúncios digitais são ignorados. No elevador, a taxa de atenção é superior a <strong style={{ color: '#fff' }}>95%</strong>. Não existe ad blocker para o elevador.</p>
                </Reveal>
              </div>
              <div>
                <Reveal className="card" delay={2} style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', letterSpacing: 3, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Perfil do Público</div>
                  <p className="body-text">25 a 55 anos. Classes A/B. <strong style={{ color: '#fff' }}>71%</strong> tomam decisões de compra para a família. <strong style={{ color: '#fff' }}>62%</strong> viajam internacionalmente ao menos 1x ao ano.</p>
                </Reveal>
                <Reveal className="card" delay={3}>
                  <div style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', letterSpacing: 3, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Comportamento Local</div>
                  <p className="body-text"><strong style={{ color: '#fff' }}>87%</strong> dos moradores preferem comprar em comércio próximo de casa. <strong style={{ color: '#fff' }}>78%</strong> acreditam que negócios de bairro fortalecem a cidade.</p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* 5 PILARES */}
        <section style={{ background: 'var(--bg2)' }} id="diferenciais">
          <div className="container section-pad">
            <div className="grid g2" style={{ alignItems: 'start', gap: 'clamp(32px,5vw,80px)' }}>
              <div>
                <Reveal className="eyebrow">5 Pilares</Reveal>
                <Reveal as="h2" className="h2" delay={1}>Por que a EXA é <span className="red">diferente</span></Reveal>
                <Reveal className="red-line" delay={2} />
                <Reveal as="p" className="body-text" delay={3}>
                  Não é "mais uma opção de mídia". É a única que junta: mesmo cliente + todos os dias + sem concorrência.
                </Reveal>
              </div>
              <div className="num-list">
                {[
                  ['01', 'Somos os únicos', 'Não existe concorrente direto em prédios residenciais de Foz. Quem anuncia na EXA ocupa um espaço que ninguém mais pode dividir.'],
                  ['02', 'Repetição diária', '~40 vezes por semana. A repetição cria familiaridade. Familiaridade cria preferência. Preferência gera venda.'],
                  ['03', 'Criação própria', 'A EXA não só vende espaço — cria os vídeos dos clientes internamente. Peças feitas para gerar resultado real.'],
                  ['04', 'Tecnologia de capital, em Foz', 'Vídeo programável por horário. Plataforma com IA e automação. O padrão de mídia indoor que só existia em SP e Curitiba.'],
                  ['05', 'Telas que o morador quer olhar', 'Notícias, avisos do condomínio, clima, câmbio, Copa do Mundo 2026 e Wi-Fi gratuito. O morador olha porque é útil — e a marca entra junto.'],
                ].map(([n, h, p], i) => (
                  <Reveal key={n} className="num-item" delay={i as any}>
                    <div className="num-badge">{n}</div>
                    <div><h4>{h}</h4><p>{p}</p></div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* MÉTRICAS */}
        <section id="metricas">
          <div className="container section-pad" style={{ textAlign: 'center' }}>
            <Reveal className="eyebrow">A Prova</Reveal>
            <Reveal as="h2" className="h2" delay={1}>Números <span className="red">reais</span></Reveal>
            <Reveal as="p" className="sub" delay={2} style={{ margin: '0 auto 40px', textAlign: 'center' }}>
              Não é projeção. É rede operando hoje em Foz do Iguaçu.
            </Reveal>
            <Reveal delay={3} className="grid g4" style={{ marginBottom: 24 }}>
              {[['23', 'Pontos ativos'], ['245', 'Exibições diárias'], ['91%', 'Aprovação moradores'], ['+23mil', 'Pessoas alcançadas']].map(([n, l]) => (
                <div key={l} className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
                  <div className="stat-num" style={{ fontSize: 'clamp(40px,5vw,60px)' }}>{n}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </Reveal>
            <Reveal className="card" delay={4} style={{ maxWidth: 600, margin: '0 auto', padding: '24px 32px', borderColor: 'rgba(232,0,13,.12)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--hd)', fontSize: 'clamp(48px,8vw,80px)', fontWeight: 900, color: 'var(--r)', lineHeight: 1, letterSpacing: '-.03em' }}>~40x</div>
              <div style={{ fontFamily: 'var(--hd)', fontSize: 14, color: 'var(--t2)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
                por semana, o mesmo morador vê a mesma marca
              </div>
              <p className="body-text" style={{ marginTop: 12, maxWidth: 440, display: 'inline-block' }}>
                Nenhuma outra mídia em Foz entrega essa frequência sobre o mesmo público.
              </p>
            </Reveal>
          </div>
        </section>

        {/* PRESENÇA */}
        <section style={{ background: 'var(--bg2)' }}>
          <div className="container section-pad">
            <Reveal className="eyebrow">Cobertura</Reveal>
            <Reveal as="h2" className="h2" delay={1}>Presença nos <span className="red">Prédios</span></Reveal>
            <Reveal as="p" className="body-text" delay={2} style={{ marginBottom: 32, maxWidth: 600 }}>
              A EXA está presente em 23 edifícios residenciais premium de Foz do Iguaçu. Cada prédio é um ponto de mídia ativo.
            </Reveal>
            <Reveal delay={3} className="grid g4" style={{ gap: 12 }}>
              {['Barcelona', 'Cheverny', 'Riverside', 'Royal Legacy'].map(n => (
                <div key={n} className="frame"><div className="ph-vertical">Painel {n}</div></div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* CATÁLOGO DINÂMICO */}
        <CatalogoSection />

        <div className="divider" />

        {/* PERFORMANCE */}
        <section style={{ background: 'var(--bg2)' }}>
          <div className="container section-pad">
            <div className="grid g2" style={{ alignItems: 'center', gap: 'clamp(32px,5vw,80px)' }}>
              <div>
                <Reveal className="eyebrow">Performance</Reveal>
                <Reveal as="h2" className="h2" delay={1}>Métricas de <span className="red">resultado</span></Reveal>
                <Reveal className="red-line" delay={2} />
                <Reveal as="p" className="body-text" delay={3}>
                  Marketing de resultado não nasce de ser visto uma vez por muita gente — nasce de ser visto muitas vezes pela pessoa certa. Cada campanha é mensurável e acompanhada em tempo real.
                </Reveal>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Frequência', '~40x por semana', true],
                  ['Exibições', '245 por dia', true],
                  ['Exposição', '10 a 30 segundos', false],
                  ['Lembrança', '70% espontânea', true],
                  ['Segmentação', 'Horário e perfil', false],
                  ['CPM', 'Menor da região', true],
                ].map(([l, v, red], i) => (
                  <Reveal key={l as string} className="metric-pill" delay={i as any}>
                    <span className="label">{l}</span>
                    <span className={`value${red ? ' red' : ''}`}>{v}</span>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* VÍDEO PROGRAMÁVEL */}
        <section>
          <div className="container section-pad">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Reveal className="eyebrow">Vídeo Programável</Reveal>
              <Reveal as="h2" className="h2" delay={1}>Até <span className="red">10 vídeos</span> por campanha</Reveal>
              <Reveal as="p" className="sub" delay={2} style={{ margin: '12px auto 0', textAlign: 'center' }}>
                Crie uma linha de comunicação diária com os moradores. Cada vídeo para um momento, um objetivo, uma mensagem.
              </Reveal>
            </div>
            <div className="grid g2" style={{ alignItems: 'start', gap: 'clamp(32px,5vw,60px)' }}>
              <div>
                <Reveal as="h3" className="h3" style={{ marginBottom: 20, fontSize: 18 }}>
                  Exemplo de <span className="red">estratégia semanal</span>
                </Reveal>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Manhã', 'Vídeo 1 — "Bom dia! Café fresquinho esperando você" (cafeteria parceira)'],
                    ['Almoço', 'Vídeo 2 — Delivery do restaurante com prato do dia + QR Code para pedir'],
                    ['Tarde', 'Vídeo 3 — Clínica estética: "Agende sua avaliação" com QR para WhatsApp'],
                    ['Noite', 'Vídeo 4 — Finanças: "Invista seu 13º com segurança"'],
                    ['Fds', 'Vídeo 5 — Promoção exclusiva de fim de semana + cupom com QR Code'],
                  ].map(([t, d], i) => (
                    <Reveal key={t} className="card" delay={i as any} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', fontWeight: 800, letterSpacing: 1, minWidth: 70, textTransform: 'uppercase' }}>{t}</span>
                      <span style={{ fontSize: 13, color: 'var(--t2)' }}>{d}</span>
                    </Reveal>
                  ))}
                </div>
                <Reveal className="card" delay={5} style={{ marginTop: 16, padding: 16, borderColor: 'rgba(232,0,13,.12)' }}>
                  <div style={{ fontFamily: 'var(--hd)', fontSize: 11, color: 'var(--r)', letterSpacing: 3, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                    O que você pode fazer com 10 vídeos
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['QR Codes interativos', 'Cupons de desconto', 'Promoções por horário', 'Vídeos por dia da semana', 'Lançamentos', 'Conteúdo sazonal', 'Mensagens de fidelidade', 'Cardápios rotativos'].map(t => (
                      <span key={t} className="bld-tag">{t}</span>
                    ))}
                  </div>
                </Reveal>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Reveal delay={2}><div className="frame"><div className="ph-horizontal">Agendamento por horário</div></div></Reveal>
                <Reveal delay={3}><div className="frame"><div className="ph-horizontal">Até 10 vídeos por pedido</div></div></Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* COMO ANUNCIAR */}
        <section style={{ background: 'var(--bg2)' }}>
          <div className="container section-pad">
            <Reveal className="eyebrow">Passo a passo</Reveal>
            <Reveal as="h2" className="h2" delay={1} style={{ marginBottom: 32 }}>
              Entre na rotina <span className="red">do seu cliente</span>
            </Reveal>
            <div className="grid g2" style={{ gap: 'clamp(32px,5vw,80px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {[
                  ['Passo 01', 'Escolha os prédios', 'Selecione os edifícios ou regiões onde deseja aparecer. Todos geolocalizados e segmentados por perfil de moradores.'],
                  ['Passo 02', 'Defina o período', 'Escolha data de início e fim, duração dos vídeos (10s, 15s ou 30s) e horários de exibição.'],
                  ['Passo 03', 'Envie ou crie o material', 'Upload direto pela plataforma ou use nosso departamento de criação para produzir o vídeo do zero.'],
                  ['Passo 04', 'Acompanhe em tempo real', 'A campanha entra no ar em minutos. Acompanhe exibições, alcance e frequência direto no painel.'],
                ].map(([n, h, p], i) => (
                  <Reveal key={n} className="step" delay={i as any}>
                    <div className="step-num">{n}</div>
                    <h4>{h}</h4>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="frame"><div className="ph-horizontal">Loja EXA</div></div>
                <div className="frame"><div className="ph-horizontal">Mapa EXA</div></div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* PLATAFORMA */}
        <section id="plataforma">
          <div className="container section-pad">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <Reveal className="eyebrow">Plataforma</Reveal>
              <Reveal as="h2" className="h2" delay={1}>Controle <span className="red">total</span></Reveal>
              <Reveal className="red-line" delay={2} style={{ margin: '20px auto' }} />
            </div>
            <Reveal delay={3} className="screenshot-row">
              {['Agendar — defina hora e dia', 'Vídeos — até 10 por pedido', 'Ao vivo — veja no elevador', 'Resultados — no portal'].map(t => (
                <div key={t} className="screenshot-item">
                  <div className="frame"><div className="ph-horizontal">{t.split('—')[0]}</div></div>
                  <p style={{ fontFamily: 'var(--hd)', fontSize: 13, color: 'var(--t2)', marginTop: 12, textAlign: 'center', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                    {t}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* VERTICAIS */}
        <section>
          <div className="container section-pad" style={{ textAlign: 'center' }}>
            <Reveal className="eyebrow">Segmentos</Reveal>
            <Reveal as="h2" className="h2" delay={1}>Verticais <span className="red">EXA</span></Reveal>
            <Reveal as="p" className="sub" delay={2} style={{ margin: '0 auto 40px' }}>
              Cada elevador é um ponto de mídia inevitável.
            </Reveal>
            <Reveal delay={3} className="grid g3" style={{ maxWidth: 900, margin: '0 auto' }}>
              {[
                ['63%', 'Residenciais', '21,6 milhões de impactos/semana', false],
                ['37%', 'Comerciais', '12,8 milhões de impactos/semana', false],
                ['34M+', 'Rede Premium', 'Impactos totais por semana', true],
              ].map(([n, h, p, hl]) => (
                <div key={h as string} className="card" style={{ textAlign: 'center', padding: '32px 20px', borderColor: hl ? 'rgba(232,0,13,.12)' : undefined }}>
                  <div className="stat-num" style={{ fontSize: 'clamp(36px,4vw,48px)' }}>{n}</div>
                  <h4 style={{ fontFamily: 'var(--hd)', margin: '10px 0 6px', fontSize: 16, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</h4>
                  <p style={{ fontSize: 12, color: 'var(--t3)' }}>{p}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* PERFIL */}
        <section style={{ background: 'var(--bg2)' }}>
          <div className="container section-pad">
            <div className="grid g2" style={{ alignItems: 'center', gap: 'clamp(32px,5vw,80px)' }}>
              <div>
                <Reveal className="eyebrow">Audiência</Reveal>
                <Reveal as="h2" className="h2" delay={1}>Perfil do <span className="red">Público</span></Reveal>
                <Reveal className="red-line" delay={2} />
                <Reveal as="p" className="body-text" delay={3}>
                  Moradores de padrão B, B+ e A — pessoas com poder de compra real e papel de decisão nas compras da família. Parte da rede inclui prédios com Airbnb, ampliando o alcance para turistas com alta intenção de consumo.
                </Reveal>
              </div>
              <Reveal className="card" delay={3}>
                <table className="dtable">
                  <tbody>
                    <tr><td>Faixa etária</td><td><strong>25 a 55 anos</strong></td></tr>
                    <tr><td>Classe social</td><td><strong>A1, A2, B1, B2</strong></td></tr>
                    <tr><td>Decisores</td><td><strong style={{ color: 'var(--r)' }}>78%</strong> participam das decisões</td></tr>
                    <tr><td>Estilo</td><td>Urbano, conectado e aspiracional</td></tr>
                    <tr><td>Interesses</td><td>Tecnologia, bem-estar, estética, experiências</td></tr>
                    <tr><td>Airbnb</td><td>Turistas internacionais em prédios da rede</td></tr>
                  </tbody>
                </table>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* PARA QUEM */}
        <section id="clientes">
          <div className="container section-pad">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Reveal className="eyebrow">Para quem a EXA é a 1ª escolha</Reveal>
              <Reveal as="h2" className="h2" delay={1}>Sua empresa <span className="red">aqui</span></Reveal>
              <Reveal as="p" className="sub" delay={2} style={{ margin: '12px auto 0', textAlign: 'center' }}>
                Três perfis de cliente onde a EXA entrega mais resultado que qualquer outra mídia.
              </Reveal>
            </div>
            <Reveal delay={3} className="grid g3">
              {[
                { icon: '🛍', title: 'Comércio de Fronteira', pain: 'Atacado e varejo que vende para turista e morador que cruza para o Paraguai. Precisa ser lembrado antes do cliente atravessar a ponte.', phrase: '"Apareça antes do seu cliente cruzar a ponte."', hl: false },
                { icon: '💎', title: 'Negócio Premium Local', pain: 'Imobiliária, clínica, restaurante, construtora. O cliente é de alto valor e difícil de mirar — mídia de massa queima verba na gente errada.', phrase: '"Sua marca dentro do prédio onde seu cliente mora."', hl: true },
                { icon: '🔁', title: 'Negócio de Recorrência', pain: 'Delivery, farmácia, pet shop, supermercado. Vive de ser lembrado no momento exato da necessidade — precisa de presença constante.', phrase: '"Seja lembrado toda vez que ele pensar em pedir."', hl: false },
              ].map(c => (
                <div key={c.title} className="card icp-card" style={c.hl ? { borderColor: 'rgba(232,0,13,.12)' } : undefined}>
                  <div className="icp-icon">{c.icon}</div>
                  <div className="icp-title">{c.title}</div>
                  <p className="icp-pain">{c.pain}</p>
                  <p className="icp-phrase">{c.phrase}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section style={{ background: 'var(--bg2)' }}>
          <div className="container section-pad">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Reveal className="eyebrow">Fotos reais dos elevadores</Reveal>
              <Reveal as="h2" className="h2" delay={1}>Portfolio <span className="red">Visual</span></Reveal>
              <Reveal as="p" className="sub" delay={2} style={{ margin: '12px auto 0', textAlign: 'center' }}>
                Telas de 27" Full HD instaladas em elevadores reais.
              </Reveal>
            </div>
            <Reveal delay={3} className="grid g4" style={{ gap: 12 }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="frame"><div className="ph-vertical">Painel EXA</div></div>)}
            </Reveal>
            <Reveal delay={4} className="grid g4" style={{ gap: 12, marginTop: 12 }}>
              {[5, 6, 7, 8].map(i => <div key={i} className="frame"><div className="ph-vertical">Painel EXA</div></div>)}
            </Reveal>
            <Reveal delay={5} style={{ marginTop: 48, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--hd)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                Quer sua marca nessas telas?
              </p>
              <p className="body-text" style={{ marginBottom: 24 }}>Fale com a Jenni e comece a aparecer todos os dias.</p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                <a href={WPP_JENNI} target="_blank" rel="noopener noreferrer" className="cta-btn" style={{ fontSize: 14, padding: '14px 28px' }}>Falar com a Jenni no WhatsApp</a>
                <a href="https://examidia.com.br" target="_blank" rel="noopener noreferrer" className="cta-btn-outline" style={{ fontSize: 14, padding: '14px 28px' }}>Acessar a Loja EXA</a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PARCERIAS */}
        <section>
          <div className="container section-pad" style={{ textAlign: 'center' }}>
            <Reveal className="eyebrow">Credibilidade</Reveal>
            <Reveal as="h2" className="h2" delay={1}>Parcerias e <span className="red">Governança</span></Reveal>
            <Reveal className="red-line" delay={2} style={{ margin: '20px auto' }} />
            <Reveal as="p" className="sub" delay={3} style={{ margin: '0 auto 36px' }}>
              A EXA é construída sobre pilares de governança e transparência. O projeto tem apoio institucional que reforça a solidez.
            </Reveal>
            <Reveal delay={4} className="grid g2" style={{ maxWidth: 700, margin: '0 auto' }}>
              <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
                <div style={{ fontFamily: 'var(--hd)', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: 2 }}>SECOVI-PR</div>
                <h4 style={{ fontFamily: 'var(--hd)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Apoio Institucional</h4>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>Fortalece a credibilidade e o vínculo com o setor condominial.</p>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
                <div style={{ fontFamily: 'var(--hd)', fontSize: 48, fontWeight: 900, color: 'var(--r)', marginBottom: 16, lineHeight: 1 }}>23</div>
                <h4 style={{ fontFamily: 'var(--hd)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Prédios Parceiros</h4>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>Edifícios que abrigam as telas EXA e garantem acesso ao público premium.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* QUOTE FINAL */}
        <section className="quote-section">
          <div className="container">
            <Reveal as="p" className="quote-big" style={{ maxWidth: 800 }}>
              <span className="xmira">Repetição vira familiaridade.</span><br />
              Familiaridade vira <span className="red">preferência.</span><br />
              Preferência vira <span className="red">venda.</span>
            </Reveal>
          </div>
        </section>

        {/* CONTATO */}
        <section className="cta-section" id="contato">
          <div className="glow" style={{ width: 700, height: 700, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.06 }} />
          <div className="container section-pad" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Reveal className="eyebrow">Vamos conversar</Reveal>
            <Reveal as="h2" className="h2" delay={1} style={{ maxWidth: 800, margin: '0 auto 12px' }}>
              Entre na rotina <span className="red">do seu cliente.</span>
            </Reveal>
            <Reveal as="p" className="sub" delay={2} style={{ margin: '0 auto 28px', textAlign: 'center' }}>
              A EXA não te coloca na frente do cliente uma vez. Coloca todos os dias.
            </Reveal>
            <Reveal delay={3} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <a href={WPP_JENNI} target="_blank" rel="noopener noreferrer" className="cta-btn">Falar com a Jenni</a>
              <a href="https://examidia.com.br" target="_blank" rel="noopener noreferrer" className="cta-btn-outline">Acessar a Loja EXA</a>
            </Reveal>
            <Reveal as="p" delay={3} style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 28, fontFamily: 'var(--hd)', letterSpacing: '.5px' }}>
              Jenni — Consultora Comercial EXA — (45) 99832-3225
            </Reveal>
            <Reveal delay={5} style={{ marginTop: 24, fontSize: 13, color: 'var(--t3)', display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', fontFamily: 'var(--hd)', letterSpacing: '.5px' }}>
              <span>@examidia</span>
              <span>comercial@examidia.com.br</span>
              <span>www.examidia.com.br</span>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="logo" style={{ justifyContent: 'center' }}><span className="logo-dot" />EXA</div>
            <p style={{ fontFamily: 'var(--hd)', letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 }}>Sua marca na rotina dele.</p>
            <p>Foz do Iguaçu, PR — 2025</p>
          </div>
        </footer>
      </div>
    </>
  );
}
