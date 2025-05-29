
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
    metadataLoaded: false
  };

  const updateProgress = (video: HTMLVideoElement) => () => {
    if (video.duration && !isNaN(video.duration)) {
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      setCurrentTime(video.currentTime);
    }
  };

  const handleLoadedMetadata = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Metadados carregados, duração:', video.duration);
    stateRef.metadataLoaded = true;
    
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    
    // Para arquivos .mov, forçar saída do loading aqui
    console.log('✅ [PLAYER] Finalizando carregamento após metadados');
    stateRef.isLoading = false;
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
  };

  const handleLoadedData = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Dados do vídeo carregados (fallback)');
    
    // Fallback para quando loadedmetadata não dispara
    if (!stateRef.metadataLoaded) {
      console.log('🔄 [PLAYER] Usando loadeddata como fallback para metadados');
      
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      stateRef.metadataLoaded = true;
    }
    
    // Sempre finalizar loading no loadeddata
    stateRef.isLoading = false;
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
  };

  const handleCanPlay = () => {
    console.log('✅ [PLAYER] Vídeo pode ser reproduzido');
    
    // Garantir que o loading seja finalizado
    if (stateRef.isLoading) {
      console.log('🔄 [PLAYER] Finalizando loading no canplay');
      stateRef.isLoading = false;
      setIsLoading(false);
    }
    
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
    
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
    
    // Verificar suporte do navegador para o formato
    const canPlayType = video.canPlayType('video/quicktime'); // Para .mov
    const canPlayMp4 = video.canPlayType('video/mp4');
    
    console.log('🎬 [PLAYER] Suporte do navegador:', {
      quicktime: canPlayType,
      mp4: canPlayMp4,
      url: src,
      readyState: video.readyState
    });
    
    if (src.toLowerCase().includes('.mov') && !canPlayType && !canPlayMp4) {
      console.warn('⚠️ [PLAYER] Arquivo .mov pode não ser suportado neste navegador');
    }
  };

  const handleWaiting = () => {
    console.log('⏳ [PLAYER] Vídeo está aguardando dados (buffering)...');
    // NÃO alterar isLoading aqui para evitar conflitos
  };

  const handlePlaying = () => {
    console.log('▶️ [PLAYER] Vídeo está reproduzindo');
    
    // Garantir que loading seja finalizado quando começar a reproduzir
    if (stateRef.isLoading) {
      console.log('🔄 [PLAYER] Finalizando loading durante reprodução');
      stateRef.isLoading = false;
      setIsLoading(false);
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
    return setTimeout(() => {
      // Verificar estado atual via refs
      if (stateRef.isLoading && !stateRef.hasError) {
        console.warn('⏰ [PLAYER] Timeout no carregamento do vídeo - forçando finalização');
        stateRef.isLoading = false;
        stateRef.hasError = true;
        setHasError(true);
        setIsLoading(false);
        setErrorDetails('Timeout no carregamento - vídeo pode estar inacessível ou formato não suportado');
      }
    }, 10000); // Reduzido para 10 segundos
  };

  return {
    updateProgress,
    handleLoadedMetadata,
    handleLoadedData,
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
