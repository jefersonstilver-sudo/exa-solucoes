import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';
import { VideoDebugger } from '@/utils/videoDebugger';
import { videoCache } from '@/utils/videoCache';

interface Video {
  id: string;
  video_url: string;
  video_nome: string;
}

interface CommercialVideoHeroProps {
  videos: Video[];
  className?: string;
  onPlaylistEnd?: () => void;
  onPlayingChange?: (playing: boolean) => void;
}

export const CommercialVideoHero: React.FC<CommercialVideoHeroProps> = ({
  videos,
  className = '',
  onPlaylistEnd,
  onPlayingChange
}) => {
  // Estados simples
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Refs para callbacks externos (evitar re-renders)
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onPlaylistEndRef = useRef(onPlaylistEnd);

  // ✅ CORREÇÃO 3: Refs para acessar valores atuais sem causar re-render
  const currentIndexRef = useRef(currentIndex);
  const videosRef = useRef(videos);

  // Atualizar refs quando callbacks externos mudarem
  useEffect(() => {
    onPlayingChangeRef.current = onPlayingChange;
    onPlaylistEndRef.current = onPlaylistEnd;
    currentIndexRef.current = currentIndex;
    videosRef.current = videos;
  }, [onPlayingChange, onPlaylistEnd, currentIndex, videos]);

  // Hash estável para detectar mudanças na playlist
  const videosHash = useMemo(() => {
    return videos.map(v => v.id).sort().join(',');
  }, [videos]);

  // ✅ CORREÇÃO 4: Rastrear hash anterior para evitar resets desnecessários
  const previousHashRef = useRef(videosHash);

  // Reset APENAS quando hash REALMENTE mudar
  useEffect(() => {
    if (previousHashRef.current !== videosHash) {
      VideoDebugger.logEvent('PLAYLIST', 'Mudança detectada - reiniciando', {
        count: videos.length,
        oldHash: previousHashRef.current,
        newHash: videosHash
      });
      
      setCurrentIndex(0);
      setIsBuffering(true);
      previousHashRef.current = videosHash;
    }
  }, [videosHash, videos.length]);

  // ✅ CORREÇÃO 3 & 5: Event handlers TOTALMENTE estáveis - SEM dependências
  const handleLoadStart = useCallback(() => {
    setIsBuffering(true);
    VideoDebugger.logEvent('VIDEO', 'Carregando', {
      index: `${currentIndexRef.current + 1}/${videosRef.current.length}`,
      nome: videosRef.current[currentIndexRef.current]?.video_nome
    });
  }, []); // ✅ SEM dependências

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    VideoDebugger.logEvent('VIDEO', 'Metadados carregados', {
      duração: video.duration.toFixed(1) + 's'
    });
  }, []); // ✅ SEM dependências

  const handlePlaying = useCallback(() => {
    VideoDebugger.logEvent('VIDEO', 'Reproduzindo', {
      index: `${currentIndexRef.current + 1}/${videosRef.current.length}`
    });
    setIsBuffering(false);
    onPlayingChangeRef.current?.(true);
  }, []); // ✅ SEM dependências

  const handleEnded = useCallback(() => {
    const currentVideo = videosRef.current[currentIndexRef.current];
    VideoDebugger.logEvent('VIDEO', 'Terminou', {
      nome: currentVideo?.video_nome,
      index: `${currentIndexRef.current + 1}/${videosRef.current.length}`
    });
    
    onPlayingChangeRef.current?.(false);
    
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % videosRef.current.length;
      
      if (nextIndex === 0) {
        VideoDebugger.logEvent('PLAYLIST', 'Ciclo completo');
        onPlaylistEndRef.current?.();
      }
      
      return nextIndex;
    });
  }, []); // ✅ SEM dependências - handler PERMANENTE

  const handleError = useCallback(() => {
    const currentVideo = videosRef.current[currentIndexRef.current];
    VideoDebugger.logEvent('VIDEO', 'Erro ao carregar', {
      nome: currentVideo?.video_nome
    });

    setIsBuffering(false);
    onPlayingChangeRef.current?.(false);

    // Pular para próximo vídeo após 2s
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videosRef.current.length);
    }, 2000);
  }, []); // ✅ SEM dependências

  // Setup de event listeners (APENAS UMA VEZ, PERMANENTES)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [handleLoadStart, handleLoadedMetadata, handlePlaying, handleEnded, handleError]);

  // Mudança de vídeo (SEPARADO do setup de listeners)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;
    
    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const loadVideo = async () => {
      try {
        // Tentar obter vídeo do cache primeiro
        const cachedUrl = await videoCache.getCachedVideo(currentVideo.id);
        const videoUrl = cachedUrl || currentVideo.video_url;
        
        // Só atualizar se URL mudou
        if (video.src !== videoUrl) {
          video.src = videoUrl;
          video.load(); // Trigger load + autoplay
        }

        // Se não estava no cache, iniciar download em background
        if (!cachedUrl) {
          videoCache.cacheVideo(currentVideo.id, currentVideo.video_url).catch(() => {
            // Falha silenciosa no cache
          });
        }
      } catch (error) {
        // Fallback para URL original
        if (video.src !== currentVideo.video_url) {
          video.src = currentVideo.video_url;
          video.load();
        }
      }
    };

    loadVideo();
  }, [currentIndex, videosHash]); // ✅ REMOVIDO `videos` - evita loop infinito

  // Pré-cachear próximos vídeos em background
  useEffect(() => {
    if (videos.length === 0) return;

    const preCacheVideos = async () => {
      // Cachear próximos 3 vídeos
      for (let i = 1; i <= 3; i++) {
        const nextIndex = (currentIndex + i) % videos.length;
        const nextVideo = videos[nextIndex];
        if (!nextVideo) continue;

        const hasCached = await videoCache.hasCachedVideo(nextVideo.id);
        if (!hasCached) {
          videoCache.cacheVideo(nextVideo.id, nextVideo.video_url).catch(() => {
            // Falha silenciosa
          });
        }
      }
    };

    preCacheVideos();
  }, [currentIndex, videos]);

  if (videos.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 ${className}`}>
        <p className="text-white/60 text-lg">Nenhum vídeo disponível</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Elemento de vídeo LIMPO - sem <source> interno */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={{
          backgroundColor: '#0f172a'
        }}
      />

      {/* Watermark */}
      <VideoWatermark />

      {/* Indicador de buffering */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-red-500" />
            <p className="text-white/90 text-lg font-medium">Carregando vídeo...</p>
          </div>
        </div>
      )}
    </div>
  );
};
