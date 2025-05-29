
interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isElementReady: boolean;
  hasError: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  duration: number;
  setHasError: (error: boolean) => void;
  setErrorDetails: (details: string) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  isFullscreen: boolean;
}

export const createVideoControls = ({
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
}: VideoControlsProps) => {
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
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleProgressChange,
    toggleFullscreen,
    restart,
    formatTime
  };
};
