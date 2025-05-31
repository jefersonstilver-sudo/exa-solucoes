
import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

const VideoGallerySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const videos = [
    {
      src: 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY',
      title: 'Painel Principal',
      description: 'Demonstração do painel em funcionamento'
    },
    {
      src: 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY',
      title: 'Interface Dinâmica',
      description: 'Transições suaves entre conteúdos'
    },
    {
      src: 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY',
      title: 'Qualidade Premium',
      description: 'Resolução HD para máximo impacto'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const nextVideo = () => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideo((prev) => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-800 to-black flex items-center justify-center py-16 sm:py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Galeria de Vídeos
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-12 sm:mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Veja os painéis em ação e a qualidade cinematográfica das pinceladas
          </p>

          {/* Vídeo Principal - RESPONSIVO */}
          <div className="relative max-w-4xl mx-auto mb-8 sm:mb-12">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl z-10">
                  <div className="w-12 h-12 border-4 border-indexa-mint border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <video
                key={currentVideo}
                className="w-full h-64 sm:h-96 md:h-[500px] object-cover rounded-2xl"
                autoPlay
                loop
                muted
                playsInline
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
              >
                <source src={videos[currentVideo].src} type="video/mp4" />
              </video>
              
              {/* Overlay com play button */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
                </div>
              </div>

              {/* Controles do carrossel - RESPONSIVOS */}
              <button
                onClick={prevVideo}
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <button
                onClick={nextVideo}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Informações do vídeo */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                  {videos[currentVideo].title}
                </h3>
                <p className="text-white/80 text-sm sm:text-base">
                  {videos[currentVideo].description}
                </p>
              </div>
            </div>
          </div>

          {/* Indicadores de vídeo - RESPONSIVOS */}
          <div className="flex justify-center space-x-2 sm:space-x-3 mb-8 sm:mb-12">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideo(index)}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                  index === currentVideo 
                    ? 'bg-indexa-mint shadow-lg scale-125' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          {/* Thumbnails - DESKTOP ONLY */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-xl cursor-pointer transform transition-all duration-500 ${
                  index === currentVideo 
                    ? 'scale-105 ring-2 ring-indexa-mint' 
                    : 'hover:scale-102'
                }`}
                onClick={() => setCurrentVideo(index)}
              >
                <video
                  className="w-full h-48 object-cover"
                  muted
                  loop
                  autoPlay={index === currentVideo}
                >
                  <source src={video.src} type="video/mp4" />
                </video>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-white font-semibold text-sm">{video.title}</h4>
                    <p className="text-white/80 text-xs">{video.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;
