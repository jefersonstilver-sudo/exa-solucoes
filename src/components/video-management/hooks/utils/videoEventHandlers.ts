
interface VideoEventHandlerProps {
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  setHasError: (error: boolean) => void;
  setErrorDetails: (details: string) => void;
  setIsPlaying: (playing: boolean) => void;
  src: string;
  isLoading: boolean;
  hasError: boolean;
}

export const createVideoEventHandlers = ({
  setProgress,
  setCurrentTime,
  setDuration,
  setIsLoading,
  setHasError,
  setErrorDetails,
  setIsPlaying,
  src,
  isLoading,
  hasError
}: VideoEventHandlerProps) => {
  const updateProgress = (video: HTMLVideoElement) => () => {
    if (video.duration && !isNaN(video.duration)) {
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      setCurrentTime(video.currentTime);
    }
  };

  const updateDuration = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Metadados carregados, duração:', video.duration);
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
  };

  const handleError = (video: HTMLVideoElement) => (e: Event) => {
    const target = e.target as HTMLVideoElement;
    const error = target.error;
    
    let errorMessage = 'Erro desconhecido ao carregar vídeo';
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Carregamento do vídeo foi abortado';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Erro de rede ao carregar vídeo';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Erro ao decodificar vídeo - formato pode não ser suportado';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato de vídeo não suportado pelo navegador';
          break;
        default:
          errorMessage = `Erro de vídeo (código: ${error.code})`;
      }
    }
    
    console.error('❌ [PLAYER] Erro ao carregar vídeo:', {
      src,
      errorCode: error?.code,
      errorMessage,
      networkState: target.networkState,
      readyState: target.readyState,
      userAgent: navigator.userAgent
    });
    
    setHasError(true);
    setIsLoading(false);
    setErrorDetails(errorMessage);
  };

  const handleLoadStart = (video: HTMLVideoElement) => () => {
    console.log('🔄 [PLAYER] Iniciando carregamento do vídeo');
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
    
    // Verificar suporte do navegador para o formato
    const canPlayType = video.canPlayType('video/quicktime'); // Para .mov
    const canPlayMp4 = video.canPlayType('video/mp4');
    
    console.log('🎬 [PLAYER] Suporte do navegador:', {
      quicktime: canPlayType,
      mp4: canPlayMp4,
      url: src
    });
    
    if (src.toLowerCase().includes('.mov') && !canPlayType && !canPlayMp4) {
      console.warn('⚠️ [PLAYER] Arquivo .mov pode não ser suportado neste navegador');
    }
  };

  const handleCanPlay = () => {
    console.log('✅ [PLAYER] Vídeo pode ser reproduzido');
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
  };

  const handleWaiting = () => {
    console.log('⏳ [PLAYER] Vídeo está aguardando dados...');
    setIsLoading(true);
  };

  const handlePlaying = () => {
    console.log('▶️ [PLAYER] Vídeo está reproduzindo');
    setIsLoading(false);
    setIsPlaying(true);
  };

  const handlePause = () => {
    console.log('⏸️ [PLAYER] Vídeo pausado');
    setIsPlaying(false);
  };

  const handleEnded = () => {
    console.log('🏁 [PLAYER] Vídeo finalizado');
    setIsPlaying(false);
  };

  const handleStalled = () => {
    console.warn('⚠️ [PLAYER] Vídeo travou durante carregamento');
  };

  const handleSuspend = () => {
    console.log('⏸️ [PLAYER] Carregamento do vídeo foi suspenso');
  };

  const createTimeout = () => {
    return setTimeout(() => {
      if (isLoading && !hasError) {
        console.warn('⏰ [PLAYER] Timeout no carregamento do vídeo');
        setHasError(true);
        setIsLoading(false);
        setErrorDetails('Timeout no carregamento - vídeo pode estar inacessível');
      }
    }, 15000); // 15 segundos timeout
  };

  return {
    updateProgress,
    updateDuration,
    handleError,
    handleLoadStart,
    handleCanPlay,
    handleWaiting,
    handlePlaying,
    handlePause,
    handleEnded,
    handleStalled,
    handleSuspend,
    createTimeout
  };
};
