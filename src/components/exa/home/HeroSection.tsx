import React, { useState, useRef } from 'react';
import ExaSection from '../base/ExaSection';
import ExaCTA from '../base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useHomepageVideo } from '@/hooks/useHomepageVideo';
import { useIsMobile } from '@/hooks/use-mobile';
import { Volume2, VolumeX, RotateCcw, Maximize, Minimize } from 'lucide-react';
// Mobile Hero Layout Component
const HeroMobileLayout = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const institutionalVideoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Videos%20Site/institucional.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9WaWRlb3MgU2l0ZS9pbnN0aXR1Y2lvbmFsLm1wNCIsImlhdCI6MTc2NDE4NjY3OCwiZXhwIjoxNzY0NzkxNDc4fQ.BBEzGtBpbYm4Qd-ZlhVKwW4CtVAKiwn9K-Hdx3-y14I';
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  return (
    <section className="bg-gradient-to-b from-[#9C1E1E] via-[#180A0A]/80 to-exa-black pt-16 pb-8">
      {/* Vídeo Hero Imersivo */}
      <div ref={containerRef} className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          src={institutionalVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Botões Flutuantes - Abaixo do vídeo sobrepostos */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <button 
            onClick={toggleMute} 
            className="glassmorphism-button-small"
            aria-label={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={restartVideo} 
            className="glassmorphism-button-small"
            aria-label="Reiniciar vídeo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="glassmorphism-button-small"
            aria-label="Tela cheia"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Texto + CTA */}
      <div className="px-6 py-8 text-center space-y-5">
        <h1 className="font-montserrat font-extrabold text-3xl text-white leading-tight">
          Publicidade que <span className="text-exa-yellow">convive</span>.
        </h1>
        
        <p className="font-poppins text-sm text-gray-200 leading-relaxed max-w-xl mx-auto">
          A EXA conecta marcas aos instantes reais da vida urbana — atenção genuína, presença diária e resultados duradouros.
        </p>

        <div className="flex gap-4 pt-2 justify-center">
          <ExaCTA 
            variant="primary" 
            size="md" 
            href="https://wa.me/5545991415920?text=Oi%2C%20tenho%20interesse%20em%20anunciar%20na%20EXA!"
          >
            Falar com Vendedor
          </ExaCTA>
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => {
  const isMobile = useIsMobile();
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const {
    videoUrl,
    loading
  } = useHomepageVideo();

  // Se for mobile, renderiza o novo layout imersivo
  if (isMobile) {
    return <HeroMobileLayout />;
  }

  // Desktop: mantém layout atual
  const defaultVideoUrl = 'https://indexa.net.br/wp-content/uploads/2025/01/indexa_exa.mp4';
  const displayVideoUrl = videoUrl || defaultVideoUrl;
  return <ExaSection background="dark" className="min-h-screen md:min-h-[75vh] lg:min-h-[80vh] flex items-center relative overflow-hidden pt-24 md:pt-28 lg:pt-24 pb-8 md:pb-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9C1E1E] via-[#180A0A]/80 to-exa-black opacity-90" />
      
      {/* Animated circles */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-exa-blue/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-exa-yellow/10 rounded-full blur-3xl animate-pulse-soft" />

      <div ref={ref} className={`relative z-10 w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center transition-all duration-1000 pb-12 md:pb-8 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Left side - Player de vídeo posicionado levemente à direita */}
        <div className="relative group order-2 lg:order-1 w-full max-w-[240px] md:max-w-[260px] lg:max-w-[280px] mx-auto lg:ml-8 lg:mr-auto mb-8 md:mb-0 lg:mt-8">
          <div className="bg-gradient-to-b from-zinc-300 via-zinc-200 to-zinc-100 p-2 md:p-2.5 lg:p-3 rounded-3xl shadow-2xl border border-white/90 hover:scale-105 transition-transform duration-300">
            <div className="bg-black rounded-2xl overflow-hidden shadow-inner aspect-[9/16]">
              {!loading && <video autoPlay loop muted playsInline controls className="w-full h-full object-cover" key={displayVideoUrl}>
                  <source src={displayVideoUrl} type="video/mp4" />
                </video>}
              {loading && <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exa-yellow"></div>
                </div>}
            </div>
          </div>
        </div>

        {/* Right side - Conteúdo de texto */}
        <div className="space-y-5 md:space-y-6 order-1 lg:order-2 w-full">
          <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Publicidade que <span className="text-exa-yellow">convive</span>.
          </h1>
          
          <p className="font-poppins text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl">
            A EXA conecta marcas aos instantes reais da vida urbana — atenção genuína, presença diária e resultados duradouros.
          </p>

          <div className="flex gap-4 pt-4 justify-center sm:justify-start">
            <ExaCTA 
              variant="primary" 
              size="lg" 
              href="https://wa.me/5545991415920?text=Oi%2C%20tenho%20interesse%20em%20anunciar%20na%20EXA!"
            >
              Falar com Vendedor
            </ExaCTA>
          </div>
        </div>
      </div>
    </ExaSection>;
};
export default HeroSection;