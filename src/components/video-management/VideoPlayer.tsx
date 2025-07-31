
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
    console.log('🔄 Tentando recarregar vídeo...');
    const video = videoRef.current;
    if (video) {
      video.load(); // Força o recarregamento do vídeo
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
