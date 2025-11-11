import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const prevHashRef = useRef<string>('');

  const videosHash = useMemo(() => {
    const hash = videos.map(v => v.id).sort().join(',');
    VideoDebugger.logEvent('HASH', 'Hash calculado', { hash, count: videos.length });
    return hash;
  }, [videos]);

  useEffect(() => {
    if (prevHashRef.current !== '' && prevHashRef.current !== videosHash) {
      VideoDebugger.logEvent('PLAYLIST', 'Vídeos mudaram - resetando', {
        prevHash: prevHashRef.current,
        newHash: videosHash
      });
      setCurrentIndex(0);
    }
    prevHashRef.current = videosHash;
  }, [videosHash]);


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

    const onMetadata = () => {
      VideoDebugger.logEvent('VIDEO', 'Pronto', {
        duração: video.duration.toFixed(1) + 's'
      });
      setIsBuffering(false);
      if (onPlayingChange) onPlayingChange(true);
    };

    const onEnded = () => {
      VideoDebugger.logEvent('VIDEO', 'Terminou', {
        nome: currentVideo.video_nome
      });
      
      if (onPlayingChange) onPlayingChange(false);
      
      const nextIndex = (currentIndex + 1) % videos.length;
      
      if (nextIndex === 0 && onPlaylistEnd) {
        onPlaylistEnd();
      }

      setCurrentIndex(nextIndex);
    };

    const onError = () => {
      VideoDebugger.logEvent('VIDEO', 'Erro - pulando', {
        nome: currentVideo.video_nome
      });

      setIsBuffering(false);
      if (onPlayingChange) onPlayingChange(false);

      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        setCurrentIndex(nextIndex);
      }, 2000);
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [currentIndex, videos, onPlaylistEnd, onPlayingChange]);

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
      {/* Elemento de vídeo */}
      <video
        ref={videoRef}
        key={currentVideo.id}
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
