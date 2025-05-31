
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
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
      return () => document.removeEventListener('keydown', handleEscape);
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

      {/* Botão de fechar no canto superior direito */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all duration-300 hover:scale-110"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Container do vídeo */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4 z-10">
        <video
          ref={videoRef}
          className="w-full h-full object-contain rounded-lg cursor-pointer"
          loop
          playsInline
          onClick={togglePlayPause}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Controles visíveis */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/70 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20">
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-indexa-mint transition-colors duration-300 p-2"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-indexa-mint transition-colors duration-300 p-2"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors duration-300 p-2 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicação de tecla ESC */}
        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white/70 text-sm">
          Pressione ESC para fechar
        </div>
      </div>
    </div>
  );
};

export default FullscreenVideoPlayer;
