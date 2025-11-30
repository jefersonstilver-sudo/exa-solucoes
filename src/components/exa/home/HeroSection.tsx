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
  return <section className="bg-gradient-to-b from-[#9C1E1E] via-[#180A0A]/80 to-exa-black pt-16 pb-8">
      {/* Vídeo Hero Imersivo */}
      <div ref={containerRef} className="relative w-full">
        <div className="relative w-full aspect-video bg-black cursor-pointer" onClick={togglePlayPause}>
          <video ref={videoRef} src={institutionalVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
        </div>
        
        {/* Botões de Controle - Abaixo do vídeo */}
        <div className="flex justify-center items-center gap-3 py-3 bg-gradient-to-b from-black/40 to-transparent">
          <button onClick={toggleMute} className="video-control-btn" aria-label={isMuted ? "Ativar som" : "Desativar som"}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={restartVideo} className="video-control-btn" aria-label="Reiniciar vídeo">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullscreen} className="video-control-btn" aria-label="Tela cheia">
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
      </div>
    </section>;
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
      {/* Camada de cobertura TOPO - cobre borda superior do vídeo */}
      <div className="absolute top-0 left-0 right-0 h-[120px] lg:h-[160px] 
                   bg-gradient-to-b from-[#9C1E1E] via-[#9C1E1E]/80 to-transparent 
                   z-30 pointer-events-none" />
      
      <div ref={ref} className={`relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Vídeo Vertical - Lado Esquerdo - SEM cortes */}
        <div className="relative mx-auto max-w-[320px] lg:max-w-[380px]">
          {/* Container do vídeo - INTEIRO sem clip-path */}
          <div className="relative bg-black shadow-2xl rounded-lg overflow-hidden">
            <div className="aspect-[9/16]">
              {!loading && <video ref={videoRef} autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src={institutionalVideoUrl} type="video/mp4" />
              </video>}
              {loading && <div className="w-full h-full flex items-center justify-center bg-exa-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exa-yellow"></div>
              </div>}
            </div>
          </div>
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
            <ExaCTA variant="primary" size="lg" href="https://wa.me/5545991415920?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20sobre%20investir%20em%20pain%C3%A9is.">
              Quero Saber Mais
            </ExaCTA>
          </div>
        </div>
      </div>
      
      {/* Botões fixos - centralizados e próximos ao ticker de logos */}
      {!loading && <div className="absolute bottom-[60px] lg:bottom-[80px] left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {/* Botão Som com Tooltip */}
          <div className="relative">
            {showSoundTooltip && <div className="absolute -top-14 left-0 animate-fade-in">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs font-medium text-exa-black whitespace-nowrap">
                  Ative o som
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white/95 rotate-45"></div>
                </div>
                <div className="absolute -bottom-6 left-5 animate-bounce">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                    <path d="M10 4L10 16M10 16L6 12M10 16L14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>}
            
            <button onClick={toggleMute} aria-label={isMuted ? "Ativar som" : "Desativar som"} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group my-[20px] px-0 mx-[5px] mr-[8px]">
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Botão Reiniciar */}
          <button onClick={restartVideo} aria-label="Reiniciar vídeo" className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group my-[18px] px-0 mr-[570px]">
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        </div>}
      
      {/* Camada de cobertura BASE - cobre borda inferior do vídeo */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] lg:h-[160px] 
                   bg-gradient-to-t from-[#180A0A] via-[#180A0A]/80 to-transparent 
                   z-30 pointer-events-none" />
    </section>;
};
export default HeroSection;