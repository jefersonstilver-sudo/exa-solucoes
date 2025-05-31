
import React from 'react';
import { Coffee } from 'lucide-react';
import ResponsiveButton from '@/components/responsive/ResponsiveButton';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface FloatingCTAProps {
  onScrollToForm: () => void;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ onScrollToForm }) => {
  const { isPhone, isTablet } = useAdvancedResponsive();

  if (!isPhone && !isTablet) {
    return null; // Só mostra em dispositivos móveis
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 px-2">
      <ResponsiveButton
        onClick={onScrollToForm}
        className="w-full bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white shadow-2xl"
        icon={Coffee}
        iconPosition="left"
        size="lg"
        touchOptimized={true}
      >
        {isPhone ? "Agendar Conversa" : "Agendar Conversa Estratégica"}
      </ResponsiveButton>
    </div>
  );
};

export default FloatingCTA;
