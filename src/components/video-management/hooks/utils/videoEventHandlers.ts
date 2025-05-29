
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

  const getTimeoutDuration = () => {
    const isMov = src.toLowerCase().includes('.mov');
    const isLargeFile = src.includes('supabase.co'); // Assume arquivos do Supabase podem ser grandes
    
    if (isMov) {
      console.log('🎬 [PLAYER] Arquivo .mov detectado - usando timeout estendido de 45s');
      return 45000; // 45 segundos para .mov
    }
    
    if (isLargeFile) {
      console.log('🎬 [PLAYER] Arquivo possivelmente grande - usando timeout de 30s');
      return 30000; // 30 segundos para arquivos grandes
    }
    
    return 15000; // 15 segundos para outros arquivos
  };

  const updateProgress = (video: HTMLVideoElement) => () => {
    stateRef.lastActivity = Date.now();
    
    if (video.duration && !isNaN(video.duration)) {
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      setCurrentTime(video.currentTime);
    }
  };

  const handleProgress = (video: HTMLVideoElement) => (e: Event) => {
    stateRef.lastActivity = Date.now();
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
    setHasError(false);
    setErrorDetails('');
  };

  const handleLoadedMetadata = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Metadados carregados, duração:', video.duration);
    stateRef.metadataLoaded = true;
    stateRef.lastActivity = Date.now();
    
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    
    // Para arquivos .mov, finalizar loading aqui se readyState >= 2
    if (video.readyState >= 2) {
      finalizeLoading('metadados carregados com readyState >= 2');
    }
  };

  const handleLoadedData = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Dados do vídeo carregados, readyState:', video.readyState);
    stateRef.lastActivity = Date.now();
    
    // Fallback para quando loadedmetadata não dispara
    if (!stateRef.metadataLoaded && video.duration && !isNaN(video.duration)) {
      console.log('🔄 [PLAYER] Usando loadeddata como fallback para metadados');
      setDuration(video.duration);
      stateRef.metadataLoaded = true;
    }
    
    // Sempre finalizar loading no loadeddata para arquivos .mov
    if (src.toLowerCase().includes('.mov') || video.readyState >= 3) {
      finalizeLoading('dados carregados (.mov ou readyState >= 3)');
    }
  };

  const handleCanPlay = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Vídeo pode ser reproduzido, readyState:', video.readyState);
    stateRef.lastActivity = Date.now();
    
    // Garantir que o loading seja finalizado
    if (stateRef.isLoading) {
      finalizeLoading('canplay event');
    }
  };

  const handleCanPlayThrough = (video: HTMLVideoElement) => () => {
    console.log('✅ [PLAYER] Vídeo completamente carregado');
    stateRef.lastActivity = Date.now();
    
    if (stateRef.isLoading) {
      finalizeLoading('canplaythrough event');
    }
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
    
    console.error('❌ [PLAYER] Erro real ao carregar vídeo:', {
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
    stateRef.lastActivity = Date.now();
    stateRef.downloadProgress = 0;
    
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
    
    // Verificar suporte do navegador para o formato
    const canPlayType = video.canPlayType('video/quicktime');
    const canPlayMp4 = video.canPlayType('video/mp4');
    
    console.log('🎬 [PLAYER] Suporte do navegador:', {
      quicktime: canPlayType,
      mp4: canPlayMp4,
      url: src,
      readyState: video.readyState,
      timeoutDuration: getTimeoutDuration()
    });
    
    if (src.toLowerCase().includes('.mov')) {
      console.log('📹 [PLAYER] Carregando arquivo .mov - pode demorar mais...');
    }
  };

  const handleWaiting = () => {
    console.log('⏳ [PLAYER] Vídeo está aguardando dados (buffering)...');
    stateRef.lastActivity = Date.now();
    // NÃO alterar isLoading aqui para evitar conflitos
  };

  const handlePlaying = () => {
    console.log('▶️ [PLAYER] Vídeo está reproduzindo');
    stateRef.lastActivity = Date.now();
    
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
    stateRef.lastActivity = Date.now();
  };

  const handleSuspend = () => {
    console.log('⏸️ [PLAYER] Carregamento do vídeo foi suspenso');
    stateRef.lastActivity = Date.now();
  };

  const createTimeout = () => {
    const timeoutDuration = getTimeoutDuration();
    
    return setTimeout(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - stateRef.lastActivity;
      const hasRecentActivity = timeSinceLastActivity < 5000; // 5 segundos
      
      console.log('⏰ [PLAYER] Verificando timeout:', {
        isLoading: stateRef.isLoading,
        hasError: stateRef.hasError,
        downloadProgress: stateRef.downloadProgress,
        timeSinceLastActivity,
        hasRecentActivity,
        timeoutDuration
      });
      
      // Só ativar timeout se realmente não houver atividade E não estiver progredindo
      if (stateRef.isLoading && !stateRef.hasError && !hasRecentActivity && stateRef.downloadProgress < 10) {
        console.warn('⏰ [PLAYER] Timeout real - sem atividade detectada');
        stateRef.isLoading = false;
        stateRef.hasError = true;
        setHasError(true);
        setIsLoading(false);
        
        const fileType = src.toLowerCase().includes('.mov') ? 'arquivo .mov' : 'vídeo';
        setErrorDetails(`Timeout no carregamento do ${fileType} - verifique sua conexão ou tente novamente`);
      } else if (stateRef.isLoading && (hasRecentActivity || stateRef.downloadProgress >= 10)) {
        console.log('🔄 [PLAYER] Timeout ignorado - atividade detectada ou progresso suficiente');
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
