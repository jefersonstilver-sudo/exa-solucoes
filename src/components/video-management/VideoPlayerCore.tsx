
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
  console.log('🎬 [ALASCA SETE] VideoPlayerCore renderizando com src:', src);
  
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
      crossOrigin="anonymous"
      preload="metadata"
      onLoadStart={() => console.log('🔄 [ALASCA SETE] Video loadstart event')}
      onCanPlay={() => console.log('✅ [ALASCA SETE] Video canplay event')}
      onError={(e) => console.error('❌ [ALASCA SETE] Video error event:', e)}
    />
  );
};
