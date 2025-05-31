
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
    const timer = setTimeout(() => setTextVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCTAClick = () => {
    navigate('/paineis-digitais/loja');
  };

  const handleVideoClick = () => {
    setShowVideoPlayer(true);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
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

      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Texto Principal */}
        <div className={`order-2 lg:order-1 text-center lg:text-left transform transition-all duration-1500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Título Principal */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-white to-indexa-mint bg-clip-text text-transparent">
              Publicidade que
            </span>
            <span className="block text-white glow-text">
              sobe com o seu cliente.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-light">
            Os elevadores da cidade agora são <br />
            <span className="text-indexa-mint font-medium">vitrines inteligentes.</span>
          </p>

          {/* Selo de Destaque */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
            <TrendingUp className="w-4 h-4 text-indexa-mint mr-3" />
            <span className="text-white text-sm font-medium">Exibição média: 245 vezes ao dia por painel</span>
          </div>

          {/* Botão CTA Principal */}
          <button
            onClick={handleCTAClick}
            className="group relative bg-indexa-mint text-indexa-purple-dark text-xl font-bold py-6 px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 animate-pulse-soft"
          >
            <span className="relative flex items-center space-x-3 z-10">
              <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              <span>Acessar Loja Online</span>
            </span>
            
            {/* Efeito pulse-glow */}
            <div className="absolute inset-0 bg-indexa-mint/30 rounded-full animate-ping" />
          </button>
        </div>

        {/* Vídeo Totem Central - MAIOR */}
        <div className={`order-1 lg:order-2 flex justify-center transform transition-all duration-1500 delay-500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="relative group">
            {/* Moldura do Painel Digital (Totem) - AUMENTADO */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-3xl shadow-2xl border border-gray-700">
              {/* Sombra externa para criar efeito de profundidade */}
              <div className="absolute inset-0 bg-indexa-purple/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70" />
              
              {/* Brilho interno */}
              <div className="absolute inset-2 bg-gradient-to-t from-transparent via-white/5 to-white/10 rounded-2xl pointer-events-none" />
              
              {/* Vídeo Principal - TAMANHO AUMENTADO */}
              <div className="relative overflow-hidden rounded-2xl">
                <video
                  className="w-full max-w-md h-[500px] md:h-[600px] object-cover rounded-2xl cursor-pointer"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onClick={handleVideoClick}
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
                
                {/* Efeito de tela iluminada */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-indexa-mint/10 pointer-events-none rounded-2xl" />
              </div>

              {/* LEDs indicadores */}
              <div className="absolute top-2 right-2 flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300" />
                <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse delay-700" />
              </div>
            </div>

            {/* Botão sutil para assistir com som em tela cheia */}
            <button
              onClick={handleVideoClick}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105"
            >
              <Volume2 className="w-4 h-4" />
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
