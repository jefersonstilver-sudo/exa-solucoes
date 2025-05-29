
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
  } = useVideoPlayer(src, autoPlay, muted);

  const isValidUrl = isValidVideoUrl(src);

  const handleRetry = () => {
    console.log('🔄 Tentando recarregar vídeo...');
    const video = videoRef.current;
    if (video) {
      video.load(); // Força o recarregamento do vídeo
    }
  };

  // Show error or loading states
  if (!isValidUrl || hasError || isLoading) {
    return (
      <VideoPlayerStates
        className={className}
        isLoading={isLoading}
        hasError={hasError}
        isValidUrl={isValidUrl}
        errorDetails={errorDetails}
        videoUrl={src}
        onDownload={onDownload}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(controls)}
    >
      <VideoPlayerCore
        videoRef={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
      />

      {/* Controls Overlay */}
      {controls && showControls && (
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
        />
      )}
    </div>
  );
};
