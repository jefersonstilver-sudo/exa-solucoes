import React from 'react';

interface ExaPanelProps {
  children: React.ReactNode;
  className?: string;
  videoUrl?: string;
}

const ExaPanel: React.FC<ExaPanelProps> = ({ children, className = '', videoUrl }) => {
  return (
    <div 
      className={`max-w-sm mx-auto ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Moldura Externa com Efeito 3D Profundo */}
      <div 
        className="relative"
        style={{
          transform: 'rotateY(-2deg) rotateX(2deg)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Sombra 3D */}
        <div 
          className="absolute inset-0 bg-black rounded-3xl blur-2xl opacity-60"
          style={{
            transform: 'translateZ(-50px)',
            filter: 'blur(40px)'
          }}
        />
        
        {/* Moldura Principal - Clara, 3D e Fina */}
        <div 
          className="relative bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-100 rounded-3xl p-3 shadow-2xl"
          style={{
            transform: 'translateZ(0)',
            boxShadow: `
              0 20px 40px -12px rgba(0, 0, 0, 0.3),
              0 8px 16px -4px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.8),
              inset 0 2px 4px rgba(255, 255, 255, 0.9),
              inset 0 -2px 4px rgba(0, 0, 0, 0.1)
            `
          }}
        >
          {/* Borda Interna com Efeito 3D EXA Red */}
          <div 
            className="absolute inset-2 rounded-2xl pointer-events-none"
            style={{
              boxShadow: `
                inset 0 2px 8px rgba(156, 30, 30, 0.15),
                inset 0 -2px 8px rgba(215, 38, 56, 0.1)
              `
            }}
          />
          
          {/* Container do Display */}
          <div 
            className="relative bg-black rounded-2xl overflow-hidden"
            style={{
              boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Header com Logo EXA Luminoso */}
            <div className="bg-gradient-to-b from-zinc-900 to-black py-4 px-6 flex items-center justify-center border-b border-zinc-800/50">
              <span 
                className="text-4xl font-bold text-white tracking-wider"
                style={{
                  textShadow: `
                    0 0 10px rgba(255, 255, 255, 0.95),
                    0 0 20px rgba(255, 255, 255, 0.8),
                    0 0 30px rgba(255, 255, 255, 0.6),
                    0 0 40px rgba(156, 30, 30, 0.5),
                    0 0 60px rgba(215, 38, 56, 0.3)
                  `,
                  filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.9))',
                  fontFamily: 'Montserrat, sans-serif'
                }}
              >
                exa
              </span>
            </div>
            
            {/* Área da Tela (Vídeo) */}
            <div className="aspect-[9/16] bg-black relative overflow-hidden">
              {/* Brilho sutil de tela */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"
                style={{
                  mixBlendMode: 'screen'
                }}
              />
              
              {/* Conteúdo dinâmico (vídeo ou children) */}
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaPanel;
