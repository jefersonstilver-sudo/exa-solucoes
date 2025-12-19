import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLogos } from '@/hooks/useLogos';
import TickerLogoItem from './TickerLogoItem';

interface LogoTickerProps {
  speed?: number; // px/s
  direction?: 'ltr' | 'rtl';
  pauseOnHover?: boolean;
  showPortals?: boolean;
}

const LogoTicker: React.FC<LogoTickerProps> = ({ 
  speed = 60, 
  direction = 'ltr',
  pauseOnHover = true,
  showPortals = false
}) => {
  const { logos, loading, error } = useLogos();
  const [isPaused, setIsPaused] = useState(false);
  const [recalcKey, setRecalcKey] = useState(0);
  const [validLogosCount, setValidLogosCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // ⚡ OTIMIZAÇÃO: Track visibility
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar preferência de movimento reduzido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ⚡ OTIMIZAÇÃO: Intersection Observer para pausar quando fora da tela
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [prefersReducedMotion]);

  // Controle da animação
  useEffect(() => {
    if (prefersReducedMotion || loading || !logos.length) {
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    const trackWidth = track.scrollWidth / 2; // Divide by 2 since we duplicate content
    const duration = trackWidth / speed;
    const animationDirection = direction === 'ltr' ? 'normal' : 'reverse';
    
    // Set animation and control with animationPlayState
    track.style.animation = `logoTicker ${duration}s linear infinite ${animationDirection}`;
    // ⚡ OTIMIZAÇÃO: Pausar quando não visível OU hover
    track.style.animationPlayState = (isPaused || !isVisible) ? 'paused' : 'running';

    return () => {
      if (track) {
        track.style.animation = 'none';
      }
    };
  }, [logos, speed, direction, loading, prefersReducedMotion, recalcKey, isVisible]);

  // Control animation play state separately for smooth pause/resume
  useEffect(() => {
    const track = trackRef.current;
    if (track && track.style.animation !== 'none') {
      // ⚡ OTIMIZAÇÃO: Pausar quando não visível OU hover
      track.style.animationPlayState = (isPaused || !isVisible) ? 'paused' : 'running';
    }
  }, [isPaused, isVisible]);

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

  // Controle touch para mobile
  const handleTouchStart = () => {
    if (pauseOnHover) {
      setIsPaused(true);
      // Auto-resume após 2.5s
      setTimeout(() => setIsPaused(false), 2500);
    }
  };

  const handleLogoLoad = useCallback(() => {
    setValidLogosCount(prev => prev + 1);
    setRecalcKey((k) => k + 1);
  }, []);

  const handleLogoError = useCallback(() => {
    setRecalcKey((k) => k + 1);
  }, []);

  // Reset count when logos change
  useEffect(() => {
    setValidLogosCount(0);
  }, [logos]);

  // Renderização das logos - duplicadas para loop infinito
  const renderLogos = () => {
    return logos.map((logo) => (
      <TickerLogoItem
        key={logo.id}
        logo={logo}
        className="h-10 md:h-12 lg:h-14 transition-all duration-300 ease-out hover:scale-110"
        onImageLoad={handleLogoLoad}
        onImageError={handleLogoError}
      />
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
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>

      <section 
        id="home-logo-ticker" 
        aria-label="Marcas parceiras"
        className="relative w-full mt-0"
      >
        <div 
          ref={containerRef}
          className="ticker h-16 md:h-18 lg:h-20 relative overflow-hidden bg-[#9C1E1E]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
        >
          {/* Portal Esquerdo - Efeito de saída */}
          {showPortals && (
            <div 
              id="ticker-portal-left"
              className="absolute left-0 top-0 h-full w-20 lg:w-24 z-20 pointer-events-none"
              style={{
                background: 'radial-gradient(120% 100% at 0% 50%, rgba(0,0,0,0.19) 0%, rgba(0,0,0,0.11) 50%, rgba(0,0,0,0) 100%)',
                backdropFilter: 'blur(1px)',
                maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)'
              }}
            />
          )}

          {/* Portal Direito - Efeito de entrada */}
          {showPortals && (
            <div 
              id="ticker-portal-right"
              className="absolute right-0 top-0 h-full w-20 lg:w-24 z-20 pointer-events-none"
              style={{
                background: 'radial-gradient(120% 100% at 100% 50%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0) 100%)',
                backdropFilter: 'blur(0.5px)',
                maskImage: 'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)'
              }}
            />
          )}

          {/* Trilha única com conteúdo duplicado para loop infinito */}
          <div 
            ref={trackRef}
            id="ticker-track"
            className="ticker-track absolute inset-0 flex items-center gap-6 md:gap-12 lg:gap-16 px-4 md:px-20 lg:px-24 whitespace-nowrap"
            style={{ 
              willChange: 'transform',
              width: 'max-content'
            }}
          >
            {/* Primeiro conjunto de logos */}
            {renderLogos()}
            {/* Segundo conjunto de logos para continuidade */}
            {renderLogos()}
          </div>
        </div>
      </section>
    </>
  );
};

export default LogoTicker;