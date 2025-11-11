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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevHashRef = useRef<string>('');
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef({
    cyclesCompleted: 0,
    videosPlayed: 0,
    errors: 0,
    startTime: Date.now()
  });

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
      setIsPlaying(false);
    }
    prevHashRef.current = videosHash;
  }, [videosHash]);

  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  // Health check periódico
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      
      const healthData = {
        currentIndex,
        totalVideos: videos.length,
        isPlaying: !video.paused,
        currentTime: video.currentTime.toFixed(1),
        duration: video.duration ? video.duration.toFixed(1) : 'N/A',
        readyState: video.readyState,
        networkState: video.networkState,
        buffered: video.buffered.length > 0 ? video.buffered.end(0).toFixed(1) : 0,
        cycles: metricsRef.current.cyclesCompleted,
        videosPlayed: metricsRef.current.videosPlayed,
        errors: metricsRef.current.errors
      };
      
      VideoDebugger.logEvent('HEALTH', 'Check periódico', healthData);
      
      // Detectar vídeo travado
      if (!video.paused && video.currentTime === 0 && video.readyState === 4) {
        VideoDebugger.logEvent('HEALTH', 'Vídeo travado - tentando play', healthData);
        video.play().catch(err => {
          VideoDebugger.logEvent('HEALTH', 'Erro ao tentar play', { error: err.message });
        });
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) {
      VideoDebugger.logEvent('VIDEO', 'Erro: índice inválido', { currentIndex, videosLength: videos.length });
      metricsRef.current.errors++;
      return;
    }

    VideoDebugger.logEvent('VIDEO', 'Carregando', {
      index: currentIndex + 1,
      total: videos.length,
      nome: currentVideo.video_nome,
      id: currentVideo.id,
      url: currentVideo.video_url
    });

    setIsBuffering(true);
    setIsPlaying(false);

    const onMetadata = () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      
      VideoDebugger.logEvent('VIDEO', 'Metadados carregados', {
        duração: video.duration.toFixed(1) + 's',
        readyState: video.readyState
      });

      video.play()
        .then(() => {
          setIsBuffering(false);
          setIsPlaying(true);
          VideoDebugger.logEvent('VIDEO', 'Play iniciado');
          
          const safetyDuration = (video.duration + 10) * 1000;
          safetyTimeoutRef.current = setTimeout(() => {
            VideoDebugger.logEvent('SAFETY', 'Timeout - forçando próximo', {
              currentTime: video.currentTime,
              duration: video.duration
            });
            const nextIndex = (currentIndex + 1) % videos.length;
            setCurrentIndex(nextIndex);
          }, safetyDuration);
        })
        .catch(error => {
          VideoDebugger.logEvent('VIDEO', 'Erro ao play', { error: error.message });
          metricsRef.current.errors++;
          setIsPlaying(false);
        });
    };

    const onEnded = () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      
      metricsRef.current.videosPlayed++;
      
      VideoDebugger.logEvent('VIDEO', 'Vídeo terminou', {
        nome: currentVideo.video_nome,
        currentTime: video.currentTime.toFixed(1) + 's'
      });

      setIsPlaying(false);
      const nextIndex = (currentIndex + 1) % videos.length;
      
      if (nextIndex === 0) {
        metricsRef.current.cyclesCompleted++;
        const elapsed = (Date.now() - metricsRef.current.startTime) / 1000;
        
        VideoDebugger.logEvent('METRICS', 'Ciclo completo', {
          cycles: metricsRef.current.cyclesCompleted,
          videosPlayed: metricsRef.current.videosPlayed,
          errors: metricsRef.current.errors,
          uptime: `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toFixed(0)}s`,
          avgTimePerCycle: metricsRef.current.cyclesCompleted > 0 
            ? (elapsed / metricsRef.current.cyclesCompleted).toFixed(1) + 's'
            : 'N/A'
        });
        
        if (onPlaylistEnd) onPlaylistEnd();
      }

      VideoDebugger.logEvent('VIDEO', 'Avançando', { from: currentIndex + 1, to: nextIndex + 1, total: videos.length });
      setCurrentIndex(nextIndex);
    };

    const onError = (e: Event) => {
      metricsRef.current.errors++;
      
      VideoDebugger.logEvent('VIDEO', 'Erro ao carregar', {
        nome: currentVideo.video_nome,
        url: currentVideo.video_url,
        error: (e.target as HTMLVideoElement).error,
        errorCode: (e.target as HTMLVideoElement).error?.code
      });

      setIsBuffering(false);
      setIsPlaying(false);

      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        VideoDebugger.logEvent('VIDEO', 'Pulando após erro', { nextIndex });
        setCurrentIndex(nextIndex);
      }, 2000);
    };

    const onWaiting = () => {
      VideoDebugger.logEvent('VIDEO', 'Buffering');
      setIsBuffering(true);
    };

    const onPlaying = () => {
      VideoDebugger.logEvent('VIDEO', 'Playing');
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const onStalled = () => {
      VideoDebugger.logEvent('VIDEO', 'Vídeo travado (stalled)');
      setTimeout(() => {
        if (video.paused) {
          VideoDebugger.logEvent('VIDEO', 'Tentando retomar');
          video.play().catch(err => {
            VideoDebugger.logEvent('VIDEO', 'Falha ao retomar - pulando', { error: err.message });
            metricsRef.current.errors++;
            const nextIndex = (currentIndex + 1) % videos.length;
            setCurrentIndex(nextIndex);
          });
        }
      }, 3000);
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('stalled', onStalled);

    video.load();
    setIsBuffering(true);

    return () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('stalled', onStalled);
    };
  }, [currentIndex, videos, onPlaylistEnd]);

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
