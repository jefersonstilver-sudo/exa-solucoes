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
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const institutionalVideoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos%20exa/Videos%20Site/video%20vertical%20novo%20exa.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBleGEvVmlkZW9zIFNpdGUvdmlkZW8gdmVydGljYWwgbm92byBleGEubXA0IiwiaWF0IjoxNzY0MjcxMTA2LCJleHAiOjE3OTU4MDcxMDZ9.p7LRGVwfDFMfQZIB-60RiMiqlYSJD6-gDQz4HlnZYLk';
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
      setIsPlaying(true);
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
      <div ref={containerRef} className="relative w-full">
        <div 
          className="relative w-full aspect-video bg-black cursor-pointer"
          onClick={togglePlayPause}
        >
          <video
            ref={videoRef}
            src={institutionalVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Botões de Controle - Abaixo do vídeo */}
        <div className="flex justify-center items-center gap-3 py-3 bg-gradient-to-b from-black/40 to-transparent">
          <button 
            onClick={toggleMute} 
            className="video-control-btn"
            aria-label={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={restartVideo} 
            className="video-control-btn"
            aria-label="Reiniciar vídeo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="video-control-btn"
            aria-label="Tela cheia"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      {/* Texto + CTA */}
      <div className="px-6 py-6 text-center space-y-4">
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

  // Desktop: layout de duas colunas com vídeo vertical à esquerda
  const institutionalVideoUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos%20exa/Videos%20Site/video%20vertical%20novo%20exa.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBleGEvVmlkZW9zIFNpdGUvdmlkZW8gdmVydGljYWwgbm92byBleGEubXA0IiwiaWF0IjoxNzY0MjcxMTA2LCJleHAiOjE3OTU4MDcxMDZ9.p7LRGVwfDFMfQZIB-60RiMiqlYSJD6-gDQz4HlnZYLk';
  
  return <section className="bg-gradient-to-b from-[#9C1E1E] via-[#180A0A]/80 to-exa-black min-h-screen flex items-center relative overflow-hidden">
      <div 
        ref={ref} 
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Vídeo Vertical - Lado Esquerdo enterrado sob header/ticker */}
        <div className="relative mx-auto max-w-[320px] lg:max-w-[380px] -my-16 lg:-my-20">
          {/* Sombra escura no topo - pontinha sob o header */}
          <div className="absolute -top-16 lg:-top-20 inset-x-0 h-20 lg:h-24 bg-gradient-to-b from-black/80 via-black/50 to-transparent z-10 pointer-events-none" />
          
          {/* Container do vídeo */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-[9/16]">
              {!loading && <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              >
                <source src={institutionalVideoUrl} type="video/mp4" />
              </video>}
              {loading && <div className="w-full h-full flex items-center justify-center bg-exa-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exa-yellow"></div>
              </div>}
            </div>
          </div>
          
          {/* Sombra escura na base - pontinha sob o ticker */}
          <div className="absolute -bottom-16 lg:-bottom-20 inset-x-0 h-20 lg:h-24 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Texto + CTA - Lado Direito */}
        <div className="space-y-5 md:space-y-6 text-center lg:text-left">
          <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Publicidade que <span className="text-exa-yellow">convive</span>.
          </h1>
          
          <p className="font-poppins text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl mx-auto lg:mx-0">
            A EXA conecta marcas aos instantes reais da vida urbana — atenção genuína, presença diária e resultados duradouros.
          </p>

          <div className="flex gap-4 pt-4 justify-center lg:justify-start">
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
    </section>;
};
export default HeroSection;