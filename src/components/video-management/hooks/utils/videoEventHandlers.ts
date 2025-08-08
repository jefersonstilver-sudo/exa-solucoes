
interface VideoEventHandlerProps {
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  setHasError: (error: boolean) => void;
  setErrorDetails: (details: string) => void;
  setIsPlaying: (playing: boolean) => void;
  src: string;
}

export const createVideoEventHandlers = ({
  setProgress,
  setCurrentTime,
  setDuration,
  setIsLoading,
  setHasError,
  setErrorDetails,
  setIsPlaying,
  src
}: VideoEventHandlerProps) => {
  // Use refs to track current state for timeout
  const stateRef = {
    isLoading: true,
    hasError: false,
    metadataLoaded: false,
    lastActivity: Date.now(),
    downloadProgress: 0
  };

  // Timeout simplificado e mais generoso
  const getTimeoutDuration = () => {
    return 25000; // 25 segundos para todos os vídeos
  };

  const updateProgress = (video: HTMLVideoElement) => () => {
    if (video.duration && !isNaN(video.duration)) {
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      setCurrentTime(video.currentTime);
    }
  };

  const handleProgress = (video: HTMLVideoElement) => (e: Event) => {
    const target = e.target as HTMLVideoElement;
    
    if (target.buffered.length > 0) {
      const bufferedEnd = target.buffered.end(target.buffered.length - 1);
      const duration = target.duration;
      
      if (duration > 0) {
        stateRef.downloadProgress = (bufferedEnd / duration) * 100;
        console.log(`📊 [PLAYER] Progresso de download: ${stateRef.downloadProgress.toFixed(1)}%`);
      }
    }
  };

  const finalizeLoading = (reason: string) => {
    console.log(`✅ [PLAYER] Finalizando loading: ${reason}`);
    stateRef.isLoading = false;
    setIsLoading(false);
  };

  const handleLoadedMetadata = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Metadados carregados, duração:', video.duration);
    stateRef.metadataLoaded = true;
    
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleLoadedData = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Dados do vídeo carregados, readyState:', video.readyState);
    
    // Fallback para quando loadedmetadata não dispara
    if (!stateRef.metadataLoaded && video.duration && !isNaN(video.duration)) {
      console.log('🔄 [PLAYER] Usando loadeddata como fallback para metadados');
      setDuration(video.duration);
      stateRef.metadataLoaded = true;
    }
  };

  const handleCanPlay = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Vídeo pode ser reproduzido, readyState:', video.readyState);
    
    // Garantir que o loading seja finalizado
    if (stateRef.isLoading) {
      finalizeLoading('canplay event');
    }
  };

  const handleCanPlayThrough = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Vídeo completamente carregado');
    
    if (stateRef.isLoading) {
      finalizeLoading('canplaythrough event');
    }
  };

  const handleError = (video: HTMLVideoElement) => (e: Event) => {
    const target = e.target as HTMLVideoElement;
    const error = target.error;
    
    let errorMessage = 'Erro ao carregar vídeo';
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Arquivo de vídeo corrompido.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato de vídeo não suportado.';
          break;
        default:
          errorMessage = 'Erro ao carregar vídeo. Tente novamente.';
      }
    }
    
    console.error('❌ [PLAYER] Erro real ao carregar vídeo:', {
      src,
      errorCode: error?.code,
      errorMessage,
      networkState: target.networkState,
      readyState: target.readyState
    });
    
    stateRef.hasError = true;
    stateRef.isLoading = false;
    setHasError(true);
    setIsLoading(false);
    setErrorDetails(errorMessage);
  };

  const handleLoadStart = (video: HTMLVideoElement) => () => {
    console.log('🔄 [PLAYER] Iniciando carregamento do vídeo');
    stateRef.isLoading = true;
    stateRef.hasError = false;
    stateRef.metadataLoaded = false;
    stateRef.downloadProgress = 0;
    
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
    
    console.log('🎬 [PLAYER] Carregando vídeo:', {
      url: src,
      readyState: video.readyState,
      timeoutDuration: getTimeoutDuration()
    });
  };

  const handleWaiting = () => {
    console.log('⏳ [PLAYER] Vídeo está aguardando dados (buffering)...');
    // NÃO alterar isLoading aqui para evitar conflitos
  };

  const handlePlaying = () => {
    console.log('▶️ [PLAYER] Vídeo está reproduzindo');
    
    // Garantir que loading seja finalizado quando começar a reproduzir
    if (stateRef.isLoading) {
      finalizeLoading('reprodução iniciada');
    }
    
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
    const timeoutDuration = getTimeoutDuration();
    
    return setTimeout(() => {
      console.log('⏰ [PLAYER] Verificando timeout:', {
        isLoading: stateRef.isLoading,
        hasError: stateRef.hasError,
        timeoutDuration
      });
      
      // Só ativar timeout se ainda estiver carregando e sem erro
      if (stateRef.isLoading && !stateRef.hasError) {
        console.warn('⏰ [PLAYER] Timeout ativado');
        stateRef.isLoading = false;
        stateRef.hasError = true;
        setHasError(true);
        setIsLoading(false);
        setErrorDetails(`Timeout no carregamento do vídeo - verifique sua conexão ou tente novamente`);
      }
    }, timeoutDuration);
  };

  return {
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
  };
};
