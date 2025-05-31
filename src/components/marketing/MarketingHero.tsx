
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import React, { useState, useCallback, useMemo } from 'react';
import { Coffee } from 'lucide-react';

interface MarketingHeroProps {
  onScrollToForm: () => void;
}

const MarketingHero: React.FC<MarketingHeroProps> = ({ onScrollToForm }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Memoizar URL do vídeo para evitar recriações
  const videoUrl = useMemo(() => 
    "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo",
    []
  );

  // Callback otimizado para scroll
  const handleScrollToForm = useCallback(() => {
    onScrollToForm();
  }, [onScrollToForm]);

  // Handlers de loading otimizados
  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background otimizado com fallback */}
      <div className="absolute inset-0 z-0">
        {/* Fallback image para loading mais rápido */}
        {!videoLoaded && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect width='100%25' height='100%25' fill='%23000'/%3E%3C/svg%3E")`
            }}
          />
        )}
        
        {/* Vídeo principal com loading otimizado */}
        <video 
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            videoLoaded ? 'opacity-40' : 'opacity-0'
          }`}
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="metadata"
          onLoadedData={handleVideoLoad}
          loading="lazy"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        
        {/* Gradiente otimizado */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      </div>

      {/* Content otimizado com responsive melhorado */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="text-center">
          {/* Título principal com otimização mobile-first */}
          <h1 className="mb-4 sm:mb-6 lg:mb-8 leading-tight text-center">
            <span className="block mb-2 sm:mb-3 text-white text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
              Marketing com estratégia, presença e impacto real.
            </span>
            <span className="block mb-2 sm:mb-3 text-white text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
              Campanhas completas para marcas que querem crescer.
            </span>
            <span className="block bg-gradient-to-r from-[#00FFAB] to-white bg-clip-text text-transparent text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
              Planejamento, execução e performance no mesmo lugar.
            </span>
          </h1>

          {/* CTA Button otimizado */}
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <button 
              onClick={handleScrollToForm}
              className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white shadow-2xl hover:shadow-[#00FFAB]/50 transform hover:scale-105 hover:-translate-y-1 h-12 px-4 text-sm sm:h-14 sm:px-6 sm:text-base md:h-16 md:px-8 md:text-lg rounded-full font-medium transition-all duration-200 flex items-center space-x-2 mx-auto focus:outline-none focus:ring-2 focus:ring-[#00FFAB] focus:ring-opacity-50"
              aria-label="Agendar conversa com especialistas"
            >
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
              <span>Agendar Conversa com Especialistas</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
