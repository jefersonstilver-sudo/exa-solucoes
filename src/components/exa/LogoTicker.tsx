import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLogos } from '@/hooks/useLogos';
import TickerLogoItem from './TickerLogoItem';

interface LogoTickerProps {
  speed?: number; // px/s
  direction?: 'ltr' | 'rtl';
  pauseOnHover?: boolean;
  showPortals?: boolean;
  contained?: boolean;
  onLogoClick?: (logoId: string) => void;
  selectedLogoId?: string | null;
  logos?: Array<{
    id: string;
    name: string;
    file_url: string;
    color_variant?: string;
    link_url?: string;
    sort_order: number;
    is_active: boolean;
    storage_bucket?: string;
    storage_key?: string;
    scale_factor?: number;
  }>;
}

const LogoTicker: React.FC<LogoTickerProps> = ({ 
  speed = 60, 
  direction = 'ltr',
  pauseOnHover = true,
  showPortals = false,
  contained = false,
  onLogoClick,
  selectedLogoId,
  logos: passedLogos
}) => {
  const hookData = useLogos();
  const logos = passedLogos || hookData.logos;
  const loading = passedLogos ? false : hookData.loading;
  const error = passedLogos ? null : hookData.error;
  const [isPaused, setIsPaused] = useState(false);
  const [recalcKey, setRecalcKey] = useState(0);
  const [validLogosCount, setValidLogosCount] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Detectar preferência de movimento reduzido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // iOS costuma "simular hover" e pode disparar onMouseEnter sem onMouseLeave.
  // Só pausamos no hover quando o dispositivo realmente suporta hover.
  const canHover = window.matchMedia('(hover: hover)').matches;

  // Controle da animação
  useEffect(() => {
    if (prefersReducedMotion || loading || !logos.length) {
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    const trackWidth = track.scrollWidth / 2; // Divide by 2 since we duplicate content
    if (!Number.isFinite(trackWidth) || trackWidth <= 0) {
      return;
    }

    const duration = trackWidth / speed;
    const animationDirection = direction === 'ltr' ? 'normal' : 'reverse';

    track.style.animation = `logoTicker ${duration}s linear infinite ${animationDirection}`;
    track.style.animationPlayState = isPaused ? 'paused' : 'running';

    return () => {
      if (track) track.style.animation = 'none';
    };
  }, [logos, speed, direction, loading, prefersReducedMotion, recalcKey, isPaused]);

  // Control animation play state separately for smooth pause/resume
  useEffect(() => {
    const track = trackRef.current;
    if (track && track.style.animation !== 'none') {
      track.style.animationPlayState = isPaused ? 'paused' : 'running';
    }
  }, [isPaused]);

  // Handlers de hover
  const handleMouseEnter = () => {
    if (pauseOnHover && canHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && canHover) {
      setIsPaused(false);
    }
  };

  // Controle touch para mobile
  // Não pausamos no touch para evitar "ticker parado" no iPhone.
  const handleTouchStart = () => {
    return;
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
        className="transition-all duration-300 ease-out"
        onImageLoad={handleLogoLoad}
        onImageError={handleLogoError}
        onClick={onLogoClick ? () => onLogoClick(logo.id) : undefined}
        isSelected={selectedLogoId === logo.id}
      />
    ));
  };

  // Only show loading skeleton on first load (when no logos cached yet)
  if (loading && logos.length === 0) {
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

  const sectionClassName = contained
    ? "relative w-full overflow-hidden bg-[#9C1E1E]"
    : "relative w-screen left-1/2 -translate-x-1/2 mt-0 overflow-hidden bg-[#9C1E1E]";

  return (
    <>
      {/* CSS para animação - injetado apenas uma vez */}
      <style>{`
        @keyframes logoTicker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <section 
        id="home-logo-ticker" 
        aria-label="Marcas parceiras"
        className={sectionClassName}
      >
        <div 
          className="ticker w-full h-16 md:h-18 lg:h-20 relative overflow-x-hidden bg-[#9C1E1E] rounded-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
            className="ticker-track absolute left-0 top-0 h-full flex items-center gap-6 md:gap-12 lg:gap-16 px-0 whitespace-nowrap"
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
