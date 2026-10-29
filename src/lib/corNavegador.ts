import { useEffect } from 'react';

/**
 * Cor do navegador no celular enquanto o componente está na tela.
 * - topo: <meta name="theme-color"> — no Safari/Chrome é a faixa atrás do relógio e da barra de endereço.
 *   Tem que ser a mesma cor do cabeçalho da página (senão aparece uma faixa de outra cor em cima).
 * - fundo: cor do <html> — no iPhone é o que aparece atrás da barra do Safari quando ela recolhe e no
 *   "puxar além do fim" da página. Tem que combinar com a barra fixa de baixo (senão aparece faixa branca).
 * Ao sair, devolve as cores que estavam antes.
 */
export function useCorNavegador({ topo, fundo }: { topo?: string; fundo?: string }) {
  useEffect(() => {
    const html = document.documentElement;
    let metas: HTMLMetaElement[] = [];
    let antes: string[] = [];
    if (topo) {
      metas = Array.from(document.querySelectorAll('meta[name="theme-color"]')) as HTMLMetaElement[];
      if (!metas.length) {
        const m = document.createElement('meta');
        m.name = 'theme-color';
        document.head.appendChild(m);
        metas.push(m);
      }
      antes = metas.map((m) => m.content);
      metas.forEach((m) => { m.content = topo; });
    }
    const fundoAntes = html.style.backgroundColor;
    if (fundo) html.style.backgroundColor = fundo;
    return () => {
      metas.forEach((m, i) => { m.content = antes[i] || ''; });
      if (fundo) html.style.backgroundColor = fundoAntes;
    };
  }, [topo, fundo]);
}
