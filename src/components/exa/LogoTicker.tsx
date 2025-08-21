import React, { useState, useEffect, useRef } from 'react';
import { useLogos } from '@/hooks/useLogos';

interface LogoTickerProps {
  speed?: number; // px/s
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
  const [hoveredLogoId, setHoveredLogoId] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const trackARef = useRef<HTMLDivElement>(null);
  const trackBRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar preferência de movimento reduzido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Controle da animação
  useEffect(() => {
    if (prefersReducedMotion || loading || !logos.length) {
      return;
    }

    const tracks = [trackARef.current, trackBRef.current];
    if (!tracks[0] || !tracks[1]) return;

    const containerWidth = containerRef.current?.offsetWidth || 0;
    const trackWidth = tracks[0].scrollWidth;
    const duration = trackWidth > 0 ? trackWidth / speed : 30; // fallback de 30s
    // Se não conseguimos medir a largura, ativa fallback estático
    setShowFallback(trackWidth < 100);

    tracks.forEach((track, index) => {
      if (!track) return;

      // Remove animações anteriores
      track.style.animation = 'none';
      
      // Aplica nova animação se não estiver pausada
      if (!isPaused) {
        const delay = index === 1 ? duration / 2 : 0;
        const animationDirection = direction === 'ltr' ? 'normal' : 'reverse';
        
        track.style.animation = `logoTicker ${duration}s linear ${delay}s infinite ${animationDirection}`;
      }
    });

    return () => {
      tracks.forEach(track => {
        if (track) {
          track.style.animation = 'none';
        }
      });
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
      setHoveredLogoId(null);
    }
  };

  const handleLogoHover = (logoId: string | null) => {
    setHoveredLogoId(logoId);
  };

  // Controle touch para mobile
  const handleTouchStart = () => {
    if (pauseOnHover) {
      setIsPaused(true);
      // Auto-resume após 2.5s
      setTimeout(() => setIsPaused(false), 2500);
    }
  };

  // Renderização das logos
  const renderLogos = () => {
    return logos.map((logo) => (
      <div
        key={logo.id}
        className={`
          flex-shrink-0 h-14 lg:h-14 md:h-12 sm:h-10 transition-all duration-300 ease-out cursor-pointer
          ${hoveredLogoId === logo.id ? 'transform scale-110 z-10' : ''}
        `}
        style={{
          filter: hoveredLogoId === logo.id ? 'drop-shadow(0 8px 22px rgba(0,0,0,0.25))' : 'none'
        }}
        onMouseEnter={() => handleLogoHover(logo.id)}
        onMouseLeave={() => handleLogoHover(null)}
        onClick={() => logo.link_url && window.open(logo.link_url, '_blank')}
        aria-label={`Logo da ${logo.name}`}
      >
        <img
          src={logo.file_url}
          alt={logo.name}
          className="h-full w-auto object-contain opacity-95 hover:opacity-100 transition-opacity duration-200"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.visibility = 'hidden';
            console.warn('[LogoTicker] Falha ao carregar logo:', logo.name, logo.file_url);
          }}
        />
      </div>
    ));
  };

  if (loading) {
    return (
      <section id="home-logo-ticker" aria-label="Marcas parceiras" className="relative container mx-auto px-4 lg:px-8">
        <div className="ticker h-24 md:h-20 sm:h-16 relative overflow-hidden rounded-2xl bg-white/5 animate-pulse">
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
        <div className="ticker h-24 md:h-20 sm:h-16 relative overflow-hidden rounded-2xl">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center h-full px-8">
            {logos.slice(0, 6).map((logo) => (
              <div key={logo.id} className="h-12 lg:h-14">
                <img
                  src={logo.file_url}
                  alt={logo.name}
                  className="h-full w-auto object-contain opacity-90"
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
      {/* CSS para animação - injetado apenas uma vez */}
      <style>{`
        @keyframes logoTicker {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-100%, 0, 0);
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
          className="ticker h-24 md:h-20 sm:h-16 relative overflow-hidden rounded-2xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
        >
          {/* Portal Esquerdo - Efeito de saída */}
          <div 
            id="ticker-portal-left"
            className="absolute left-0 top-0 h-full w-20 lg:w-24 z-20 pointer-events-none"
            style={{
              background: 'radial-gradient(120% 100% at 0% 50%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0) 100%)',
              backdropFilter: 'blur(1px)',
              maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)'
            }}
          />

          {/* Portal Direito - Efeito de entrada */}
          <div 
            id="ticker-portal-right"
            className="absolute right-0 top-0 h-full w-20 lg:w-24 z-20 pointer-events-none"
            style={{
              background: 'radial-gradient(120% 100% at 100% 50%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0) 100%)',
              backdropFilter: 'blur(0.5px)',
              maskImage: 'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)'
            }}
          />

          {/* interactive layer removed to avoid overlay issues */}

          {/* Trilha A */}
          <div 
            ref={trackARef}
            id="ticker-track-a"
            className="ticker-track absolute inset-0 flex items-center gap-16 lg:gap-20 md:gap-12 sm:gap-8 px-24 lg:px-28 whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {renderLogos()}
          </div>

          {/* Trilha B - Duplicada para loop infinito */}
          <div 
            ref={trackBRef}
            id="ticker-track-b"
            className="ticker-track absolute inset-0 flex items-center gap-16 lg:gap-20 md:gap-12 sm:gap-8 px-24 lg:px-28 whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {renderLogos()}
          </div>
        </div>
        {showFallback && (
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-10 md:gap-12 lg:gap-16 py-2">
              {renderLogos()}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default LogoTicker;