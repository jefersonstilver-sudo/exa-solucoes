import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';

const BuildingDisplayCommercial = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { videos: activeVideos, loading } = useBuildingActiveVideos(buildingId || '');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-avançar com transição suave
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
        setSelectedVideoIndex(nextIndex);
        setIsTransitioning(false);
      }, 300);
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [selectedVideoIndex, activeVideos.length]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading - elegante
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header fixo premium com logo EXA */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-2xl">
        <div className="container mx-auto px-8 h-20 flex items-center justify-between">
          {/* Logo EXA com efeito brilhante */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Glow background */}
              <div className="absolute inset-0 blur-xl bg-white/30 rounded-full scale-150" />
              
              {/* Logo */}
              <svg viewBox="0 0 100 35" className="h-12 w-auto relative z-10">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.95 }} />
                    <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <text 
                  x="10" 
                  y="24" 
                  fill="url(#logoGradient)" 
                  fontSize="28" 
                  fontWeight="800" 
                  fontFamily="'Inter', 'Poppins', sans-serif" 
                  letterSpacing="3"
                  filter="url(#glow)"
                >
                  EXA
                </text>
              </svg>
            </div>
            
            {/* Divisor */}
            <div className="w-px h-10 bg-white/30" />
            
            {/* Subtitle */}
            <span className="text-white text-base font-light tracking-[0.25em] uppercase">
              Digital Signage
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo principal com painel centralizado */}
      <main className="min-h-screen pt-20 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          {/* Container do painel - simula monitor/TV físico */}
          <div className="relative">
            {/* Moldura externa - simula bezel de monitor */}
            <div className="absolute -inset-8 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-3xl shadow-2xl" />
            
            {/* Moldura interna - profundidade */}
            <div className="absolute -inset-4 bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-inner" />
            
            {/* Tela do painel */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
              {/* Brilho da tela */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-20" />
              
              {/* Vídeo */}
              {selectedVideo && (
                <div className={`w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  <video
                    ref={videoRef}
                    key={selectedVideo.video_url}
                    src={selectedVideo.video_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    style={{ pointerEvents: 'none' }}
                  >
                    Seu navegador não suporta vídeo.
                  </video>
                </div>
              )}
              
              {/* Reflexo sutil simulando vidro */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-transparent pointer-events-none z-10" />
            </div>

            {/* Suporte/base do monitor (detalhe visual) */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-lg shadow-lg" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-b from-zinc-900 to-black rounded-full shadow-xl" />
          </div>
        </div>
      </main>

      {/* Footer discreto */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm">
        <div className="text-center">
          <p className="text-white/40 text-xs font-light tracking-[0.3em] uppercase">
            Powered by EXA Mídia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BuildingDisplayCommercial;
