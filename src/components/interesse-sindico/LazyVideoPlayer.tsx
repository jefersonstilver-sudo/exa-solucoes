import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface LazyVideoPlayerProps {
  src: string;
  variant?: 'horizontal' | 'vertical';
  label?: string;
  poster?: string;
  className?: string;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({
  src,
  variant = 'horizontal',
  label,
  poster,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    // Defer to next tick so controls become visible before play
    requestAnimationFrame(() => {
      v.play().catch(() => {
        // If autoplay fails, the native controls will let the user retry
      });
    });
  };

  const frameClass = variant === 'vertical' ? 'video-frame-vertical' : 'video-frame';

  return (
    <div className={`${frameClass} ${className}`}>
      <video
        ref={videoRef}
        preload="none"
        playsInline
        controls={started}
        poster={poster}
        className="w-full h-auto block max-h-[85vh]"
      >
        <source src={src} type="video/mp4" />
      </video>

      {!started && (
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
