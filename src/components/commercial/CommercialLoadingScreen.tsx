import React from 'react';
import exaLogo from '@/assets/exa-logo.png';

interface CommercialLoadingScreenProps {
  buildingName?: string;
}

export const CommercialLoadingScreen: React.FC<CommercialLoadingScreenProps> = ({ 
  buildingName 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        {/* Logo com efeito glow animado */}
        <div className="relative h-24 w-auto inline-block">
          <div className="absolute inset-0 blur-2xl bg-red-500/40 rounded-full animate-pulse" />
          <img 
            src={exaLogo} 
            alt="EXA Mídia" 
            className="h-24 w-auto relative z-10 drop-shadow-2xl brightness-110"
          />
        </div>
        
        {/* Nome do prédio */}
        {buildingName && (
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-wide animate-fade-in">
            {buildingName}
          </h2>
        )}
        
        {/* Spinner e mensagem */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-red-500" />
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-white/90 text-xl md:text-2xl font-medium">
              Preparando conteúdo...
            </p>
            <p className="text-white/60 text-sm md:text-base">
              Carregando playlist de vídeos
            </p>
          </div>
        </div>

        {/* Barra de progresso decorativa */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-red-500 to-red-600 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
};
