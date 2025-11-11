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
  const [videoError, setVideoError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const videosHashRef = useRef<string>('');

  console.log('🎬 [HERO] Componente renderizado:', {
    videosCount: videos.length,
    currentIndex,
    currentVideo: videos[currentIndex]?.video_nome
  });

  // ✅ ETAPA 1: Detectar mudança REAL na lista de vídeos (por IDs)
  useEffect(() => {
    if (videos.length === 0) return;

    const newHash = videos.map(v => v.id).sort().join(',');
    
    // Só resetar se os IDs realmente mudaram (conteúdo diferente)
    if (videosHashRef.current !== '' && videosHashRef.current !== newHash) {
      console.log('🔄 [PLAYLIST] IDs dos vídeos mudaram - resetando para índice 0');
      setCurrentIndex(0);
      setIsBuffering(true);
      setVideoError('');
    }
    
    videosHashRef.current = newHash;
  }, [videos]);

  // ✅ ETAPA 2: Controlar reprodução APENAS baseado em currentIndex
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    console.log('🎥 [VIDEO] Carregando vídeo:', {
      index: currentIndex + 1,
      total: videos.length,
      name: currentVideo.video_nome,
      url: currentVideo.video_url
    });

    setIsBuffering(true);
    setVideoError('');

    // Handler: Metadados carregados - iniciar reprodução
    const handleLoadedMetadata = () => {
      console.log('📊 [VIDEO] Metadados carregados:', {
        duration: video.duration.toFixed(2),
        readyState: video.readyState
      });
      
      video.play()
        .then(() => {
          console.log('▶️ [VIDEO] Reprodução iniciada com sucesso');
          setIsBuffering(false);
        })
        .catch(err => {
          console.error('❌ [VIDEO] Erro ao iniciar reprodução:', err);
          setVideoError(`Erro ao reproduzir: ${err.message}`);
          setIsBuffering(false);
        });
    };

    // Handler: Vídeo terminou - ÚNICA forma de avançar
    const handleEnded = () => {
      console.log('🏁 [VIDEO] Vídeo TERMINOU completamente:', {
        videoName: currentVideo.video_nome,
        finalTime: video.currentTime.toFixed(2),
        duration: video.duration.toFixed(2)
      });

      const nextIndex = (currentIndex + 1) % videos.length;
      
      console.log('➡️ [VIDEO] Avançando para próximo:', {
        from: currentIndex,
        to: nextIndex,
        nextVideo: videos[nextIndex]?.video_nome
      });

      // Se voltou para 0, um ciclo completo foi concluído
      if (nextIndex === 0 && onPlaylistEnd) {
        console.log('🔄 [PLAYLIST] Ciclo completo - notificando parent');
        onPlaylistEnd();
      }

      setCurrentIndex(nextIndex);
    };

    // Handler: Erro crítico
    const handleError = () => {
      const errorMsg = video.error 
        ? `Erro ${video.error.code}: ${video.error.message}` 
        : 'Erro desconhecido ao carregar vídeo';
      
      console.error('❌ [VIDEO] ERRO ao carregar:', {
        error: video.error,
        videoName: currentVideo.video_nome,
        videoUrl: currentVideo.video_url
      });

      setVideoError(errorMsg);
      setIsBuffering(false);

      // Tentar próximo vídeo após 3 segundos
      setTimeout(() => {
        console.log('⏭️ [VIDEO] Pulando para próximo após erro');
        const nextIndex = (currentIndex + 1) % videos.length;
        setCurrentIndex(nextIndex);
      }, 3000);
    };

    // Handler: Buffering
    const handleWaiting = () => {
      console.log('⏳ [VIDEO] Buffering...');
      setIsBuffering(true);
    };

    // Handler: Reproduzindo
    const handlePlaying = () => {
      console.log('▶️ [VIDEO] Reproduzindo normalmente');
      setIsBuffering(false);
    };

    // Adicionar listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    // ✅ Forçar carregamento do vídeo atual
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [currentIndex, onPlaylistEnd]); // ⚠️ CRÍTICO: Apenas currentIndex e onPlaylistEnd, NÃO videos!

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

      {/* Fallback de erro */}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-4">
          <div className="text-red-400 text-lg font-semibold">⚠️ Erro no vídeo</div>
          <div className="text-white/70 text-sm text-center max-w-md">
            {currentVideo.video_nome}
          </div>
          <div className="text-white/50 text-xs text-center max-w-md font-mono">
            {videoError}
          </div>
          <div className="text-white/40 text-xs">Tentando próximo vídeo...</div>
        </div>
      )}
    </div>
  );
};
