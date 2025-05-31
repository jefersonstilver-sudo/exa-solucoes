
import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

const HeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const navigate = useNavigate();

  const videoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY";

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCTAClick = () => {
    navigate('/paineis-digitais/loja');
  };

  const handleVideoClick = () => {
    setShowVideoPlayer(true);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-20 pb-8 px-4">
      {/* Background with blur */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-20 max-w-6xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16 items-center w-full">
          
          {/* Texto Principal */}
          <div className={`order-2 lg:order-1 text-center lg:text-left transform transition-all duration-1000 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {/* Título Principal */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              <span className="block bg-gradient-to-r from-white to-indexa-mint bg-clip-text text-transparent">
                Publicidade que
              </span>
              <span className="block text-white glow-text">
                sobe com o seu cliente.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-white/90 mb-6 leading-relaxed font-light">
              Os elevadores da cidade agora são <br className="hidden sm:block" />
              <span className="text-indexa-mint font-medium">vitrines inteligentes.</span>
            </p>

            {/* Selo de Destaque */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 lg:px-5 py-2 mb-6 lg:mb-8 border border-white/20">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-indexa-mint mr-2" />
              <span className="text-white text-xs sm:text-sm lg:text-base font-medium">Exibição média: 245 vezes ao dia por painel</span>
            </div>

            {/* Botão CTA Principal */}
            <button
              onClick={handleCTAClick}
              className="group relative bg-indexa-mint text-indexa-purple-dark text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-4 lg:py-5 px-6 sm:px-8 lg:px-10 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative flex items-center space-x-2 z-10">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Acessar Loja Online</span>
              </span>
            </button>
          </div>

          {/* Vídeo Totem Central - CORRIGIDO PARA VERTICAL */}
          <div className={`order-1 lg:order-2 flex flex-col items-center transform transition-all duration-1000 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="relative group w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg mx-auto">
              {/* Moldura do Painel Digital (Totem) - AJUSTADO PARA VERTICAL */}
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700">
                {/* Sombra externa para criar efeito de profundidade */}
                <div className="absolute inset-0 bg-indexa-purple/30 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70" />
                
                {/* Brilho interno */}
                <div className="absolute inset-1 bg-gradient-to-t from-transparent via-white/5 to-white/10 rounded-lg sm:rounded-xl pointer-events-none" />
                
                {/* Vídeo Principal com aspect ratio VERTICAL 9:16 */}
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl">
                  <div className="aspect-[9/16] w-full">
                    <video
                      className="w-full h-full object-contain rounded-lg sm:rounded-xl cursor-pointer bg-black"
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
                  
                  {/* Efeito de tela iluminada */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-indexa-mint/10 pointer-events-none rounded-lg sm:rounded-xl" />
                </div>

                {/* LEDs indicadores */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 lg:top-3 lg:right-3 flex space-x-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-blue-400 rounded-full animate-pulse delay-300" />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-indexa-mint rounded-full animate-pulse delay-700" />
                </div>
              </div>
            </div>

            {/* Botão embaixo do vídeo */}
            <button
              onClick={handleVideoClick}
              className="mt-3 sm:mt-4 lg:mt-6 bg-black/70 hover:bg-black/90 backdrop-blur-sm px-3 sm:px-4 lg:px-5 py-2 lg:py-3 rounded-full text-white text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105"
            >
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              <span>Assistir com som em tela cheia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Player de vídeo em tela cheia */}
      <FullscreenVideoPlayer
        isOpen={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        videoSrc={videoSrc}
      />
    </section>
  );
};

export default HeroSection;
