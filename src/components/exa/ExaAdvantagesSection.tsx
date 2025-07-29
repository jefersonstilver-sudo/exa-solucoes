import React from 'react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

const ExaAdvantagesSection: React.FC = () => {
  const { isMobile, isTablet, isDesktop, isXl, screenWidth } = useMobileBreakpoints();

  const getTitleSize = () => {
    if (screenWidth < 320) return 'text-lg';
    if (isMobile) return 'text-xl sm:text-2xl';
    if (isTablet) return 'text-2xl md:text-3xl';
    return 'text-3xl lg:text-4xl xl:text-5xl';
  };

  const getCardTitleSize = () => {
    if (screenWidth < 320) return 'text-base';
    if (isMobile) return 'text-lg sm:text-xl';
    if (isTablet) return 'text-xl md:text-2xl';
    return 'text-xl lg:text-2xl xl:text-3xl';
  };

  const getCardTextSize = () => {
    if (screenWidth < 320) return 'text-xs';
    if (isMobile) return 'text-sm sm:text-base';
    if (isTablet) return 'text-base md:text-lg';
    return 'text-base lg:text-lg xl:text-xl';
  };

  const getPadding = () => {
    if (screenWidth < 320) return 'px-2 py-6';
    if (isMobile) return 'px-3 py-6 sm:px-4 sm:py-8';
    if (isTablet) return 'px-6 py-8 md:px-8 md:py-12';
    return 'px-8 py-12 lg:px-12 lg:py-16 xl:px-16';
  };

  const getCardPadding = () => {
    if (screenWidth < 320) return 'p-3';
    if (isMobile) return 'p-4 sm:p-5';
    if (isTablet) return 'p-5 sm:p-6 md:p-7';
    return 'p-6 lg:p-7 xl:p-8';
  };

  const getGridGap = () => {
    if (isMobile) return 'gap-4';
    if (isTablet) return 'gap-4 sm:gap-5 md:gap-6';
    return 'gap-6 lg:gap-7 xl:gap-8';
  };

  return (
    <section className={`bg-white flex items-center justify-center ${getPadding()}`}>
      <div className="max-w-5xl mx-auto w-full">
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8 sm:mb-10 lg:mb-12'}`}>
          <h2 className={`${getTitleSize()} font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text ${isMobile ? 'mb-4' : 'mb-6 sm:mb-8'} leading-tight tracking-wide drop-shadow-2xl text-center`}>
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className={`grid grid-cols-1 ${isDesktop || isXl ? 'lg:grid-cols-2' : isTablet ? 'md:grid-cols-2' : ''} ${getGridGap()} max-w-4xl mx-auto`}>
          <div className={`bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg rounded-xl ${getCardPadding()} text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-purple-500/25`}>
            <h3 className={`${getCardTitleSize()} font-exo-2 font-bold text-white ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'} tracking-wide`}>Impacto Imediato</h3>
            <p className={`font-exo-2 font-light text-white/90 ${getCardTextSize()} leading-relaxed tracking-wide`}>
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className={`bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg rounded-xl ${getCardPadding()} text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-indigo-500/25`}>
            <h3 className={`${getCardTitleSize()} font-exo-2 font-bold text-white ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'} tracking-wide`}>Segmentação Inteligente</h3>
            <p className={`font-exo-2 font-light text-white/90 ${getCardTextSize()} leading-relaxed tracking-wide`}>
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;