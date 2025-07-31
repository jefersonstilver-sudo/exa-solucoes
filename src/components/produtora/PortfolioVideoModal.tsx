import React from 'react';
import { X } from 'lucide-react';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';

interface PortfolioVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  titulo: string;
  categoria: string;
}

const PortfolioVideoModal: React.FC<PortfolioVideoModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  titulo,
  categoria
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[95%] h-[90%] md:w-[85%] md:h-[85%] bg-black overflow-hidden shadow-2xl">
        {/* Header com título e botão fechar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-playfair text-xl md:text-2xl font-bold">
                {titulo}
              </h3>
              <span className="text-white/70 font-montserrat text-sm md:text-base">
                {categoria}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all duration-300 border border-white/20"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full h-full">
          <VideoPlayer
            src={videoSrc}
            autoPlay={true}
            muted={false}
            controls={true}
            className="w-full h-full object-contain"
            title={titulo}
          />
        </div>
      </div>
    </div>
  );
};

export default PortfolioVideoModal;