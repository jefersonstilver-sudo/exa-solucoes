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
    <header className="sticky top-0 z-40 border-b border-[#ebe6e7] bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 transition-colors hover:bg-[#f5f1f2]"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-[#1b1719]" />
        </button>

        {/* Título simples no centro */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-[15px] font-bold tracking-tight text-[#1b1719]">
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
