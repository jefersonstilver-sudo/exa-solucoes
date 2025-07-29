import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

const ExaHeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop, isXl, orientation, screenWidth } = useMobileBreakpoints();

  const handleKnowExa = () => {
    const aboutSection = document.getElementById('sobre-exa');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewLocation = () => {
    navigate('/paineis-digitais/loja');
  };

  // Responsive sizing functions
  const getVideoMaxHeight = () => {
    if (isMobile) return orientation === 'portrait' ? '40vh' : '50vh';
    if (isTablet) return orientation === 'portrait' ? '45vh' : '60vh';
    return '70vh';
  };

  const getTitleSize = () => {
    if (screenWidth < 320) return 'text-2xl';
    if (isMobile && orientation === 'portrait') return 'text-3xl sm:text-4xl';
    if (isMobile) return 'text-4xl sm:text-5xl';
    if (isTablet) return 'text-5xl md:text-6xl';
    return 'text-6xl lg:text-7xl xl:text-8xl';
  };

  const getSubtitleSize = () => {
    if (screenWidth < 320) return 'text-sm';
    if (isMobile) return 'text-base sm:text-lg md:text-xl';
    if (isTablet) return 'text-lg md:text-2xl';
    return 'text-xl lg:text-3xl xl:text-4xl';
  };

  const getTextSize = () => {
    if (screenWidth < 320) return 'text-xs';
    if (isMobile) return 'text-sm sm:text-base';
    if (isTablet) return 'text-base md:text-lg';
    return 'text-lg lg:text-xl xl:text-2xl';
  };

  const getPadding = () => {
    if (screenWidth < 320) return 'px-2 py-20';
    if (isMobile) return 'px-3 py-16 sm:px-4 sm:py-20';
    if (isTablet) return 'px-6 py-20 md:px-8 md:py-24';
    return 'px-8 py-24 lg:px-12 lg:py-28 xl:px-16';
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      <div className={`min-h-screen flex flex-col ${isTablet || isDesktop ? 'lg:flex-row' : ''} items-center justify-center max-w-7xl mx-auto gap-4 sm:gap-6 lg:gap-12 xl:gap-16 ${getPadding()}`}>
        
        {/* Conteúdo de Texto */}
        <div className={`flex-1 text-center ${isDesktop || isXl ? 'lg:text-left' : ''} text-white w-full ${isDesktop || isXl ? 'lg:max-w-2xl' : ''} order-2 ${isDesktop || isXl ? 'lg:order-1' : ''}`}>
        <h1 className={`${getTitleSize()} font-bold leading-tight mb-4 sm:mb-6 lg:mb-8`}>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            EXA
          </span>
        </h1>
        
        <h2 className={`${getSubtitleSize()} font-bold mb-4 sm:mb-6 lg:mb-8 leading-tight`}>
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className={`${getTextSize()} mb-4 sm:mb-6 lg:mb-8 opacity-90 leading-relaxed ${isDesktop || isXl ? 'max-w-4xl' : ''}`}>
          <span className={`block ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <strong>Imagine seu anúncio alcançando clientes reais na fronteira.</strong>
          </span>
          <span className={`block ${isMobile ? 'mb-1' : 'mb-2 sm:mb-3'}`}>Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block text-purple-300">segunda-quarta para serviços, quinta-domingo para lazer</span>
        </p>
        
        <div className={`bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 ${getTextSize()}`}>
          <p className="text-purple-200">
            Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-3 sm:gap-4 lg:gap-6 justify-center ${isDesktop || isXl ? 'lg:justify-start' : ''} w-full`}>
          <button 
            onClick={handleKnowExa}
            className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-lg ${isMobile ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} transition-all duration-300 hover:shadow-lg hover:scale-105 w-full ${isTablet || isDesktop || isXl ? 'sm:w-auto' : ''} min-h-[44px] sm:min-h-[52px] lg:min-h-[56px] touch-manipulation`}
          >
            Conhecer EXA
          </button>
          <button 
            onClick={handleViewLocation}
            className={`border-2 border-white/60 text-white font-semibold px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-lg ${isMobile ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} transition-all duration-300 hover:bg-white/10 w-full ${isTablet || isDesktop || isXl ? 'sm:w-auto' : ''} min-h-[44px] sm:min-h-[52px] lg:min-h-[56px] touch-manipulation`}
          >
            Ver Localização
          </button>
        </div>
        </div>
        
        {/* Vídeo dos Painéis EXA */}
        <div className={`flex-1 flex justify-center ${isDesktop || isXl ? 'lg:justify-end' : ''} w-full ${
          isMobile ? 'max-w-sm mx-auto' : 
          isTablet ? 'max-w-md sm:max-w-lg mx-auto' : 
          'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl'
        } order-1 ${isDesktop || isXl ? 'lg:order-2' : ''} ${isMobile ? 'mb-6' : 'mt-6 sm:mt-8 lg:mt-0'}`}>
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            preload={isMobile ? "none" : "metadata"}
            className={`w-full h-auto rounded-lg shadow-2xl object-cover`}
            style={{ 
              minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
              maxHeight: getVideoMaxHeight()
            }}
          >
            <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc1MzgyNDIyOSwiZXhwIjo5NjM2MTgyNDIyOX0._w4I2p-iPfcVC0MFevGRW5jcJXF5RTzAuVk8KB-MZeU" type="video/mp4" />
          </video>
        </div>
        
      </div>
    </section>
  );
};

export default ExaHeroSection;