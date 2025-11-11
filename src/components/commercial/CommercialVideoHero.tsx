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
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoIdRef = useRef<string>('');
  const hasPlayedRef = useRef(false);
  const videosHashRef = useRef<string>('');

  // Detectar mudança REAL na lista de vídeos (não re-render)
  useEffect(() => {
    if (videos.length === 0) return;

    const newHash = videos.map(v => v.id).join(',');
    
    if (videosHashRef.current && videosHashRef.current !== newHash) {
      console.log('🔄 [PLAYLIST] Lista de vídeos REALMENTE mudou - resetando player');
      setCurrentIndex(0);
      setIsBuffering(true);
      hasPlayedRef.current = false;
      currentVideoIdRef.current = '';
    }
    
    videosHashRef.current = newHash;
  }, [videos]);

  // Controle de reprodução do vídeo atual
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    // Se já estamos reproduzindo este vídeo, não fazer nada
    if (currentVideoIdRef.current === currentVideo.id && hasPlayedRef.current) {
      return;
    }

    console.log('🎬 [VIDEO] Configurando novo vídeo:', {
      index: currentIndex,
      videoId: currentVideo.id,
      videoName: currentVideo.video_nome,
      totalVideos: videos.length
    });

    currentVideoIdRef.current = currentVideo.id;
    hasPlayedRef.current = false;
    setIsBuffering(true);

    // Handler: vídeo pode ser reproduzido
    const handleCanPlay = () => {
      console.log('✅ [VIDEO] Can play - iniciando reprodução');
      
      video.play()
        .then(() => {
          console.log('▶️ [VIDEO] Reprodução iniciada com sucesso');
          hasPlayedRef.current = true;
          setIsBuffering(false);
        })
        .catch((err) => {
          console.error('❌ [VIDEO] Erro ao reproduzir:', err);
          setIsBuffering(false);
        });
    };

    // Handler: vídeo terminou (ÚNICA forma de avançar)
    const handleEnded = () => {
      console.log('🏁 [VIDEO] Vídeo terminou COMPLETAMENTE:', {
        videoId: currentVideo.id,
        videoName: currentVideo.video_nome,
        currentTime: video.currentTime.toFixed(2),
        duration: video.duration.toFixed(2)
      });

      // Calcular próximo índice
      const nextIndex = (currentIndex + 1) % videos.length;
      
      console.log('➡️ [VIDEO] Avançando para próximo vídeo:', {
        currentIndex,
        nextIndex,
        nextVideoId: videos[nextIndex]?.id,
        nextVideoName: videos[nextIndex]?.video_nome
      });

      // Se voltou ao início, notificar
      if (nextIndex === 0 && onPlaylistEnd) {
        console.log('🔄 [PLAYLIST] Fim da playlist - reiniciando');
        onPlaylistEnd();
      }

      // Resetar refs e avançar
      currentVideoIdRef.current = '';
      hasPlayedRef.current = false;
      setIsBuffering(true);
      setCurrentIndex(nextIndex);
    };

    // Handler: erro no vídeo
    const handleError = (e: Event) => {
      console.error('❌ [VIDEO] ERRO CRÍTICO no vídeo:', {
        error: video.error,
        videoId: currentVideo.id,
        videoUrl: currentVideo.video_url,
        networkState: video.networkState,
        readyState: video.readyState
      });

      // Em caso de erro, tentar próximo vídeo após 2 segundos
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        console.log('⏭️ [VIDEO] Pulando para próximo vídeo devido a erro');
        currentVideoIdRef.current = '';
        hasPlayedRef.current = false;
        setCurrentIndex(nextIndex);
      }, 2000);
    };

    // Handler: vídeo está carregando
    const handleWaiting = () => {
      console.log('⏳ [VIDEO] Buffering...');
      setIsBuffering(true);
    };

    // Handler: vídeo voltou a reproduzir após buffer
    const handlePlaying = () => {
      console.log('▶️ [VIDEO] Playing (saiu do buffer)');
      setIsBuffering(false);
    };

    // Handler: tempo de reprodução
    const handleTimeUpdate = () => {
      if (!video.duration || video.duration === 0) return;
      
      const remaining = video.duration - video.currentTime;
      
      // Log apenas nos últimos 3 segundos
      if (remaining <= 3 && remaining > 0) {
        console.log('⏱️ [VIDEO] Próximo do fim:', {
          current: video.currentTime.toFixed(2),
          duration: video.duration.toFixed(2),
          remaining: remaining.toFixed(2)
        });
      }
    };

    // Adicionar todos os event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Forçar load do vídeo
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
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

      {/* Indicador de buffering - SEM contador de vídeos */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          <p className="text-white/80 text-sm">Carregando...</p>
        </div>
      )}
    </div>
  );
};
