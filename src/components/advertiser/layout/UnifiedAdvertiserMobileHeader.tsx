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
    <header className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#7A3838] to-[#9C1E1E] border-b border-white/10 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4 text-white" />
        </button>

        {/* Título simples no centro */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-sm font-medium text-white/90 tracking-tight">
            {title}
          </span>
        </div>

        {/* Spacer para manter simetria */}
        <div className="w-7" />
      </div>
    </header>
  );
};

export default UnifiedAdvertiserMobileHeader;
