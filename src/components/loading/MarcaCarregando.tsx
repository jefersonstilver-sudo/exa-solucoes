import React from 'react';

/**
 * Carregamento com a marca EXA (layout novo, aprovado no canvas "V2_Carregando").
 * O "exa" é desenhado pelo contorno, se preenche, ganha um brilho vermelho que passa por dentro
 * da marca e uma trilha vermelha corre embaixo. Versão clara (painel/site claro) e escura (login, telas escuras).
 * Só CSS + SVG (sem bibliotecas). Respeita "reduzir movimento".
 */

const D = "M158.41,323.91C154.96,323.74 151.95,323.56 149.77,323.38C97.55,319.19 53.38,294.28 26.63,253.92C15.04,236.43 7.08,216.52 3.06,194.93C1.14,184.60 0.29,175.58 0.17,164.18C0.10,157.23 0.20,153.35 0.61,148.05C3.39,111.39 16.92,78.67 40.03,52.74C42.19,50.31 49.43,43.09 51.80,40.99C65.44,28.92 80.45,19.64 97.44,12.78C119.20,3.99 143.25,-0.32 168.44,0.05C175.76,0.15 180.38,0.42 187.04,1.14C221.27,4.81 252.10,17.66 276.24,38.32C282.69,43.84 289.44,50.74 294.82,57.32C305.64,70.54 314.32,85.94 320.24,102.42C325.37,116.68 328.49,131.43 329.76,147.32C330.21,152.89 330.26,155.08 330.33,169.27L330.39,183.85L196.41,183.85C122.72,183.85 62.43,183.87 62.43,183.91C62.43,183.94 62.64,185.10 62.89,186.47C66.44,205.84 73.88,222.04 85.40,235.52C87.35,237.81 91.19,241.72 93.58,243.86C108.99,257.64 129.25,266.14 152.23,268.45C157.37,268.97 159.47,269.06 166.31,269.06C174.43,269.06 178.87,268.81 185.57,267.99C204.28,265.71 219.88,259.87 232.40,250.47C235.75,247.95 237.71,246.23 241.04,242.90C244.97,238.98 248.07,235.28 251.06,230.97L251.78,229.94L284.50,229.94C302.49,229.94 317.22,229.96 317.22,229.98C317.22,230.08 315.81,233.32 314.89,235.32C308.59,249.12 300.07,261.99 289.81,273.19C287.41,275.82 281.89,281.29 279.42,283.49C266.16,295.32 250.72,304.80 233.71,311.55C216.42,318.41 198.55,322.31 178.20,323.67C175.24,323.86 161.04,324.04 158.41,323.91ZM267.93,130.77C267.93,130.57 267.05,127.22 266.54,125.46C258.85,99.25 242.32,78.96 218.85,66.94C205.40,60.05 190.89,56.24 173.75,55.10C170.58,54.89 160.97,54.89 157.81,55.11C137.27,56.47 120.28,61.71 105.25,71.29C97.07,76.51 89.52,83.33 83.32,91.09C79.17,96.30 76.04,101.23 72.79,107.66C69.43,114.34 67.09,120.47 65.09,127.86C64.72,129.24 64.38,130.48 64.34,130.61C64.28,130.83 69.19,130.84 166.10,130.84C222.11,130.84 267.93,130.81 267.93,130.77ZM326.73,323.49C326.93,323.22 350.93,292.33 380.04,254.85C412.12,213.57 433.51,185.93 434.31,184.72C439.06,177.58 441.55,169.24 441.55,160.50C441.55,151.66 439.04,143.35 434.20,136.13C433.45,135.00 338.58,11.53 331.93,3.02L331.54,2.52L369.65,2.52L407.75,2.52L436.21,41.48C451.86,62.90 465.19,81.06 465.83,81.82C475.51,93.44 490.70,99.18 505.89,96.97C516.53,95.42 526.28,90.00 533.08,81.86C533.67,81.15 546.99,63.01 562.67,41.54L591.18,2.52L628.30,2.52C657.97,2.52 665.39,2.56 665.29,2.69C665.22,2.78 642.27,32.44 614.29,68.61C584.55,107.05 562.88,135.19 562.10,136.35C555.54,146.22 553.30,158.54 555.94,170.30C557.25,176.13 560.10,182.27 563.68,186.96C564.12,187.55 588.35,218.60 617.53,255.95C646.70,293.31 670.56,323.90 670.56,323.93C670.56,323.96 653.43,323.98 632.48,323.96L594.39,323.92L563.34,281.83C546.26,258.67 531.78,239.12 531.16,238.36C520.48,225.52 503.03,219.95 486.52,224.11C477.62,226.36 469.16,231.75 463.51,238.78C463.04,239.36 448.69,258.77 431.62,281.91L400.58,323.99L363.47,323.99L326.35,323.99L326.73,323.49ZM819.47,323.90C798.39,322.98 778.63,318.38 759.56,309.96C756.88,308.78 750.23,305.46 747.61,304.00C737.62,298.43 728.24,291.74 719.78,284.14C715.79,280.55 710.48,275.11 706.82,270.85C685.63,246.21 673.14,215.00 670.37,179.80C669.93,174.13 669.84,171.64 669.84,164.52C669.84,157.10 669.94,154.39 670.44,148.38C673.43,112.13 686.42,79.95 708.35,54.53C723.96,36.43 744.13,22.10 766.98,12.90C788.29,4.31 811.42,0.01 836.21,0.00C878.22,-0.00 915.72,12.61 944.47,36.40C949.21,40.32 955.76,46.61 959.72,51.04C973.69,66.66 983.99,84.60 990.84,105.21C996.16,121.21 999.09,137.77 999.87,156.22C999.95,158.20 1000.00,189.34 1000.00,241.66L1000.00,323.99L972.90,323.99L945.80,323.99L945.79,286.43L945.78,248.87L945.47,249.54C945.30,249.90 944.82,250.98 944.40,251.93C938.34,265.80 928.95,279.38 918.43,289.51C896.61,310.51 867.83,322.18 833.70,323.86C831.32,323.97 821.83,324.00 819.47,323.90ZM841.67,268.99C851.24,268.52 859.84,267.15 868.32,264.75C900.75,255.57 924.85,232.42 935.48,200.25C940.48,185.15 942.37,168.09 940.95,150.97C938.32,119.35 924.17,92.49 901.04,75.25C894.25,70.20 886.27,65.78 878.19,62.60C867.53,58.41 856.17,55.97 843.38,55.11C840.20,54.89 830.86,54.89 827.71,55.11C819.12,55.69 811.61,56.89 804.30,58.84C780.46,65.22 760.88,79.05 747.64,98.85C737.82,113.54 731.87,131.07 730.15,150.44C729.45,158.30 729.55,168.40 730.41,176.29C732.96,199.58 741.83,220.20 756.18,236.18C759.16,239.50 763.69,243.78 767.20,246.61C782.07,258.56 800.52,266.01 821.00,268.33C823.33,268.59 827.97,268.96 829.97,269.04C832.56,269.14 839.24,269.11 841.67,268.99Z";

