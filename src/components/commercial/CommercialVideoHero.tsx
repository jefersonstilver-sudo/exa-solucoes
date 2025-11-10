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
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];
  const nextVideo = videos[(currentIndex + 1) % videos.length];

  // Debug: resetar index quando videos mudar
  useEffect(() => {
    console.log('[COMMERCIAL HERO] Videos array updated:', videos.length, 'videos');
    console.log('[COMMERCIAL HERO] Video names:', videos.map(v => v.video_nome));
    
    // Resetar para primeiro video quando array mudar
    if (videos.length > 0 && currentIndex >= videos.length) {
      console.log('[COMMERCIAL HERO] Resetting index to 0');
      setCurrentIndex(0);
    }
  }, [videos, currentIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    console.log('[COMMERCIAL HERO] Total videos in playlist:', videos.length);

    const handleVideoEnd = () => {
      console.log('[COMMERCIAL HERO] Video ended, advancing to next...');
      const nextIndex = (currentIndex + 1) % videos.length;
      console.log('[COMMERCIAL HERO] Next index:', nextIndex);
      
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsTransitioning(false);
        setVideoError(false);
      }, 150);
    };

    const handleCanPlay = () => {
      video.play().catch(err => console.log('[COMMERCIAL HERO] Autoplay prevented:', err));
    };

    const handleError = () => {
      console.error('[COMMERCIAL HERO] Erro ao reproduzir video, pulando para proximo...');
      setVideoError(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
      }, 1000);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, videos.length]);

  // Renderizar key único baseado em URL E index para forçar re-render
  const videoKey = `${currentVideo?.video_url}-${currentIndex}`;

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

  console.log('[COMMERCIAL HERO] Rendering video', currentIndex + 1, 'of', videos.length, ':', currentVideo?.video_nome);

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
        className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        {/* Vídeo atual com proteção e error handling */}
        {currentVideo && !videoError && (
          <div className={cn(
            "w-full h-full transition-opacity duration-150",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}>
            <video
              ref={videoRef}
              key={videoKey}
              src={currentVideo.video_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
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
