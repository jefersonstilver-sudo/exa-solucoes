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
  const hasEndedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const currentVideo = videos[currentIndex];
  const nextVideoIndex = (currentIndex + 1) % videos.length;
  const nextVideo = videos[nextVideoIndex];

  // 🔄 Reset quando playlist mudar
  useEffect(() => {
    console.log('🎬 [VIDEO HERO] Playlist:', videos.length, 'vídeos');
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    hasEndedRef.current = false;
    isTransitioningRef.current = false;
    setIsReady(false);

    console.log(`▶️ [VIDEO HERO] Carregando vídeo ${currentIndex + 1}/${videos.length}:`, currentVideo.video_nome);

    const handleLoadedData = () => {
      console.log('✅ [VIDEO HERO] Vídeo carregado e pronto');
      setIsReady(true);
    };

    const handleCanPlay = () => {
      console.log('🎵 [VIDEO HERO] Vídeo pode ser reproduzido');
      if (!isReady) {
        video.play()
          .then(() => console.log('▶️ [VIDEO HERO] Reprodução iniciada'))
          .catch(err => console.warn('⚠️ [VIDEO HERO] Autoplay bloqueado:', err));
      }
    };

    const handlePlaying = () => {
      console.log('🎬 [VIDEO HERO] Vídeo reproduzindo');
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      if (!video || isTransitioningRef.current) return;
      
      const timeRemaining = video.duration - video.currentTime;
      
      // Pre-carregar próximo vídeo quando faltar 5 segundos
      if (timeRemaining <= 5 && timeRemaining > 4.5 && nextVideoRef.current) {
        console.log('⏭️ [VIDEO HERO] Pre-carregando próximo vídeo');
        nextVideoRef.current.load();
      }
    };

    const handleEnded = () => {
      if (hasEndedRef.current || isTransitioningRef.current) {
        console.log('⚠️ [VIDEO HERO] Evento "ended" duplicado ignorado');
        return;
      }

      hasEndedRef.current = true;
      isTransitioningRef.current = true;
      
      console.log('🔄 [VIDEO HERO] Vídeo finalizado, avançando para o próximo...');
      
      // Aguardar frame antes de trocar para evitar flicker
      requestAnimationFrame(() => {
        setCurrentIndex(nextVideoIndex);
        
        if (nextVideoIndex === 0) {
          console.log('🔄 [VIDEO HERO] Playlist completa - ciclo reiniciado');
        }
      });
    };

    const handleError = (e: Event) => {
      console.error('❌ [VIDEO HERO] Erro ao carregar vídeo:', e);
      setIsReady(false);
      // Tentar próximo vídeo após erro
      setTimeout(() => {
        if (!isTransitioningRef.current) {
          console.log('⏭️ [VIDEO HERO] Pulando para próximo vídeo devido a erro');
          setCurrentIndex(nextVideoIndex);
        }
      }, 1000);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Forçar load
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, currentVideo, nextVideoIndex, videos.length]);

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
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Container principal do vídeo */}
      <div className="absolute inset-0 w-full h-full bg-black rounded-lg overflow-hidden">
        {/* Vídeo principal */}
        <video
          key={`video-${currentIndex}-${currentVideo.id}`}
          ref={videoRef}
          src={currentVideo.video_url}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isReady ? "opacity-100" : "opacity-0"
          )}
          autoPlay
          muted
          playsInline
          preload="auto"
          controlsList="nodownload noplaybackrate nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          style={{ 
            pointerEvents: 'none',
            userSelect: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Loading placeholder */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-white text-sm">Carregando...</div>
          </div>
        )}

        {/* MARCA D'ÁGUA */}
        <VideoWatermark />
        
        {/* Proteção invisível */}
        <div 
          className="absolute inset-0 z-[100]" 
          style={{ 
            background: 'transparent',
            pointerEvents: 'auto',
            cursor: 'default'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => e.button === 2 && e.preventDefault()}
        />
      </div>

      {/* Pre-load próximo vídeo (invisível) */}
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
