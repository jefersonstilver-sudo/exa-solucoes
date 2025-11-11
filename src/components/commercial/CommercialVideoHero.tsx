import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionLockRef = useRef(false);
  const previousVideosRef = useRef<string>('');
  const hasEndedRef = useRef(false);
  const playAttemptRef = useRef<number>(0);

  // Reset index ONLY when videos actually change (not same list)
  useEffect(() => {
    const currentVideoIds = videos.map(v => v.id).join(',');
    const hasChanged = previousVideosRef.current !== currentVideoIds && previousVideosRef.current !== '';
    
    console.log('🎬 [PLAYLIST] Verificando mudança de vídeos:', {
      hasChanged,
      currentIds: currentVideoIds,
      previousIds: previousVideosRef.current,
      currentIndex,
      videosLength: videos.length
    });

    if (hasChanged && videos.length > 0) {
      console.log('🔄 [PLAYLIST] Resetando playlist - vídeos realmente mudaram');
      setCurrentIndex(0);
      setIsPlaying(false);
      setIsBuffering(false);
      transitionLockRef.current = false;
      hasEndedRef.current = false;
    }
    
    if (videos.length > 0) {
      previousVideosRef.current = currentVideoIds;
    }
  }, [videos, currentIndex]);

  // Garantir que o vídeo seja reproduzido completamente
  const handleVideoEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Verificar se realmente chegou ao fim
    const timeRemaining = video.duration - video.currentTime;
    const isReallyEnded = timeRemaining < 0.5 && video.ended;

    console.log('🏁 [VIDEO] handleVideoEnd chamado:', {
      currentTime: video.currentTime.toFixed(2),
      duration: video.duration.toFixed(2),
      timeRemaining: timeRemaining.toFixed(2),
      ended: video.ended,
      isReallyEnded,
      hasEndedRef: hasEndedRef.current,
      isLocked: transitionLockRef.current,
      videoId: videos[currentIndex]?.id,
      videoName: videos[currentIndex]?.video_nome
    });

    // Prevenir múltiplas chamadas
    if (hasEndedRef.current || transitionLockRef.current) {
      console.log('⚠️ [VIDEO] Transição já em andamento, ignorando');
      return;
    }

    if (!isReallyEnded) {
      console.log('⚠️ [VIDEO] Vídeo não terminou completamente, ignorando ended event');
      return;
    }

    hasEndedRef.current = true;
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
    
    setIsPlaying(false);
    setIsBuffering(true);
    setCurrentIndex(nextIndex);

    // Resetar flags após transição
    setTimeout(() => {
      transitionLockRef.current = false;
      hasEndedRef.current = false;
      playAttemptRef.current = 0;
      console.log('🔓 [VIDEO] Transição desbloqueada');
    }, 1000);
  }, [currentIndex, videos, onPlaylistEnd]);

  // Tentar reproduzir o vídeo com retry
  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isPlaying) return;

    try {
      playAttemptRef.current++;
      console.log(`▶️ [VIDEO] Tentativa ${playAttemptRef.current} de reprodução:`, {
        videoId: videos[currentIndex]?.id,
        videoName: videos[currentIndex]?.video_nome,
        readyState: video.readyState,
        networkState: video.networkState,
        currentTime: video.currentTime,
        duration: video.duration
      });

      await video.play();
      setIsPlaying(true);
      setIsBuffering(false);
      playAttemptRef.current = 0;
      
      console.log('✅ [VIDEO] Reprodução iniciada com sucesso');
    } catch (error: any) {
      console.error('❌ [VIDEO] Erro ao reproduzir:', error.message);
      setIsBuffering(true);

      // Retry após 1 segundo se não exceder 5 tentativas
      if (playAttemptRef.current < 5) {
        setTimeout(() => attemptPlay(), 1000);
      } else {
        console.error('❌ [VIDEO] Máximo de tentativas excedido, pulando para próximo');
        handleVideoEnd();
      }
    }
  }, [isPlaying, videos, currentIndex, handleVideoEnd]);

  // Handle video playback events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    console.log('🎬 [VIDEO] Configurando event listeners para:', {
      currentIndex,
      videoId: videos[currentIndex]?.id,
      videoName: videos[currentIndex]?.video_nome
    });

    const handleLoadedMetadata = () => {
      console.log('📊 [VIDEO] Metadata carregada:', {
        duration: video.duration.toFixed(2),
        videoId: videos[currentIndex]?.id
      });
    };

    const handleLoadedData = () => {
      console.log('📦 [VIDEO] Data carregada, pronto para reproduzir');
      setIsBuffering(false);
    };

    const handleCanPlay = () => {
      console.log('✅ [VIDEO] Can play - tentando reproduzir');
      attemptPlay();
    };

    const handleWaiting = () => {
      console.log('⏳ [VIDEO] Buffering...');
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      console.log('▶️ [VIDEO] Playing');
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      console.log('⏸️ [VIDEO] Pausado');
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      
      const progress = (video.currentTime / video.duration) * 100;
      const timeRemaining = video.duration - video.currentTime;
      
      // Log apenas nos últimos 5 segundos
      if (timeRemaining <= 5 && timeRemaining > 0) {
        console.log('⏱️ [VIDEO] Próximo do fim:', {
          currentTime: video.currentTime.toFixed(2),
          duration: video.duration.toFixed(2),
          remaining: timeRemaining.toFixed(2),
          progress: progress.toFixed(1) + '%'
        });
      }
    };

    const handleError = (e: Event) => {
      const error = video.error;
      console.error('❌ [VIDEO] Erro no vídeo:', {
        code: error?.code,
        message: error?.message,
        videoId: videos[currentIndex]?.id,
        videoUrl: videos[currentIndex]?.video_url,
        networkState: video.networkState,
        readyState: video.readyState
      });

      if (!transitionLockRef.current) {
        console.log('⏭️ [VIDEO] Pulando para próximo vídeo devido a erro');
        handleVideoEnd();
      }
    };

    const handleStalled = () => {
      console.warn('⚠️ [VIDEO] Stalled - conexão lenta');
      setIsBuffering(true);
    };

    const handleSuspend = () => {
      console.log('💤 [VIDEO] Suspend - download pausado');
    };

    // Adicionar listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('suspend', handleSuspend);

    // Resetar flag quando trocar de vídeo
    hasEndedRef.current = false;
    playAttemptRef.current = 0;

    // Tentar reproduzir se já estiver pronto
    if (video.readyState >= 3) {
      console.log('🚀 [VIDEO] Vídeo já pronto, iniciando reprodução imediata');
      attemptPlay();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('suspend', handleSuspend);
    };
  }, [currentIndex, videos, handleVideoEnd, attemptPlay]);

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
        key={`${currentVideo.id}-${currentIndex}`}
        src={currentVideo.video_url}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />

      <VideoWatermark />

      {(isBuffering || !isPlaying) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          <p className="text-white/80 text-sm">
            {isBuffering ? 'Carregando...' : 'Iniciando...'}
          </p>
        </div>
      )}

      {/* Indicador de progresso da playlist */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs">
          Vídeo {currentIndex + 1} de {videos.length}
        </div>
      )}
    </div>
  );
};
