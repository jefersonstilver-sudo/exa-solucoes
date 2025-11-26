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
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        {/* Logo EXA no centro */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img 
            src={exaLogo} 
            alt="EXA" 
            className="h-10 w-10 drop-shadow-lg"
          />
        </div>

        {/* Spacer para manter simetria */}
        <div className="w-10" />
      </div>
      
      {/* Title abaixo do logo */}
      <div className="px-4 pb-3 text-center">
        <h1 className="text-white font-semibold text-sm">
          {title}
        </h1>
      </div>
    </header>
  );
};

export default UnifiedAdvertiserMobileHeader;
