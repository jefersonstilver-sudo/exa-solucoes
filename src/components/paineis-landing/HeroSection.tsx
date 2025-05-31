
import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

const HeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const { isMobile } = useMobileBreakpoints();
  const navigate = useNavigate();

  const videoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY";

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCTAClick = () => {
    navigate('/loja');
  };

  const handleVideoClick = () => {
    if (!isMobile) {
      setShowVideoPlayer(true);
    }
  };

  const handleVideoButtonClick = () => {
    setShowVideoPlayer(true);
  };

  return (
    <section className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black pt-20 pb-8 px-4">
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          
          <div className={`order-2 lg:order-1 text-center lg:text-left transition-all duration-500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              <span className="block bg-gradient-to-r from-white to-indexa-mint bg-clip-text text-transparent">
                Publicidade que
              </span>
              <span className="block text-white">
                sobe com o seu cliente.
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 leading-relaxed">
              Os elevadores da cidade agora são <br className="hidden sm:block" />
              <span className="text-indexa-mint font-medium">vitrines inteligentes.</span>
            </p>

            <div className="inline-flex items-center bg-white/10 rounded-full px-4 lg:px-5 py-2 mb-8 border border-white/20">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-indexa-mint mr-2" />
              <span className="text-white text-sm lg:text-base font-medium">Exibição média: 245 vezes ao dia por painel</span>
            </div>

            <button
              onClick={handleCTAClick}
              className="bg-indexa-mint text-indexa-purple-dark text-lg lg:text-xl font-bold py-4 lg:py-5 px-8 lg:px-10 rounded-full shadow-xl hover:shadow-indexa-mint/30 transform transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center space-x-2">
                <Play className="w-5 h-5 lg:w-6 lg:h-6" />
                <span>Acessar Loja Online</span>
              </span>
            </button>
          </div>

          <div className={`order-1 lg:order-2 flex flex-col items-center transition-all duration-500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative group w-full max-w-[280px] lg:max-w-[320px] mx-auto">
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-3 lg:p-4 rounded-2xl shadow-2xl border border-gray-700">
                
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[9/16] w-full">
                    <video
                      className={`w-full h-full object-contain rounded-xl bg-black ${!isMobile ? 'cursor-pointer' : ''}`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onClick={handleVideoClick}
                    >
                      <source src={videoSrc} type="video/mp4" />
                    </video>
                  </div>
                </div>

                <div className="absolute top-2 right-2 lg:top-3 lg:right-3 flex space-x-1">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-400 rounded-full animate-pulse delay-300" />
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-indexa-mint rounded-full animate-pulse delay-700" />
                </div>
              </div>
            </div>

            <button
              onClick={handleVideoButtonClick}
              className="mt-4 lg:mt-6 bg-black/70 hover:bg-black/90 px-4 lg:px-5 py-2 lg:py-3 rounded-full text-white text-sm lg:text-base font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105"
            >
              <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>Assistir com som em tela cheia</span>
            </button>
          </div>
        </div>
      </div>

      <FullscreenVideoPlayer
        isOpen={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        videoSrc={videoSrc}
      />
    </section>
  );
};

export default HeroSection;
