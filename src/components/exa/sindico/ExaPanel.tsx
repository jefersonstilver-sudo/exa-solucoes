import React from 'react';

interface ExaPanelProps {
  children: React.ReactNode;
  className?: string;
}

const ExaPanel: React.FC<ExaPanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-xs mx-auto ${className}`}>
      {/* Moldura Externa Preta - Simula hardware do painel */}
      <div className="bg-black rounded-2xl shadow-2xl p-4 relative overflow-hidden">
        {/* Efeito de profundidade 3D */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 opacity-50" />
        
        {/* Container do Painel */}
        <div className="relative bg-zinc-900 rounded-xl overflow-hidden shadow-inner">
          {/* Header com Logo EXA Luminoso */}
          <div className="bg-black py-6 px-6 flex items-center justify-center border-b-2 border-zinc-800">
            <span 
              className="text-4xl font-bold text-white tracking-wider"
              style={{
                textShadow: `
                  0 0 10px rgba(255, 255, 255, 0.9),
                  0 0 20px rgba(255, 255, 255, 0.7),
                  0 0 30px rgba(255, 255, 255, 0.5),
                  0 0 40px rgba(147, 51, 234, 0.4)
                `,
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              exa
            </span>
          </div>
          
          {/* Área da Tela (Vídeo) */}
          <div className="aspect-[9/16] bg-black relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaPanel;
