import React from 'react';

interface GlobalLoadingPageProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

/**
 * Tela de carregamento leve (só CSS, sem framer-motion).
 * Aparece com 200 ms de atraso: se a página carrega rápido, o usuário não vê "piscar" nada.
 */
const GlobalLoadingPage: React.FC<GlobalLoadingPageProps> = ({
  message = 'Carregando...',
  showProgress = false,
  progress = 0,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#F4F1EC] opacity-0 [animation:exa-aparece_200ms_ease-out_200ms_forwards]"
    role="status"
    aria-live="polite"
  >
    <style>{'@keyframes exa-aparece{to{opacity:1}}@keyframes exa-gira{to{transform:rotate(360deg)}}'}</style>
    <div className="text-center">
      <div
        className="mx-auto h-10 w-10 rounded-full border-[3px] border-[#9C1E1E]/15 border-t-[#9C1E1E] [animation:exa-gira_0.8s_linear_infinite]"
        aria-hidden="true"
      />
      {showProgress && (
        <div className="mx-auto mt-6 w-56">
          <div className="h-1 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-[#9C1E1E] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#6A6B70]">{Math.round(progress)}%</p>
        </div>
      )}
      {message && message.trim() !== '' && <p className="mt-4 text-sm font-medium text-[#45464A]">{message}</p>}
    </div>
  </div>
);

export default GlobalLoadingPage;