const CSS = `
.exa-ld{display:flex;flex-direction:column;align-items:center;gap:var(--ld-gap,30px)}
.exa-ld .ld-logo{width:var(--ld-w,200px);height:auto;overflow:visible;animation:ld-rise 1.4s cubic-bezier(.2,.8,.2,1) both}
.exa-ld .ld-ln{fill:none;stroke:var(--ld-ink);stroke-width:3;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ld-draw 1.1s cubic-bezier(.65,0,.35,1) .1s forwards,ld-out .5s ease 1.15s forwards}
.exa-ld .ld-fl{fill:var(--ld-ink);opacity:0;animation:ld-in .6s ease .95s forwards}
.exa-ld .ld-sh{opacity:0;animation:ld-in .1s linear 1.5s forwards}
.exa-ld .ld-sh rect{animation:ld-sheen 2.4s cubic-bezier(.4,0,.2,1) 1.5s infinite}
.exa-ld .ld-track{position:relative;width:var(--ld-trilha,120px);height:2px;border-radius:2px;background:var(--ld-trilho);overflow:hidden;opacity:0;animation:ld-in .4s ease 1.3s forwards}
.exa-ld .ld-track span{position:absolute;top:0;left:-38%;height:100%;width:38%;border-radius:2px;background:#EA251D;box-shadow:0 0 12px rgba(234,37,29,.75);animation:ld-ride 1.3s cubic-bezier(.65,0,.35,1) 1.3s infinite}
.exa-ld .ld-track.prog span{left:0;animation:none;transition:width .3s}
.exa-ld-glow{position:absolute;left:50%;top:50%;width:520px;height:520px;max-width:120vw;max-height:120vw;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,var(--ld-glow),rgba(234,37,29,0));opacity:0;pointer-events:none;animation:ld-glowin 1.2s ease .6s forwards,ld-breathe 3.2s ease-in-out 1.8s infinite}
.exa-ld-msg{margin:0;font:600 13px Manrope,system-ui,sans-serif;color:var(--ld-txt);letter-spacing:.01em}
.exa-ld-tela{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--ld-bg);opacity:0;animation:ld-in .2s ease-out .2s forwards}
.exa-ld-bloco{position:relative;display:flex;align-items:center;justify-content:center;min-height:40vh;opacity:0;animation:ld-in .2s ease-out .2s forwards}
.exa-ld-claro{--ld-bg:#F4F1EC;--ld-ink:#17181A;--ld-trilho:rgba(23,24,26,.10);--ld-glow:rgba(234,37,29,.12);--ld-txt:#6A6B70}
.exa-ld-escuro{--ld-bg:#0B0B0D;--ld-ink:#FFFFFF;--ld-trilho:rgba(255,255,255,.12);--ld-glow:rgba(234,37,29,.22);--ld-txt:#9C9A96}
@keyframes ld-draw{to{stroke-dashoffset:0}}
@keyframes ld-in{to{opacity:1}}
@keyframes ld-out{to{opacity:0}}
@keyframes ld-glowin{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes ld-breathe{0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
@keyframes ld-sheen{0%{transform:translateX(-420px)}55%,100%{transform:translateX(1200px)}}
@keyframes ld-ride{0%{left:-38%}100%{left:100%}}
@keyframes ld-rise{from{transform:translateY(10px)}to{transform:none}}
@media (prefers-reduced-motion:reduce){
 .exa-ld .ld-ln{animation:none;opacity:0}
 .exa-ld .ld-fl{animation:none;opacity:1}
 .exa-ld-glow{animation:none;opacity:.8}
 .exa-ld .ld-track{animation:none;opacity:1}
 .exa-ld .ld-track span{animation:none;left:31%}
 .exa-ld .ld-sh rect,.exa-ld .ld-logo{animation:none}
}
`;

