
import React from 'react';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

interface FloatingCTAProps {
  onScrollToForm: () => void;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ onScrollToForm }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Button
        onClick={onScrollToForm}
        className="w-full bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 rounded-full shadow-2xl"
      >
        <Coffee className="w-5 h-5 mr-2" />
        Agendar Conversa Estratégica
      </Button>
    </div>
  );
};

export default FloatingCTA;
