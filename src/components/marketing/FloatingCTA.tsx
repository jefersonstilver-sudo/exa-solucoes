
import React from 'react';
import { Coffee } from 'lucide-react';

interface FloatingCTAProps {
  onScrollToForm: () => void;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ onScrollToForm }) => {
  // Só mostra em dispositivos móveis (usando media query CSS)
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 px-2 block md:hidden">
      <button
        onClick={onScrollToForm}
        className="w-full bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white shadow-2xl h-16 px-8 text-lg rounded-full font-medium transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <Coffee className="w-5 h-5 flex-shrink-0" />
        <span>Agendar Conversa</span>
      </button>
    </div>
  );
};

export default FloatingCTA;