let idSeq = 0;

/** true dentro dos painéis (menu e topo já na tela): o carregamento vira um bloco, sem cobrir a tela inteira. */
export const DentroDoLayout = React.createContext(false);

export type TemaCarregando = 'claro' | 'escuro';

/** Só a marca animada (para usar dentro de qualquer área). */
export const MarcaCarregando: React.FC<{ largura?: number; progresso?: number | null; mensagem?: string }> = ({ largura = 200, progresso = null, mensagem }) => {
  const [id] = React.useState(() => `exaclip${++idSeq}`);
  return (
    <div className="exa-ld" style={{ ['--ld-w' as any]: `${largura}px`, ['--ld-trilha' as any]: `${Math.round(largura * 0.55)}px`, ['--ld-gap' as any]: `${Math.round(largura * 0.15)}px` }}>
      <style>{CSS}</style>
      <svg className="ld-logo" viewBox="-60 -60 1120 444.1" aria-hidden="true">
        <defs>
          <clipPath id={id}><path d={D} /></clipPath>
          <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#EA251D" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="ld-fl" d={D} />
        <path className="ld-ln" pathLength={1} d={D} />
        <g className="ld-sh" clipPath={`url(#${id})`}><rect x="0" y="-60" width="260" height="460" fill={`url(#${id}g)`} transform="skewX(-18)" /></g>
      </svg>
      <span className={`ld-track${progresso !== null ? ' prog' : ''}`} aria-hidden="true">
        <span style={progresso !== null ? { width: `${Math.max(4, Math.min(100, progresso))}%` } : undefined} />
      </span>
      {mensagem && <p className="exa-ld-msg">{mensagem}</p>}
    </div>
  );
};

/** Tela inteira de carregamento (aparece só depois de 200 ms, para não "piscar"). */
export const TelaCarregando: React.FC<{ tema?: TemaCarregando; mensagem?: string; progresso?: number | null }> = ({ tema = 'claro', mensagem, progresso = null }) => (
  <div className={`exa-ld-tela exa-ld-${tema}`} role="status" aria-live="polite" aria-label={mensagem || 'Carregando'}>
    <span className="exa-ld-glow" aria-hidden="true" />
    <MarcaCarregando largura={200} mensagem={mensagem} progresso={progresso} />
  </div>
);

/** Carregamento dentro de uma área (menu e cabeçalho continuam na tela). */
export const BlocoCarregando: React.FC<{ tema?: TemaCarregando; mensagem?: string; largura?: number }> = ({ tema = 'claro', mensagem, largura = 120 }) => (
  <div className={`exa-ld-bloco exa-ld-${tema}`} role="status" aria-live="polite" aria-label={mensagem || 'Carregando'}>
    <MarcaCarregando largura={largura} mensagem={mensagem} />
  </div>
);

/** Rotas com fundo escuro usam a versão escura. */
export const temaDaRota = (caminho: string): TemaCarregando =>
  /^\/(login|definir-senha|esqueci-senha|reset-password|redefinir-senha|verificacao-2fa)/i.test(caminho) ? 'escuro' : 'claro';
