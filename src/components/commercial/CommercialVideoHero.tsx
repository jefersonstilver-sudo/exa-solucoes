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
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div 
      ref={containerRef} 
      className={cn("relative w-full", className)}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      {/* Video Container - Responsivo com Proteção */}
      <div 
        className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
        style={{
          aspectRatio: '16/9',
          maxHeight: '60vh',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
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
              loop={videos.length === 1}
              playsInline
              preload="auto"
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              disableRemotePlayback
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              onDragStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              style={{ 
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />
          </div>
        )}
        
        {/* MARCA D'ÁGUA - PROTEÇÃO ANTI-PIRATARIA */}
        <VideoWatermark />
        
        {/* Overlay de proteção invisível - bloqueia TUDO */}
        <div 
          className="absolute inset-0 z-[100]" 
          style={{ 
            background: 'transparent',
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: 'default'
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onMouseDown={(e) => {
            if (e.button === 2) { // Botão direito
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
        />
        
        {/* Overlay com gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-40" />
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
