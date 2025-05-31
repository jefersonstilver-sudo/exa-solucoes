
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, Maximize } from 'lucide-react';

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
      {/* Controles superiores */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Vídeo principal */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4">
        <video
          ref={videoRef}
          className="w-full h-full object-contain rounded-lg"
          loop
          playsInline
          onClick={togglePlayPause}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Controles inferiores */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-indexa-mint transition-colors duration-300"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-indexa-mint transition-colors duration-300"
          >
            <Volume2 className={`w-6 h-6 ${isMuted ? 'opacity-50' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenVideoPlayer;
