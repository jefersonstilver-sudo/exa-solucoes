import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';

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
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const transitionLockRef = useRef(false);

  const currentVideo = videos[currentIndex];
  const nextVideoIndex = (currentIndex + 1) % videos.length;
  const nextVideo = videos[nextVideoIndex];

  // Reset quando playlist mudar
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos.length, currentIndex]);

  // Gerenciar vídeo atual
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    transitionLockRef.current = false;
    setIsReady(false);

    // Handler unificado para carregar e reproduzir
    const startPlayback = () => {
      setIsReady(true);
      video.play().catch(() => {
        // Tentar novamente após delay
        setTimeout(() => video.play().catch(() => {}), 100);
      });
    };

    // Handler para pré-carregar próximo
    const preloadNext = () => {
      const timeRemaining = video.duration - video.currentTime;
      if (timeRemaining <= 5 && timeRemaining > 4.5 && nextVideoRef.current) {
        nextVideoRef.current.load();
      }
    };

    // Handler para transição
    const handleTransition = () => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;
      
      requestAnimationFrame(() => {
        setCurrentIndex(nextVideoIndex);
      });
    };

    // Handler de erro
    const handleError = () => {
      if (!transitionLockRef.current) {
        setTimeout(() => setCurrentIndex(nextVideoIndex), 1000);
      }
    };

    // Adicionar listeners
    video.addEventListener('loadeddata', startPlayback);
    video.addEventListener('canplay', startPlayback);
    video.addEventListener('timeupdate', preloadNext);
    video.addEventListener('ended', handleTransition);
    video.addEventListener('error', handleError);

    // Iniciar carregamento
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('loadeddata', startPlayback);
      video.removeEventListener('canplay', startPlayback);
      video.removeEventListener('timeupdate', preloadNext);
      video.removeEventListener('ended', handleTransition);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, currentVideo, nextVideoIndex]);

  if (videos.length === 0) {
    return (
      <div className={cn("w-full h-full bg-black/50 rounded-lg flex items-center justify-center", className)}>
        <p className="text-white/60">Nenhum vídeo disponível</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Container principal */}
      <div className="absolute inset-0 w-full h-full bg-black rounded-lg overflow-hidden">
        {/* Vídeo principal */}
        <video
          key={`${currentVideo.id}-${currentIndex}`}
          ref={videoRef}
          src={currentVideo.video_url}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isReady ? "opacity-100" : "opacity-0"
          )}
          autoPlay
          muted
          playsInline
          preload="auto"
          controlsList="nodownload noplaybackrate nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          style={{ pointerEvents: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Loading */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="animate-pulse text-white/60 text-sm">Carregando...</div>
          </div>
        )}

        {/* Marca d'água */}
        <VideoWatermark />
        
        {/* Proteção */}
        <div 
          className="absolute inset-0 z-[100]" 
          style={{ 
            background: 'transparent',
            pointerEvents: 'auto'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => e.button === 2 && e.preventDefault()}
        />
      </div>

      {/* Pre-load próximo */}
      {nextVideo && (
        <video
          ref={nextVideoRef}
          src={nextVideo.video_url}
          className="hidden"
          preload="auto"
          muted
          playsInline
        />
      )}
    </div>
  );
};
