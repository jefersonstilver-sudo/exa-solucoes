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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[90%] h-[85%] md:w-[70%] md:h-[70%] bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* Header com título e botão fechar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-playfair text-lg md:text-xl font-bold">
                {titulo}
              </h3>
              <span className="text-white/80 font-montserrat text-sm">
                {categoria}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
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

        {/* Indicador ESC */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-montserrat">
          Pressione ESC para fechar
        </div>
      </div>
    </div>
  );
};

export default PortfolioVideoModal;