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
  const [nextIndex, setNextIndex] = useState(1);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const preloadCheckRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = videos[currentIndex];
  const nextVideo = videos[nextIndex] || videos[0];

  // 🔄 Atualizar índices quando playlist mudar
  useEffect(() => {
    console.log('🎬 [VIDEO HERO] Playlist atualizada:', videos.length, 'vídeos');
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
      setNextIndex(1 % videos.length);
    }
  }, [videos, currentIndex]);

  // 🎯 Sistema de pre-loading inteligente
  useEffect(() => {
    const activeVideo = activePlayer === 1 ? video1Ref.current : video2Ref.current;
    const nextVideoEl = activePlayer === 1 ? video2Ref.current : video1Ref.current;
    
    if (!activeVideo || !nextVideoEl || videos.length === 0) return;

    const checkAndPreload = () => {
      const timeRemaining = activeVideo.duration - activeVideo.currentTime;
      
      // 🔥 Quando faltar 3 segundos, garantir que o próximo vídeo está pronto
      if (timeRemaining <= 3 && timeRemaining > 0) {
        if (nextVideoEl.readyState < 3) {
          console.log('⚡ [VIDEO HERO] Forçando pre-load do próximo vídeo');
          nextVideoEl.load();
        }
      }
    };

    const handleTimeUpdate = () => {
      checkAndPreload();
    };

    const handleVideoEnd = () => {
      console.log('✅ [VIDEO HERO] Vídeo finalizado, trocando...');
      
      // Trocar para o próximo vídeo INSTANTANEAMENTE
      const newCurrentIndex = nextIndex;
      const newNextIndex = (nextIndex + 1) % videos.length;
      
      setCurrentIndex(newCurrentIndex);
      setNextIndex(newNextIndex);
      setActivePlayer(activePlayer === 1 ? 2 : 1);
      
      // Iniciar próximo vídeo imediatamente
      nextVideoEl.currentTime = 0;
      nextVideoEl.play().catch(err => 
        console.warn('⚠️ [VIDEO HERO] Erro ao iniciar próximo vídeo:', err)
      );
    };

    activeVideo.addEventListener('timeupdate', handleTimeUpdate);
    activeVideo.addEventListener('ended', handleVideoEnd);
    
    // Iniciar reprodução se necessário
    if (activeVideo.paused) {
      activeVideo.play().catch(err => 
        console.warn('⚠️ [VIDEO HERO] Autoplay bloqueado:', err)
      );
    }

    return () => {
      activeVideo.removeEventListener('timeupdate', handleTimeUpdate);
      activeVideo.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentIndex, nextIndex, activePlayer, videos.length]);

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
      {/* 🎬 Player 1 - Alternância suave */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full bg-black rounded-lg overflow-hidden transition-opacity duration-300",
          activePlayer === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
      >
        <video
          ref={video1Ref}
          src={currentVideo?.video_url}
          className="w-full h-full object-cover"
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
      </div>

      {/* 🎬 Player 2 - Alternância suave */}
      <div 
        className={cn(
          "absolute inset-0 w-full h-full bg-black rounded-lg overflow-hidden transition-opacity duration-300",
          activePlayer === 2 ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
      >
        <video
          ref={video2Ref}
          src={nextVideo?.video_url}
          className="w-full h-full object-cover"
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
      </div>

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
  );
};
