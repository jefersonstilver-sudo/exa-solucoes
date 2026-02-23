
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface FullscreenVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
}

const FullscreenVideoPlayer = ({ isOpen, onClose, videoSrc }: FullscreenVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      setIsLoading(true);
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Overlay para fechar clicando fora */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />

      {/* Botão de fechar no canto superior direito - MELHORADO */}
      <button
        onClick={onClose}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 bg-red-600/80 hover:bg-red-600 text-white p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl"
        aria-label="Fechar vídeo"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Container do vídeo */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4 z-10">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-30">
            <div className="w-12 h-12 border-4 border-indexa-mint border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain rounded-lg cursor-pointer"
          loop
          playsInline
          onClick={togglePlayPause}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Controles visíveis - MELHORADOS */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 sm:space-x-4 bg-black/80 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/20">
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-indexa-mint transition-colors duration-300 p-2"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-indexa-mint transition-colors duration-300 p-2"
            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors duration-300 p-2 ml-2 sm:ml-4"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FullscreenVideoPlayer;
