import React from 'react';

/**
 * Carregamento DENTRO do painel (menu e cabeçalho continuam na tela).
 * Só aparece depois de 200 ms, para trocas rápidas de página não "piscarem".
 */
const CarregandoConteudo: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex min-h-[40vh] items-center justify-center opacity-0 [animation:exa-aparece_200ms_ease-out_200ms_forwards]" role="status" aria-live="polite">
    <style>{'@keyframes exa-aparece{to{opacity:1}}@keyframes exa-gira{to{transform:rotate(360deg)}}'}</style>
    <div className="flex items-center gap-3 text-sm font-medium text-[#6A6B70]">
      <span className="h-5 w-5 rounded-full border-2 border-[#9C1E1E]/15 border-t-[#9C1E1E] [animation:exa-gira_0.8s_linear_infinite]" aria-hidden="true" />
      {message || 'Carregando…'}
    </div>
  </div>
);

export default CarregandoConteudo;
