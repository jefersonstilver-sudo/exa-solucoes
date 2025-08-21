
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

  // Configurar animação contínua
  useEffect(() => {
    if (prefersReducedMotion || loading || !logos.length || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const track1 = track1Ref.current;
    const track2 = track2Ref.current;

    if (!track1 || !track2) return;

    // Calcular largura do conteúdo
    const trackWidth = track1.scrollWidth;
    const duration = trackWidth / speed;

    // Aplicar animação CSS
    const animationName = direction === 'ltr' ? 'scrollLeft' : 'scrollRight';
    
    track1.style.animation = isPaused ? 'none' : `${animationName} ${duration}s linear infinite`;
    track2.style.animation = isPaused ? 'none' : `${animationName} ${duration}s linear infinite`;
    track2.style.animationDelay = `-${duration / 2}s`;

    // Limpar animações ao desmontar
    return () => {
      track1.style.animation = 'none';
      track2.style.animation = 'none';
    };
  }, [logos, speed, direction, isPaused, loading, prefersReducedMotion]);

  // Handlers de hover
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // Renderização das logos
  const renderLogos = () => {
    return logos.map((logo) => (
      <div
        key={logo.id}
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
            console.error(`❌ Failed to load logo ${logo.name}:`, logo.file_url);
            (e.target as HTMLImageElement).style.display = 'none';
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
          className="ticker h-20 lg:h-24 relative overflow-hidden rounded-2xl bg-gradient-to-r from-black/20 via-black/10 to-black/20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradientes laterais mais suaves */}
          <div 
            className="absolute left-0 top-0 h-full w-16 lg:w-20 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
            }}
          />
          <div 
            className="absolute right-0 top-0 h-full w-16 lg:w-20 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
            }}
          />

          {/* Trilha 1 */}
          <div 
            ref={track1Ref}
            className="absolute inset-0 flex items-center whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {renderLogos()}
          </div>

          {/* Trilha 2 - Para loop contínuo */}
          <div 
            ref={track2Ref}
            className="absolute inset-0 flex items-center whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {renderLogos()}
          </div>
        </div>
      </section>
    </>
  );
};

export default LogoTicker;
