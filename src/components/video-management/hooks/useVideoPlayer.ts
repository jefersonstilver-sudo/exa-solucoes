
import { useState, useRef, useEffect } from 'react';
import { isValidVideoUrl } from './utils/videoValidation';
import { waitForVideoElement } from './utils/videoElementWaiter';
import { createVideoEventHandlers } from './utils/videoEventHandlers';
import { createVideoControls } from './utils/videoControls';

export const useVideoPlayer = (src: string, autoPlay: boolean, muted: boolean) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isElementReady, setIsElementReady] = useState(false);

  // Create video controls
  const {
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleProgressChange,
    toggleFullscreen,
    restart,
    formatTime
  } = createVideoControls({
    videoRef,
    isElementReady,
    hasError,
    isPlaying,
    isMuted,
    duration,
    setHasError,
    setErrorDetails,
    setIsMuted,
    setVolume,
    setProgress,
    setCurrentTime,
    setIsFullscreen,
    isFullscreen
  });

  useEffect(() => {
    console.log('🎬 [PLAYER] useEffect iniciado com src:', src);
    
    // Reset states
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    setIsElementReady(false);

    // Verificar URL primeiro
    if (!isValidVideoUrl(src)) {
      console.log('❌ [PLAYER] URL inválida, definindo erro');
      setHasError(true);
      setIsLoading(false);
      setErrorDetails(!src ? 'URL não fornecida' : 'URL inválida ou formato não suportado');
      return;
    }

    // Aguardar elemento estar pronto
    waitForVideoElement(videoRef, setIsElementReady)
      .then((video) => {
        console.log('🎥 [PLAYER] Inicializando player para:', src);
        
        // Create event handlers
        const {
          updateProgress,
          handleProgress,
          handleLoadedMetadata,
          handleLoadedData,
          handleCanPlay,
          handleCanPlayThrough,
          handleError,
          handleLoadStart,
          handleWaiting,
          handlePlaying,
          handlePause,
          handleEnded,
          handleStalled,
          handleSuspend,
          createTimeout
        } = createVideoEventHandlers({
          setProgress,
          setCurrentTime,
          setDuration,
          setIsLoading,
          setHasError,
          setErrorDetails,
          setIsPlaying,
          src
        });

        // Timeout inteligente para evitar loading infinito
        const loadingTimeout = createTimeout();

        // Event listeners
        const progressHandler = updateProgress(video);
        const downloadProgressHandler = handleProgress(video);
        const metadataHandler = handleLoadedMetadata(video);
        const dataHandler = handleLoadedData(video);
        const canPlayHandler = handleCanPlay(video);
        const canPlayThroughHandler = handleCanPlayThrough(video);
        const errorHandler = handleError(video);
        const loadStartHandler = handleLoadStart(video);

        video.addEventListener('timeupdate', progressHandler);
        video.addEventListener('progress', downloadProgressHandler);
        video.addEventListener('loadedmetadata', metadataHandler);
        video.addEventListener('loadeddata', dataHandler);
        video.addEventListener('canplay', canPlayHandler);
        video.addEventListener('canplaythrough', canPlayThroughHandler);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', errorHandler);
        video.addEventListener('loadstart', loadStartHandler);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('pause', handlePause);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('suspend', handleSuspend);

        // Log do estado inicial
        console.log('📊 [PLAYER] Estado inicial do vídeo:', {
          readyState: video.readyState,
          networkState: video.networkState,
          currentSrc: video.currentSrc,
          duration: video.duration,
          fileType: src.toLowerCase().includes('.mov') ? '.mov' : 'other'
        });

        return () => {
          clearTimeout(loadingTimeout);
          video.removeEventListener('timeupdate', progressHandler);
          video.removeEventListener('progress', downloadProgressHandler);
          video.removeEventListener('loadedmetadata', metadataHandler);
          video.removeEventListener('loadeddata', dataHandler);
          video.removeEventListener('canplay', canPlayHandler);
          video.removeEventListener('canplaythrough', canPlayThroughHandler);
          video.removeEventListener('ended', handleEnded);
          video.removeEventListener('error', errorHandler);
          video.removeEventListener('loadstart', loadStartHandler);
          video.removeEventListener('waiting', handleWaiting);
          video.removeEventListener('playing', handlePlaying);
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('stalled', handleStalled);
          video.removeEventListener('suspend', handleSuspend);
        };
      })
      .catch((error) => {
        console.error('❌ [PLAYER] Falha ao aguardar elemento de vídeo:', error);
        setHasError(true);
        setIsLoading(false);
        setErrorDetails('Elemento de vídeo não foi inicializado - aguardando...');
        
        // Tentar novamente após um delay maior
        setTimeout(() => {
          console.log('🔄 [PLAYER] Tentando recarregar após falha...');
          setIsLoading(true);
          setHasError(false);
        }, 2000);
      });
  }, [src]);

  return {
    videoRef,
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    currentTime,
    showControls,
    setShowControls,
    isFullscreen,
    hasError,
    isLoading,
    errorDetails,
    isValidVideoUrl,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleProgressChange,
    toggleFullscreen,
    restart,
    formatTime
  };
};
