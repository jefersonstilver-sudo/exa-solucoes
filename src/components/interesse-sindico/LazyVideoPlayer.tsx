import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface LazyVideoPlayerProps {
  src: string;
  variant?: 'horizontal' | 'vertical';
  label?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({
  src,
  variant = 'horizontal',
  label,
  poster,
  className = '',
  autoPlay = false,
  loop = false,
  muted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(autoPlay);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    requestAnimationFrame(() => {
      v.play().catch(() => {});
    });
  };

  const frameClass = variant === 'vertical' ? 'video-frame-vertical' : 'video-frame';

  return (
    <div className={`${frameClass} ${className}`}>
      <video
        ref={videoRef}
        preload={autoPlay ? 'auto' : 'metadata'}
        playsInline
        controls={started && !autoPlay}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted || autoPlay}
        poster={poster}
        className={
          variant === 'vertical'
            ? 'block w-full h-full object-contain'
            : 'block w-full h-auto'
        }
      >
        <source src={src} type="video/mp4" />
      </video>

      {!started && !autoPlay && (
        <button
          type="button"
          onClick={handlePlay}
          className="play-button"
          aria-label="Reproduzir vídeo"
        >
          <span className="play-button-circle">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </span>
          {label && <span className="play-button-label">{label}</span>}
        </button>
      )}
    </div>
  );
};

export default LazyVideoPlayer;
