import React from 'react';
import ExaQRCodeWithLogo from './ExaQRCodeWithLogo';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

const AboutExaSection: React.FC = () => {
  const { isMobile, isTablet, isDesktop, isXl, screenWidth, orientation } = useMobileBreakpoints();

  const getQRSize = () => {
    if (screenWidth < 320) return 140;
    if (isMobile && orientation === 'portrait') return 160;
    if (isMobile) return 180;
    if (isTablet) return 200;
    return 220;
  };

  const getTitleSize = () => {
    if (screenWidth < 320) return 'text-lg';
    if (isMobile) return 'text-xl sm:text-2xl';
    if (isTablet) return 'text-2xl md:text-3xl';
    return 'text-3xl lg:text-4xl xl:text-5xl';
  };

  const getTextSize = () => {
    if (screenWidth < 320) return 'text-xs';
    if (isMobile) return 'text-sm sm:text-base';
    if (isTablet) return 'text-base md:text-lg';
    return 'text-lg lg:text-xl xl:text-2xl';
  };

  const getPadding = () => {
    if (screenWidth < 320) return 'px-2 py-6';
    if (isMobile) return 'px-3 py-6 sm:px-4 sm:py-8';
    if (isTablet) return 'px-6 py-8 md:px-8 md:py-12';
    return 'px-8 py-12 lg:px-12 lg:py-16 xl:px-16';
  };

  const getGap = () => {
    if (isMobile) return 'gap-6';
    if (isTablet) return 'gap-8 lg:gap-12';
    return 'gap-12 lg:gap-16';
  };

  return (
    <section id="sobre-exa" className={`bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center ${getPadding()}`}>
      <div className="max-w-6xl mx-auto w-full">
        <div className={`flex flex-col ${isDesktop || isXl ? 'lg:flex-row' : ''} items-center justify-between ${getGap()}`}>
          {/* QR Code Section */}
          <div className={`flex-shrink-0 order-2 ${isDesktop || isXl ? 'lg:order-1' : ''}`}>
            <ExaQRCodeWithLogo 
              size={getQRSize()}
              className={`mx-auto ${isDesktop || isXl ? 'lg:mx-0' : ''}`}
            />
          </div>
          
          {/* Content Section */}
          <div className={`flex-1 text-center order-1 ${isDesktop || isXl ? 'lg:order-2' : ''}`}>
            <h2 className={`${getTitleSize()} font-orbitron font-black text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-400 bg-clip-text mb-3 sm:mb-4 lg:mb-6 xl:mb-8 leading-tight tracking-wide drop-shadow-2xl`}>
              Acabou o Marketing Genérico
            </h2>
            <p className={`${getTextSize()} font-exo-2 font-light text-white/90 leading-relaxed tracking-wide`}>
              Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutExaSection;