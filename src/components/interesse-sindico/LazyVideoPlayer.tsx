import React, { useRef, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    setLoading(true);

    // Força carregamento agressivo no iPhone (Safari não respeita preload="auto" antes de gesto)
    try {
      v.preload = 'auto';
      v.load();
    } catch {}

    const tryPlay = () => {
      v.play()
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    };

    // Tenta tocar imediatamente (gesto do usuário ainda válido)
    tryPlay();

    // Backup: se demorar a ter dados, tenta de novo quando puder
    const onCanPlay = () => {
      setLoading(false);
      v.removeEventListener('canplay', onCanPlay);
    };
    v.addEventListener('canplay', onCanPlay);
  };

  const frameClass = variant === 'vertical' ? 'video-frame-vertical' : 'video-frame';

  return (
    <div className={`${frameClass} ${className} relative`}>
      <video
        ref={videoRef}
        preload={autoPlay ? 'auto' : 'metadata'}
        playsInline
        // @ts-expect-error - atributo legado do iOS Safari
        webkit-playsinline="true"
        controls={started}
        controlsList="nodownload"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted || autoPlay}
        poster={poster}
        onWaiting={() => started && setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        className={
          variant === 'vertical'
            ? 'block w-full h-full object-contain'
            : 'block w-full h-auto'
        }
      >
        <source src={src} type="video/mp4" />
      </video>

      {started && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

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
