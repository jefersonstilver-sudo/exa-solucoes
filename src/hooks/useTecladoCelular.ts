import { useEffect } from 'react';

/**
 * Teclado do celular (iPhone principalmente).
 * No Safari o teclado não diminui a página: ele cobre a parte de baixo e empurra a tela para cima,
 * e a barra inferior do painel acabava ficando no meio do texto. Aqui:
 *  - --exa-app-h acompanha a altura visível de verdade (visualViewport), então o painel encolhe junto com o teclado;
 *  - a página volta para o topo (o iPhone rola a janela inteira ao focar um campo);
 *  - body.teclado-aberto esconde a barra inferior enquanto se digita.
 */
export function useTecladoCelular(ativo: boolean) {
  useEffect(() => {
    const vv = window.visualViewport;
    const raiz = document.documentElement;
    if (!ativo || !vv) {
      raiz.style.removeProperty('--exa-app-h');
      raiz.style.removeProperty('--exa-app-top');
      document.body.classList.remove('teclado-aberto');
      return;
    }
    let quadro = 0;
    const ajustar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const altura = Math.round(vv.height);
        const aberto = window.innerHeight - altura > 120;
        raiz.style.setProperty('--exa-app-h', `${altura}px`);
        // o painel fica preso à área visível: no iPhone o teclado "empurra" a tela; o topo acompanha esse deslocamento
        raiz.style.setProperty('--exa-app-top', `${Math.max(0, Math.round(vv.offsetTop))}px`);
        document.body.classList.toggle('teclado-aberto', aberto);
      });
    };
    ajustar();
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', ajustar);
    window.addEventListener('orientationchange', ajustar);
    return () => {
      cancelAnimationFrame(quadro);
      vv.removeEventListener('resize', ajustar);
      vv.removeEventListener('scroll', ajustar);
      window.removeEventListener('orientationchange', ajustar);
      raiz.style.removeProperty('--exa-app-h');
      raiz.style.removeProperty('--exa-app-top');
      document.body.classList.remove('teclado-aberto');
    };
  }, [ativo]);
}
