import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';
import { VideoDebugger } from '@/utils/videoDebugger';

interface Video {
  id: string;
  video_url: string;
  video_nome: string;
}

interface CommercialVideoHeroProps {
  videos: Video[];
  className?: string;
  onPlaylistEnd?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export const CommercialVideoHero: React.FC<CommercialVideoHeroProps> = ({
  videos,
  className,
  onPlaylistEnd,
  onPlayingChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hash estável para detectar mudanças na playlist
  const videosHash = useMemo(() => {
    const hash = videos.map(v => v.id).sort().join(',');
    VideoDebugger.logEvent('HASH', 'Hash calculado', { hash, count: videos.length });
    return hash;
  }, [videos]);

  // Resetar para primeiro vídeo quando playlist mudar
  useEffect(() => {
    VideoDebugger.logEvent('PLAYLIST', 'Resetando para início', {
      hash: videosHash,
      count: videos.length
    });
    setCurrentIndex(0);
  }, [videosHash, videos.length]);

  // Callbacks estáveis para event listeners
  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    VideoDebugger.logEvent('VIDEO', 'Pronto para reproduzir', {
      duração: video.duration.toFixed(1) + 's'
    });
    setIsBuffering(false);
    onPlayingChange?.(true);
  }, [onPlayingChange]);

  const handleEnded = useCallback(() => {
    const currentVideo = videos[currentIndex];
    VideoDebugger.logEvent('VIDEO', 'Terminou', {
      nome: currentVideo?.video_nome
    });
    
    onPlayingChange?.(false);
    
    const nextIndex = (currentIndex + 1) % videos.length;
    
    if (nextIndex === 0 && onPlaylistEnd) {
      VideoDebugger.logEvent('PLAYLIST', 'Ciclo completo');
      onPlaylistEnd();
    }

    setCurrentIndex(nextIndex);
  }, [currentIndex, videos, onPlaylistEnd, onPlayingChange]);

  const handleError = useCallback(() => {
    const currentVideo = videos[currentIndex];
    VideoDebugger.logEvent('VIDEO', 'Erro - pulando', {
      nome: currentVideo?.video_nome
    });

    setIsBuffering(false);
    onPlayingChange?.(false);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 2000);
  }, [currentIndex, videos, onPlayingChange]);

  // Gerenciar reprodução de vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) {
      VideoDebugger.logEvent('VIDEO', 'Erro: índice inválido', { currentIndex, videosLength: videos.length });
      return;
    }

    VideoDebugger.logEvent('VIDEO', 'Carregando', {
      index: `${currentIndex + 1}/${videos.length}`,
      nome: currentVideo.video_nome
    });

    setIsBuffering(true);

    // Adicionar event listeners
    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Atualizar source e carregar vídeo
    const sourceElement = video.querySelector('source');
    if (sourceElement && sourceElement.src !== currentVideo.video_url) {
      sourceElement.src = currentVideo.video_url;
      video.load();
    } else if (!sourceElement) {
      video.load();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, videosHash, handleMetadata, handleEnded, handleError, videos]);

  if (videos.length === 0) {
    return (
      <div className={cn(
        "w-full aspect-video bg-black rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-white/60">Nenhum vídeo disponível</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];
  if (!currentVideo) {
    return (
      <div className={cn(
        "w-full aspect-video bg-black rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-white/60">Erro ao carregar vídeo</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative w-full aspect-video bg-black rounded-lg overflow-hidden",
        className
      )}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Elemento de vídeo - SEM key prop para evitar remontagens */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      >
        <source src={currentVideo.video_url} type="video/mp4" />
      </video>

      <VideoWatermark />

      {/* Indicador de buffering */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          <p className="text-white/80 text-sm">Carregando...</p>
        </div>
      )}
    </div>
  );
};
