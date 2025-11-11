import React, { useState, useRef, useEffect } from 'react';
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
  onPlaylistEnd?: () => void;
}

export const CommercialVideoHero: React.FC<CommercialVideoHeroProps> = ({
  videos,
  className,
  onPlaylistEnd
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionLockRef = useRef(false);
  const previousVideosRef = useRef<string>('');

  // Reset index ONLY when videos actually change (not same list)
  useEffect(() => {
    const currentVideoIds = videos.map(v => v.id).join(',');
    const hasChanged = previousVideosRef.current !== currentVideoIds;
    
    console.log('🎬 [PLAYLIST] Videos changed:', {
      hasChanged,
      currentIds: currentVideoIds,
      previousIds: previousVideosRef.current,
      currentIndex,
      videosLength: videos.length
    });

    if (hasChanged) {
      console.log('🔄 [PLAYLIST] Resetando playlist - vídeos realmente mudaram');
      previousVideosRef.current = currentVideoIds;
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  }, [videos, currentIndex]);

  // Handle video playback and transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    console.log('🎬 [VIDEO] Configurando vídeo:', {
      currentIndex,
      videoId: videos[currentIndex]?.id,
      videoName: videos[currentIndex]?.video_nome,
      readyState: video.readyState,
      duration: video.duration,
      currentTime: video.currentTime
    });

    const handleLoadedMetadata = () => {
      console.log('📊 [VIDEO] Metadata carregada:', {
        duration: video.duration,
        videoId: videos[currentIndex]?.id,
        videoName: videos[currentIndex]?.video_nome
      });
    };

    const handleCanPlay = () => {
      console.log('✅ [VIDEO] Can play:', {
        isPlaying,
        videoId: videos[currentIndex]?.id,
        duration: video.duration,
        currentTime: video.currentTime
      });
      
      if (!isPlaying) {
        video.play()
          .then(() => {
            console.log('▶️ [VIDEO] Reprodução iniciada:', {
              videoId: videos[currentIndex]?.id,
              videoName: videos[currentIndex]?.video_nome
            });
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('❌ [VIDEO] Erro ao iniciar reprodução:', error);
          });
      }
    };

    const handleTimeUpdate = () => {
      const timeRemaining = video.duration - video.currentTime;
      if (timeRemaining <= 0.5 && timeRemaining > 0) {
        console.log('⏱️ [VIDEO] Próximo do fim:', {
          currentTime: video.currentTime,
          duration: video.duration,
          remaining: timeRemaining
        });
      }
    };

    const handleEnded = () => {
      console.log('🏁 [VIDEO] Vídeo terminou:', {
        videoId: videos[currentIndex]?.id,
        videoName: videos[currentIndex]?.video_nome,
        duration: video.duration,
        currentTime: video.currentTime,
        isLocked: transitionLockRef.current
      });

      if (transitionLockRef.current) {
        console.log('🔒 [VIDEO] Transição bloqueada, ignorando ended event');
        return;
      }
      
      transitionLockRef.current = true;

      const nextIndex = (currentIndex + 1) % videos.length;
      
      console.log('➡️ [VIDEO] Mudando para próximo vídeo:', {
        currentIndex,
        nextIndex,
        nextVideoId: videos[nextIndex]?.id,
        nextVideoName: videos[nextIndex]?.video_nome
      });
      
      // Se voltou ao início da playlist, notificar pai
      if (nextIndex === 0 && onPlaylistEnd) {
        console.log('🔄 [PLAYLIST] Fim da playlist, voltando ao início');
        onPlaylistEnd();
      }
      
      setCurrentIndex(nextIndex);
      setIsPlaying(false);

      setTimeout(() => {
        transitionLockRef.current = false;
        console.log('🔓 [VIDEO] Transição desbloqueada');
      }, 500);
    };

    const handleError = (e: Event) => {
      console.error('❌ [VIDEO] Erro no vídeo:', {
        error: e,
        videoId: videos[currentIndex]?.id,
        videoUrl: videos[currentIndex]?.video_url,
        networkState: video.networkState,
        readyState: video.readyState
      });

      if (transitionLockRef.current) return;
      transitionLockRef.current = true;

      const nextIndex = (currentIndex + 1) % videos.length;
      console.log('⏭️ [VIDEO] Pulando para próximo vídeo devido a erro');
      
      setCurrentIndex(nextIndex);
      setIsPlaying(false);

      setTimeout(() => {
        transitionLockRef.current = false;
      }, 1000);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Try to play if video is already ready
    if (video.readyState >= 3) {
      console.log('🚀 [VIDEO] Vídeo já pronto, iniciando reprodução');
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, videos, isPlaying, onPlaylistEnd]);

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

  return (
    <div 
      className={cn(
        "relative w-full aspect-video bg-black rounded-lg overflow-hidden",
        className
      )}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={currentVideo.video_url}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
      />

      <VideoWatermark />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
};
