import React, { useState, useRef, useEffect } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundTooltip, setShowSoundTooltip] = useState(true);
  
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const {
    videoUrl,
    loading
  } = useHomepageVideo();

  // Esconder tooltip após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSoundTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      setShowSoundTooltip(false);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

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
        <div className="relative mx-auto max-w-[320px] lg:max-w-[380px] -my-32 lg:-my-40">
          {/* Sombra escura no topo - pontinha sob o header */}
          <div className="absolute -top-32 lg:-top-40 inset-x-0 h-32 lg:h-40 bg-gradient-to-b from-black via-black/70 to-transparent z-10 pointer-events-none" />
          
          {/* Container do vídeo - sem bordas arredondadas nas pontas escondidas */}
          <div className="relative bg-black overflow-hidden shadow-2xl">
            <div className="aspect-[9/16]">
              {!loading && <video 
                ref={videoRef}
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

            {/* Botões Glassmorphism - Som e Reiniciar */}
            {!loading && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                {/* Botão Som com Tooltip */}
                <div className="relative">
                  {showSoundTooltip && (
                    <div className="absolute -top-16 right-0 animate-fade-in">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs font-medium text-exa-black whitespace-nowrap">
                        Ative o som
                        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white/95 rotate-45"></div>
                      </div>
                      <div className="absolute -bottom-6 right-5 animate-bounce">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                          <path d="M10 4L10 16M10 16L6 12M10 16L14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={toggleMute}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                    aria-label={isMuted ? "Ativar som" : "Desativar som"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                {/* Botão Reiniciar */}
                <button
                  onClick={restartVideo}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group"
                  aria-label="Reiniciar vídeo"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
          
          {/* Sombra escura na base - pontinha sob o ticker */}
          <div className="absolute -bottom-32 lg:-bottom-40 inset-x-0 h-32 lg:h-40 bg-gradient-to-t from-black via-black/70 to-transparent z-10 pointer-events-none" />
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