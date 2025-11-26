import React from 'react';
import { Menu } from 'lucide-react';
import exaLogo from '@/assets/exa-logo.png';

interface UnifiedAdvertiserMobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

const UnifiedAdvertiserMobileHeader = ({ 
  title, 
  onMenuClick 
}: UnifiedAdvertiserMobileHeaderProps) => {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#9C1E1E] via-[#D72638] to-[#9C1E1E] border-b border-white/20 shadow-lg">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4 text-white" />
        </button>

        {/* Logo EXA e Título no centro - Layout Vertical */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <img 
            src={exaLogo} 
            alt="EXA" 
            className="h-5 w-auto object-contain drop-shadow-lg"
          />
          <h1 className="text-white/90 font-medium text-[10px] mt-0.5">
            {title}
          </h1>
        </div>

        {/* Spacer para manter simetria */}
        <div className="w-8" />
      </div>
    </header>
  );
};

export default UnifiedAdvertiserMobileHeader;
