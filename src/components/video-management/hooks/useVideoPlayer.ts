
import { useState, useRef, useEffect } from 'react';

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

  // CORREÇÃO FINAL ALASCA SETE: Validação mais permissiva e precisa
  const isValidVideoUrl = (url: string) => {
    // Verificar se URL não é vazia ou estado de upload pendente
    if (!url || url === 'pending_upload' || url.trim() === '') {
      console.log('❌ [ALASCA SETE] URL vazia ou pendente:', url);
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      
      // CORREÇÃO: Aceitar especificamente URLs do Supabase Storage
      if (url.includes('supabase.co/storage/v1/object/public/')) {
        console.log('✅ [ALASCA SETE] URL do Supabase Storage válida:', url);
        return true;
      }
      
      // Aceitar outras URLs HTTPS/HTTP válidas
      if (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') {
        console.log('✅ [ALASCA SETE] URL válida aceita:', url);
        return true;
      }
      
      console.log('⚠️ [ALASCA SETE] Protocolo não suportado:', urlObj.protocol);
      return false;
    } catch (error) {
      console.log('❌ [ALASCA SETE] URL malformada:', url, error);
      return false;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.log('❌ [ALASCA SETE] Elemento de vídeo não encontrado');
      setHasError(true);
      setIsLoading(false);
      setErrorDetails('Elemento de vídeo não disponível');
      return;
    }

    if (!isValidVideoUrl(src)) {
      console.log('❌ [ALASCA SETE] URL inválida rejeitada:', src);
      setHasError(true);
      setIsLoading(false);
      setErrorDetails(!src ? 'URL não fornecida' : `URL inválida: ${src}`);
      return;
    }

    console.log('🎥 [ALASCA SETE] Inicializando player para URL válida:', src);
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const updateDuration = () => {
      console.log('✅ [ALASCA SETE] Metadados carregados, duração:', video.duration);
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      
      let errorMessage = 'Erro ao carregar vídeo';
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Carregamento abortado pelo usuário';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Erro de rede - verifique sua conexão';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Erro ao decodificar - formato pode não ser suportado';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Formato não suportado pelo navegador';
            break;
          default:
            errorMessage = `Erro de vídeo (código: ${error.code})`;
        }
      }
      
      console.error('❌ [ALASCA SETE] Erro no vídeo:', {
        src,
        errorCode: error?.code,
        errorMessage,
        networkState: target.networkState,
        readyState: target.readyState
      });
      
      setHasError(true);
      setIsLoading(false);
      setErrorDetails(errorMessage);
    };

    const handleLoadStart = () => {
      console.log('🔄 [ALASCA SETE] Iniciando carregamento');
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log('✅ [ALASCA SETE] Vídeo pode ser reproduzido');
      setIsLoading(false);
      setHasError(false);
    };

    const handleWaiting = () => {
      console.log('⏳ [ALASCA SETE] Aguardando dados...');
      setIsLoading(true);
    };

    const handlePlaying = () => {
      console.log('▶️ [ALASCA SETE] Reproduzindo');
      setIsLoading(false);
    };

    // Event listeners
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('❌ [ALASCA SETE] Erro ao reproduzir:', error);
        setHasError(true);
        setErrorDetails('Erro ao iniciar reprodução - clique para tentar novamente');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const handleProgressChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setProgress(value[0]);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
