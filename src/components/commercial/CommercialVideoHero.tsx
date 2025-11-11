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

  console.log('🎬 [HERO] Renderizado:', {
    total: videos.length,
    currentIndex,
    currentVideo: videos[currentIndex]?.video_nome || 'N/A'
  });

  // ÚNICO useEffect - controla TUDO baseado em currentIndex
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) {
      console.log('⚠️ [VIDEO] Sem vídeo ou ref');
      return;
    }

    const currentVideo = videos[currentIndex];
    if (!currentVideo) {
      console.log('⚠️ [VIDEO] Índice inválido');
      return;
    }

    console.log(`🎥 [VIDEO] Carregando [${currentIndex + 1}/${videos.length}]: "${currentVideo.video_nome}"`);

    setIsBuffering(true);

    // Handler: Metadados prontos
    const onMetadata = () => {
      console.log(`📊 [VIDEO] Metadados OK - ${video.duration.toFixed(1)}s`);
      video.play()
        .then(() => {
          console.log('▶️ [VIDEO] PLAY iniciado');
          setIsBuffering(false);
        })
        .catch(err => console.error('❌ [VIDEO] Erro no play:', err));
    };

    // Handler: Vídeo terminou - ÚNICA forma de avançar
    const onEnded = () => {
      console.log(`🏁 [VIDEO] ENDED em ${video.currentTime.toFixed(1)}s`);
      
      const nextIndex = (currentIndex + 1) % videos.length;
      console.log(`➡️ [VIDEO] Indo para índice ${nextIndex}`);

      if (nextIndex === 0 && onPlaylistEnd) {
        console.log('🔄 [PLAYLIST] Ciclo completo');
        onPlaylistEnd();
      }

      setCurrentIndex(nextIndex);
    };

    // Handler: Erro
    const onError = () => {
      console.error(`❌ [VIDEO] ERRO ao carregar: ${currentVideo.video_nome}`);
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        console.log(`⏭️ [VIDEO] Pulando para ${nextIndex} após erro`);
        setCurrentIndex(nextIndex);
      }, 2000);
    };

    // Adicionar listeners
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    // Forçar reload
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [currentIndex]);

  // Resetar índice quando lista de vídeos mudar
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      console.log('🔄 [PLAYLIST] Lista mudou - resetando índice');
      setCurrentIndex(0);
    }
  }, [videos]);

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
