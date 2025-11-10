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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Header premium com logo EXA e gradiente */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="relative h-20 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-xl">
          {/* Glow effect superior */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          
          {/* Logo EXA com efeito brilhante */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <div className="relative">
              {/* Glow background */}
              <div className="absolute inset-0 blur-xl bg-white/30 rounded-full scale-150" />
              
              {/* Logo */}
              <svg viewBox="0 0 100 35" className="h-10 w-auto relative z-10">
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
            <div className="w-px h-8 bg-white/30" />
            
            {/* Subtitle */}
            <span className="text-white/90 text-sm font-light tracking-[0.2em] uppercase">
              Digital Signage
            </span>
          </div>
        </div>
        
        {/* Shadow do header */}
        <div className="h-4 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Moldura lateral sutil - simula hardware físico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-black/60 to-transparent z-20" />
        <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/60 to-transparent z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/60 to-transparent z-20" />
      </div>

      {/* Vídeo player - área principal */}
      <div className="min-h-screen pt-20 flex items-center justify-center bg-black">
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
      </div>

      {/* Reflexo sutil simulando vidro do painel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] via-transparent to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default BuildingDisplayCommercial;
