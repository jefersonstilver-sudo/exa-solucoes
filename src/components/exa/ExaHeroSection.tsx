import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
const ExaHeroSection: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const handleKnowExa = () => {
    const aboutSection = document.getElementById('sobre-exa');
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const handleViewLocation = () => {
    navigate('/paineis-digitais/loja');
  };
  const handleVideoClick = () => {
    if (videoRef.current) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };
  const toggleSound = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      videoRef.current.muted = newMutedState;
    }
  };
  return <section className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl mx-auto gap-8 sm:gap-10 lg:gap-16 pt-32 pb-8 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16">
        
        {/* Conteúdo de Texto */}
        <div className="flex-1 text-center lg:text-left text-white w-full lg:max-w-2xl order-2 lg:order-1">
        <div className="mb-6 sm:mb-8 lg:mb-10 flex justify-center lg:justify-start">
          
        </div>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight">
          Publicidade Inteligente
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 sm:mb-8 lg:mb-10 opacity-90 leading-relaxed max-w-4xl">
          <span className="block mb-4 sm:mb-6">
            <strong>Imagine seu anúnciio na rotina do seu cliente.</strong>
          </span>
          <span className="block mb-2 sm:mb-3">
          </span>
          <span className="block text-purple-300">Painéis digitais em prédios estratégicos com programação flexível</span>
        </p>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-8 sm:mb-10 text-sm sm:text-base md:text-lg">
          <p className="text-purple-200">A atenção onde a vida acontece</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start w-full">
          <button onClick={handleKnowExa} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg lg:text-xl transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto min-h-[56px] touch-manipulation">
            Conhecer EXA
          </button>
          
        </div>
        </div>
        
        {/* Painel Digital INDEXA com Vídeo EXA */}
        <div className="flex-1 flex justify-center lg:justify-center w-full order-1 lg:order-2 -mt-4">
          <div className="relative group">
            {/* Frame do Painel Físico */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-3 lg:p-4 rounded-2xl shadow-2xl border border-gray-700 max-w-[280px] lg:max-w-[320px] mx-auto hover:scale-105 transition-transform duration-300">
              
              {/* LEDs Indicativos */}
              <div className="absolute top-3 right-3 flex gap-1 z-20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{
                animationDelay: '0.5s'
              }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{
                animationDelay: '1s'
              }}></div>
              </div>

              {/* Tela do Painel */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] cursor-pointer" onClick={handleVideoClick}>
                <video ref={videoRef} autoPlay muted={isMuted} loop playsInline preload="metadata" className="w-full h-full object-cover">
                  <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc1MzgyNDIyOSwiZXhwIjo5NjM2MTgyNDIyOX0._w4I2p-iPfcVC0MFevGRW5jcJXF5RTzAuVk8KB-MZeU" type="video/mp4" />
                </video>
                
                {/* Controle de Som */}
                <div className="absolute top-2 left-2">
                  <button onClick={e => {
                  e.stopPropagation();
                  toggleSound();
                }} className="bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors duration-200">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Marca INDEXA no Painel */}
              <div className="absolute bottom-2 right-2 text-gray-400 text-xs font-mono">EXA</div>
            </div>
          </div>
        </div>
        
      </div>
    </section>;
};
export default ExaHeroSection;