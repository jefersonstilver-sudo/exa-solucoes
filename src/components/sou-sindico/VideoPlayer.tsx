import React, { forwardRef } from 'react';

interface VideoPlayerProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ isMuted, onToggleMute }, ref) => {
    return (
      <video 
        ref={ref}
        autoPlay 
        muted={isMuted}
        loop 
        className="w-full h-full object-cover"
        onClick={onToggleMute}
      >
        <source src="/video/painel-demo.mp4" type="video/mp4" />
        <p className="text-gray-400 text-center p-4">
          Seu navegador não suporta vídeo HTML5.
        </p>
      </video>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;