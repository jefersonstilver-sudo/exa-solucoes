
import React from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerCoreProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  poster?: string;
  autoPlay: boolean;
  muted: boolean;
  className?: string;
}

export const VideoPlayerCore: React.FC<VideoPlayerCoreProps> = ({
  videoRef,
  src,
  poster,
  autoPlay,
  muted,
  className
}) => {
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={cn("w-full h-full object-contain", className)}
      autoPlay={autoPlay}
      muted={muted}
      loop
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
      onLoadStart={() => console.log('🎬 [CORE] Video element loadstart event')}
      onLoadedMetadata={() => console.log('🎬 [CORE] Video element metadata loaded')}
    />
  );
};
