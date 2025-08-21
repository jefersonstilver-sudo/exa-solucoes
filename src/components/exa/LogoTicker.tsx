
import React, { useEffect, useRef, useState } from 'react';
import { useLogos } from '@/hooks/useLogos';

interface LogoTickerProps {
  speed?: number;
  direction?: 'ltr' | 'rtl';
  pauseOnHover?: boolean;
}

const LogoTicker: React.FC<LogoTickerProps> = ({ 
  speed = 60, 
  direction = 'ltr',
  pauseOnHover = true 
}) => {
  const { logos, loading, error } = useLogos();
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  // Detectar preferência de movimento reduzido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Configurar animação contínua com CSS puro
  useEffect(() => {
    if (prefersReducedMotion || loading || !logos.length) {
      return;
    }

    // Injetar CSS dinâmico para animação suave
    const style = document.createElement('style');
    const animationDuration = 20; // seconds for smooth animation
    
    style.textContent = `
      @keyframes logoTickerScroll {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-100%); }
      }
      
      .logo-ticker-track {
        animation: logoTickerScroll ${animationDuration}s linear infinite;
        animation-play-state: running;
      }
      
      .logo-ticker-container:hover .logo-ticker-track {
        animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [logos, loading, prefersReducedMotion, pauseOnHover]);

  // Handlers de hover - usando CSS animation-play-state
  const handleMouseEnter = () => {
    if (pauseOnHover && containerRef.current) {
      containerRef.current.style.animationPlayState = 'paused';
      const tracks = containerRef.current.querySelectorAll('[data-ticker-track]');
      tracks.forEach(track => {
        (track as HTMLElement).style.animationPlayState = 'paused';
      });
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && containerRef.current) {
      containerRef.current.style.animationPlayState = 'running';
      const tracks = containerRef.current.querySelectorAll('[data-ticker-track]');
      tracks.forEach(track => {
        (track as HTMLElement).style.animationPlayState = 'running';
      });
    }
  };

  // Renderização das logos
  const renderLogos = () => {
    return logos.map((logo) => (
      <div
        key={logo.id}
        data-logo-item
        className="flex-shrink-0 h-12 lg:h-14 px-4 lg:px-6 transition-all duration-300 ease-out cursor-pointer hover:scale-110"
        onClick={() => logo.link_url && window.open(logo.link_url, '_blank')}
        aria-label={`Logo da ${logo.name}`}
      >
        <img
          src={logo.file_url}
          alt={logo.name}
          className="h-full w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
          loading="lazy"
          draggable={false}
          onError={(e) => {
            console.error(`❌ Failed to load logo ${logo.name} (ID: ${logo.id}):`, logo.file_url);
            // Hide the parent container to maintain ticker stability
            const parentDiv = (e.target as HTMLElement).closest('[data-logo-item]') as HTMLElement;
            if (parentDiv) {
              parentDiv.style.display = 'none';
            }
          }}
        />
      </div>
    ));
  };

  if (loading) {
    return (
      <section id="home-logo-ticker" aria-label="Marcas parceiras" className="relative container mx-auto px-4 lg:px-8">
        <div className="ticker h-20 lg:h-24 relative overflow-hidden rounded-2xl bg-white/5 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-sm">Carregando logos...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !logos.length) {
    return null; // Falha silenciosa para não quebrar a página
  }

  // Fallback para usuários com preferência de movimento reduzido
  if (prefersReducedMotion) {
    return (
      <section id="home-logo-ticker" aria-label="Marcas parceiras" className="relative container mx-auto px-4 lg:px-8">
        <div className="ticker h-20 lg:h-24 relative overflow-hidden rounded-2xl bg-gradient-to-r from-black/20 via-black/10 to-black/20">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center h-full px-8">
            {logos.slice(0, 6).map((logo) => (
              <div key={logo.id} className="h-10 lg:h-12">
                <img
                  src={logo.file_url}
                  alt={logo.name}
                  className="h-full w-auto object-contain opacity-80"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* CSS para animação */}
      <style>{`
        @keyframes scrollLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        @keyframes scrollRight {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>

      <section 
        id="home-logo-ticker" 
        aria-label="Marcas parceiras"
        className="relative container mx-auto px-4 lg:px-8"
      >
        <div 
          ref={containerRef}
          className="logo-ticker-container ticker h-20 lg:h-24 relative overflow-hidden rounded-2xl bg-gradient-to-r from-black/20 via-black/10 to-black/20"
        >
          {/* Gradientes laterais suaves */}
          <div 
            className="absolute left-0 top-0 h-full w-8 lg:w-12 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 80%, transparent 100%)'
            }}
          />
          <div 
            className="absolute right-0 top-0 h-full w-8 lg:w-12 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 80%, transparent 100%)'
            }}
          />

          {/* Trilha única com CSS animation */}
          <div 
            data-ticker-track
            className="logo-ticker-track flex items-center absolute inset-0 whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {renderLogos()}
            {/* Duplicar logos para loop contínuo */}
            {renderLogos()}
          </div>
        </div>
      </section>
    </>
  );
};

export default LogoTicker;
