import React, { useState, useRef, useEffect, useMemo } from 'react';
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

  // 🎯 FASE 1: Hash dos vídeos para detectar mudanças REAIS
  const videosHash = useMemo(() => {
    const hash = videos.map(v => v.id).sort().join(',');
    console.log('🔑 [HASH] Hash calculado:', { hash, count: videos.length });
    return hash;
  }, [videos]);

  console.log('🎬 [HERO] Renderizado:', {
    total: videos.length,
    currentIndex,
    currentVideo: videos[currentIndex]?.video_nome || 'N/A',
    hash: videosHash,
    isPlaying
  });

  // 🔍 Detectar mudança REAL de playlist (apenas quando IDs mudam)
  useEffect(() => {
    if (prevHashRef.current !== '' && prevHashRef.current !== videosHash) {
      console.log('🔄 [PLAYLIST] Vídeos mudaram (IDs diferentes) - resetando', {
        prevHash: prevHashRef.current,
        newHash: videosHash
      });
      setCurrentIndex(0);
      setIsPlaying(false);
    }
    prevHashRef.current = videosHash;
  }, [videosHash]);

  // 📢 Informar pai sobre estado de reprodução
  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  // 🎥 CONTROLADOR PRINCIPAL DE REPRODUÇÃO
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
    setIsPlaying(false);

    // Handler: Metadados prontos
    const onMetadata = () => {
      console.log(`📊 [VIDEO] Metadados OK - ${video.duration.toFixed(1)}s`);
      video.play()
        .then(() => {
          console.log('▶️ [VIDEO] PLAY iniciado');
          setIsBuffering(false);
          setIsPlaying(true);
        })
        .catch(err => console.error('❌ [VIDEO] Erro no play:', err));
    };

    // Handler: Vídeo terminou - ÚNICA forma de avançar
    const onEnded = () => {
      console.log(`🏁 [VIDEO] ENDED em ${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`);
      
      setIsPlaying(false);
      
      const nextIndex = (currentIndex + 1) % videos.length;
      console.log(`➡️ [VIDEO] Indo para índice ${nextIndex}`);

      if (nextIndex === 0 && onPlaylistEnd) {
        console.log('🔄 [PLAYLIST] Ciclo completo - notificando pai');
        onPlaylistEnd();
      }

      setCurrentIndex(nextIndex);
    };

    // Handler: Erro
    const onError = () => {
      console.error(`❌ [VIDEO] ERRO ao carregar: ${currentVideo.video_nome}`);
      setIsPlaying(false);
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        console.log(`⏭️ [VIDEO] Pulando para ${nextIndex} após erro`);
        setCurrentIndex(nextIndex);
      }, 2000);
    };

    // Handler: Waiting (buffering)
    const onWaiting = () => {
      console.log('⏳ [VIDEO] Buffering...');
      setIsBuffering(true);
    };

    // Handler: Playing (após buffering)
    const onPlaying = () => {
      console.log('▶️ [VIDEO] Playing (após buffer)');
      setIsBuffering(false);
      setIsPlaying(true);
    };

    // Adicionar listeners
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    // Forçar reload
    console.log('🔄 [VIDEO] Chamando video.load()');
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, [currentIndex, videos.length, onPlaylistEnd]);

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
