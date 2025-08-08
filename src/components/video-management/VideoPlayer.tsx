
import React from 'react';
import { cn } from '@/lib/utils';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { VideoPlayerStates } from './VideoPlayerStates';
import { VideoPlayerCore } from './VideoPlayerCore';
import { VideoPlayerControls } from './VideoPlayerControls';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onDownload?: () => void;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  className,
  autoPlay = false,
  muted = true,
  controls = true,
  onDownload,
  title
}) => {
  const {
    videoRef,
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    currentTime,
    showControls,
    setShowControls,
    showCenterButton,
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
    formatTime,
    showControlsTemporarily
  } = useVideoPlayer(src, autoPlay, muted);

  const isValidUrl = isValidVideoUrl(src);

  const handleRetry = () => {
    console.log('🔄 [VideoPlayer] Retry inteligente iniciado para:', src);
    
    if (videoRef.current) {
      // Estratégia 1: Reload simples
      const currentTime = videoRef.current.currentTime;
      videoRef.current.load();
      
      // Estratégia 2: Se falhar após 3s, tenta forçar src
      setTimeout(() => {
        if (videoRef.current && hasError) {
          console.log('🔄 [VideoPlayer] Retry com redefinição de src');
          const originalSrc = videoRef.current.src;
          videoRef.current.src = '';
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.src = originalSrc;
              videoRef.current.load();
            }
          }, 100);
        }
      }, 3000);
      
      // Restaurar posição se havia uma
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current && currentTime > 0) {
          videoRef.current.currentTime = currentTime;
        }
      }, { once: true });
    }
  };

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseEnter={() => showControlsTemporarily()}
      onMouseMove={() => showControlsTemporarily()}
      onMouseLeave={() => {
        // Don't hide if paused or has error
        if (isPlaying && !hasError && !isLoading) {
          setShowControls(false);
        }
      }}
    >
      {/* SEMPRE renderizar o elemento de vídeo para evitar deadlock */}
      <VideoPlayerCore
        videoRef={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        className={cn(
          "w-full h-full object-contain",
          // Esconder visualmente se estiver loading/error, mas manter no DOM
          (isLoading || hasError || !isValidUrl) && "opacity-0 absolute inset-0"
        )}
      />

      {/* Overlay com estados de loading/error por cima do vídeo */}
      {(!isValidUrl || hasError || isLoading) && (
        <div className="absolute inset-0 z-10">
          <VideoPlayerStates
            className="w-full h-full"
            isLoading={isLoading}
            hasError={hasError}
            isValidUrl={isValidUrl}
            errorDetails={errorDetails}
            videoUrl={src}
            onDownload={onDownload}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Controls Overlay - só mostrar quando vídeo está funcionando */}
      {controls && showControls && !isLoading && !hasError && isValidUrl && (
        <VideoPlayerControls
          title={title}
          onDownload={onDownload}
          toggleFullscreen={toggleFullscreen}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentTime={currentTime}
          formatTime={formatTime}
          progress={progress}
          handleProgressChange={handleProgressChange}
          duration={duration}
          restart={restart}
          isMuted={isMuted}
          volume={volume}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChange}
          showCenterButton={showCenterButton}
        />
      )}
    </div>
  );
};
