/**
 * Passagem do login (escuro) para o painel (claro) sem o corte seco.
 *
 * No instante em que o login dá certo, uma "cortina" com o mesmo fundo do login cobre a tela e a marca EXA
 * fica exatamente onde estava no login. Quando a tela seguinte monta o logo dela (qualquer <img data-exa-marca>),
 * a marca voa até lá — encolhendo e trocando de cor para a do logo de destino — enquanto a cortina se abre.
 * Se a tela seguinte não tiver logo marcado (ex.: painel admin), a cortina só se abre.
 *
 * Mesma ideia da abertura do app (index.html #exa-pre), que usa o mesmo [data-exa-marca] como destino.
 */

const FUNDO =
  'radial-gradient(70% 55% at 50% -5%,rgba(234,37,29,.55),rgba(234,37,29,0) 70%),' +
  'radial-gradient(60% 45% at 50% 108%,rgba(158,16,20,.6),rgba(158,16,20,0) 70%),' +
  'linear-gradient(180deg,#1d0a0c,#0B0B0D 60%)';

const ESPERA_MAX = 4000; // ms esperando o logo da próxima tela aparecer
const VOO = 820;

function visivel(el: Element, fora: Element[]): el is HTMLImageElement {
  if (fora.some((f) => f === el || f.contains(el)) || el.closest('.exa-login')) return false;
  const r = el.getBoundingClientRect();
  const h = window.innerHeight || screen.height;
  const img = el as HTMLImageElement;
  return r.width > 8 && r.top > -4 && r.bottom < h + 4 && img.complete !== false && (img.naturalWidth || 1) > 0;
}

export function voarMarca(origem: Element | null) {
  if (typeof document === 'undefined' || !origem || document.getElementById('exa-voo-capa')) return;
  let reduz = false;
  try { reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* sem matchMedia */ }

  const r = origem.getBoundingClientRect();
  if (r.width < 8) return;
  try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch { /* nada */ }

  const html = document.documentElement;
  const capa = document.createElement('div');
  capa.id = 'exa-voo-capa';
  capa.setAttribute('aria-hidden', 'true');
  // altura da tela inteira (não da janela): o teclado fechando / a barra do Safari mudando não descobrem nada
  capa.style.cssText = `position:fixed;left:0;top:0;width:100%;height:${Math.max(window.innerHeight, screen.height)}px;z-index:2147482990;pointer-events:none;background:${FUNDO};opacity:1;transition:opacity .6s cubic-bezier(.4,0,.2,1)`;

  const marca = document.createElement('div');
  marca.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:2147482991;pointer-events:none;transform-origin:50% 50%;will-change:transform`;
  const branca = document.createElement('img');
  branca.src = (origem as HTMLImageElement).currentSrc || (origem as HTMLImageElement).src || '/site/exa-branco.svg';
  branca.alt = '';
  branca.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;transition:opacity .7s ease';
  marca.appendChild(branca);

  document.body.appendChild(capa);
  document.body.appendChild(marca);

  const fora: Element[] = [capa, marca, origem];
  const ini = Date.now();
  let acabou = false;

  const limpar = (ms: number) => {
    window.setTimeout(() => {
      html.classList.remove('exa-voo');
      capa.remove();
      marca.remove();
    }, ms);
  };

  const soAbre = () => {
    if (acabou) return;
    acabou = true;
    marca.style.transition = 'opacity .35s ease, transform .45s cubic-bezier(.4,0,.2,1)';
    marca.style.opacity = '0';
    marca.style.transform = 'scale(.94)';
    capa.style.opacity = '0';
    limpar(650);
  };

  const voa = (alvo: HTMLImageElement) => {
    if (acabou) return;
    acabou = true;
    const a = alvo.getBoundingClientRect();
    const b = marca.getBoundingClientRect();
    const s = a.height / b.height;
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    html.classList.add('exa-voo'); // esconde o logo de destino até a marca pousar nele

    // o logo de destino pode ter outra cor (ex.: vermelho no topo claro): troca durante o voo
    const destinoSrc = alvo.currentSrc || alvo.src;
    if (destinoSrc && destinoSrc !== branca.src) {
      const cor = document.createElement('img');
      cor.src = destinoSrc;
      cor.alt = '';
      cor.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .7s ease';
      marca.appendChild(cor);
      requestAnimationFrame(() => { cor.style.opacity = '1'; branca.style.opacity = '0'; });
    }
    const fim = `translate(${dx}px,${dy}px) scale(${s})`;
    if (marca.animate) marca.animate([{ transform: 'none' }, { transform: fim }], { duration: VOO, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    else { marca.style.transition = `transform ${VOO}ms cubic-bezier(.22,1,.36,1)`; void marca.offsetWidth; marca.style.transform = fim; }
    capa.style.opacity = '0';
    limpar(VOO + 40);
  };

  if (reduz) { window.setTimeout(soAbre, 200); return; }

  const procura = () => {
    if (acabou) return;
    const lista = Array.from(document.querySelectorAll('[data-exa-marca]'));
    const alvo = lista.find((el) => visivel(el, fora)) as HTMLImageElement | undefined;
    // espera um instante depois de a tela nova aparecer (as fontes e o topo assentam) antes de medir
    if (alvo) { window.setTimeout(() => voa(alvo), 120); return; }
    if (Date.now() - ini > ESPERA_MAX) { soAbre(); return; }
    requestAnimationFrame(procura);
  };
  // dá tempo da navegação trocar a tela
  window.setTimeout(procura, 60);
}
