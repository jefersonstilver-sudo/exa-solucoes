import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop, isXl, screenWidth } = useMobileBreakpoints();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  const getTextSize = () => {
    if (screenWidth < 320) return 'text-sm';
    if (isMobile) return 'text-base sm:text-lg';
    if (isTablet) return 'text-lg md:text-xl';
    return 'text-xl lg:text-2xl';
  };

  const getButtonTextSize = () => {
    if (screenWidth < 320) return 'text-sm';
    if (isMobile) return 'text-base';
    if (isTablet) return 'text-base sm:text-lg';
    return 'text-lg md:text-xl';
  };

  const getPadding = () => {
    if (screenWidth < 320) return 'py-6';
    if (isMobile) return 'py-6 sm:py-8';
    return 'py-8 sm:py-10 lg:py-12';
  };

  const getContainerPadding = () => {
    if (screenWidth < 320) return 'px-3';
    if (isMobile) return 'px-4 sm:px-6';
    if (isTablet) return 'px-6 md:px-8';
    return 'px-8 lg:px-12 xl:px-16';
  };

  const getButtonPadding = () => {
    if (screenWidth < 320) return 'py-3 px-6';
    if (isMobile) return 'py-3 px-8 sm:py-4 sm:px-10';
    return 'py-4 px-10 sm:py-5 sm:px-12';
  };

  const getMinHeight = () => {
    if (screenWidth < 320) return 'min-h-[44px]';
    if (isMobile) return 'min-h-[48px]';
    return 'min-h-[56px]';
  };

  return (
    <section className={`${getPadding()} bg-gradient-to-br from-purple-900 to-black text-white`}>
      <div className={`max-w-4xl mx-auto ${getContainerPadding()} text-center`}>
        <p className={`${getTextSize()} font-exo-2 font-light text-white/90 ${isMobile ? 'mb-4 sm:mb-6' : 'mb-6 sm:mb-8 lg:mb-10'} leading-relaxed tracking-wide text-center`}>
          Se você é síndico, veja como modernizar seu prédio
        </p>
        
        <button
          onClick={handleSindicoClick}
          className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold ${getButtonPadding()} rounded-lg ${getButtonTextSize()} transition-all duration-300 hover:shadow-lg hover:scale-105 ${getMinHeight()} touch-manipulation tracking-wide shadow-2xl hover:shadow-purple-500/25 w-full ${isTablet || isDesktop || isXl ? 'sm:w-auto' : ''}`}
        >
          Modernizar Meu Prédio
        </button>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;