
import React from 'react';

interface VideoPlayerCoreProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  poster?: string;
  autoPlay: boolean;
  muted: boolean;
}

export const VideoPlayerCore: React.FC<VideoPlayerCoreProps> = ({
  videoRef,
  src,
  poster,
  autoPlay,
  muted
}) => {
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className="w-full h-full object-contain"
      autoPlay={autoPlay}
      muted={muted}
      loop
      playsInline
    />
  );
};
