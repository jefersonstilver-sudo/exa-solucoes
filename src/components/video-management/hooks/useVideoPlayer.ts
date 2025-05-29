
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
  const [isElementReady, setIsElementReady] = useState(false);

  // Validar se a URL do vídeo é válida - CORRIGIDO para aceitar URLs do Supabase Storage
  const isValidVideoUrl = (url: string) => {
    console.log('🔍 [PLAYER] Validando URL:', url);
    
    // Verificar se URL não está vazia ou é pendente
    if (!url || url === 'pending_upload' || url.trim() === '') {
      console.log('❌ [PLAYER] URL inválida ou vazia:', url);
      return false;
    }

    // Verificar se é uma URL válida
    try {
      const urlObj = new URL(url);
      
      // CORREÇÃO: Aceitar especificamente URLs do Supabase Storage
      const isSupabaseStorage = url.includes('supabase.co/storage/v1/object/public/');
      const isHttps = urlObj.protocol === 'https:';
      const hasVideoExtension = /\.(mp4|webm|ogg|avi|mov|mkv|m4v)(\?.*)?$/i.test(url);
      
      if (isSupabaseStorage && isHttps) {
        console.log('✅ [PLAYER] URL válida do Supabase Storage:', url);
        return true;
      }
      
      if (isHttps && hasVideoExtension) {
        console.log('✅ [PLAYER] URL de vídeo válida:', url);
        return true;
      }
      
      console.log('⚠️ [PLAYER] URL não reconhecida como vídeo válido:', {
        url,
        isSupabaseStorage,
        isHttps,
        hasVideoExtension
      });
      return false;
      
    } catch (error) {
      console.log('❌ [PLAYER] URL malformada:', url, error);
      return false;
    }
  };

  // Função para aguardar elemento estar pronto
  const waitForVideoElement = (): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20; // 2 segundos com intervalos de 100ms
      
      const checkElement = () => {
        const video = videoRef.current;
        
        if (video) {
          console.log('✅ [PLAYER] Elemento de vídeo encontrado após', attempts, 'tentativas');
          setIsElementReady(true);
          resolve(video);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('❌ [PLAYER] Timeout: elemento de vídeo não encontrado após', maxAttempts, 'tentativas');
          reject(new Error('Elemento de vídeo não foi encontrado'));
          return;
        }
        
        console.log('⏳ [PLAYER] Aguardando elemento... tentativa', attempts);
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
  };

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
    waitForVideoElement()
      .then((video) => {
        console.log('🎥 [PLAYER] Inicializando player para:', src);
        
        // Verificar suporte do navegador para o formato
        const checkBrowserSupport = () => {
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

        const updateProgress = () => {
          if (video.duration && !isNaN(video.duration)) {
            const newProgress = (video.currentTime / video.duration) * 100;
            setProgress(newProgress);
            setCurrentTime(video.currentTime);
          }
        };

        const updateDuration = () => {
          console.log('✅ [PLAYER] Metadados carregados, duração:', video.duration);
          if (video.duration && !isNaN(video.duration)) {
            setDuration(video.duration);
          }
          setIsLoading(false);
          setHasError(false);
          setErrorDetails('');
        };

        const handleError = (e: Event) => {
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

        const handleLoadStart = () => {
          console.log('🔄 [PLAYER] Iniciando carregamento do vídeo');
          setIsLoading(true);
          setHasError(false);
          setErrorDetails('');
          checkBrowserSupport();
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

        // Timeout para evitar loading infinito
        const loadingTimeout = setTimeout(() => {
          if (isLoading && !hasError) {
            console.warn('⏰ [PLAYER] Timeout no carregamento do vídeo');
            setHasError(true);
            setIsLoading(false);
            setErrorDetails('Timeout no carregamento - vídeo pode estar inacessível');
          }
        }, 15000); // 15 segundos timeout

        // Event listeners
        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('pause', handlePause);
        video.addEventListener('stalled', handleStalled);
        video.addEventListener('suspend', handleSuspend);

        return () => {
          clearTimeout(loadingTimeout);
          video.removeEventListener('timeupdate', updateProgress);
          video.removeEventListener('loadedmetadata', updateDuration);
          video.removeEventListener('ended', handleEnded);
          video.removeEventListener('error', handleError);
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('canplay', handleCanPlay);
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || hasError || !isElementReady) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('❌ [PLAYER] Erro ao reproduzir vídeo:', error);
        setHasError(true);
        setErrorDetails('Erro ao iniciar reprodução - clique para tentar novamente');
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || !isElementReady) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !isElementReady) return;

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
    if (!video || !duration || !isElementReady) return;

    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setProgress(value[0]);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video || !isElementReady) return;

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
    if (!video || !isElementReady) return;

    video.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
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
