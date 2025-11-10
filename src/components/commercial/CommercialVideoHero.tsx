import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';
import { useVideoProtection } from '@/hooks/useVideoProtection';

interface Video {
  id: string;
  video_url: string;
  video_nome: string;
}

interface CommercialVideoHeroProps {
  videos: Video[];
  className?: string;
}

export const CommercialVideoHero: React.FC<CommercialVideoHeroProps> = ({ 
  videos,
  className 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const { containerRef } = useVideoProtection({
    preventDownload: true,
    preventPrint: true,
    preventDevTools: true,
    preventScreenCapture: true
  });

  const currentVideo = videos[currentIndex];
  const nextVideo = videos[(currentIndex + 1) % videos.length];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const handleVideoEnd = () => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setIsTransitioning(false);
      }, 150);
    };

    const handleCanPlay = () => {
      video.play().catch(err => console.log('Autoplay prevented:', err));
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentIndex, videos.length]);

  if (videos.length === 0) {
    return (
      <div className={cn(
        "w-full aspect-video bg-black/50 rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-white/60">Nenhum vídeo disponível</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Video Container - Responsivo com Proteção */}
      <div 
        className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl select-none"
        style={{
          aspectRatio: '16/9',
          maxHeight: '60vh'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Vídeo atual com proteção */}
        {currentVideo && (
          <div className={cn(
            "w-full h-full transition-opacity duration-150",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}>
            <video
              ref={videoRef}
              key={currentVideo.video_url}
              src={currentVideo.video_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              preload="auto"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              disableRemotePlayback
              onContextMenu={(e) => e.preventDefault()}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}
        
        {/* MARCA D'ÁGUA - PROTEÇÃO ANTI-PIRATARIA */}
        <VideoWatermark />
        
        {/* Overlay de proteção invisível - bloqueia extensões */}
        <div 
          className="absolute inset-0 z-50" 
          style={{ 
            background: 'transparent',
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* Overlay com gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-40" />
        
        {/* Indicadores de progresso */}
        {videos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-[60]">
            {videos.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? "w-8 bg-white" 
                    : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preload próximo vídeo */}
      {nextVideo && (
        <video
          ref={nextVideoRef}
          src={nextVideo.video_url}
          preload="auto"
          muted
          playsInline
          className="hidden"
        />
      )}
    </div>
  );
};
