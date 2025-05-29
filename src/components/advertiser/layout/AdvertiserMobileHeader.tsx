
import React from 'react';
import { Menu } from 'lucide-react';

interface AdvertiserMobileHeaderProps {
  onMenuClick: () => void;
}

const AdvertiserMobileHeader = ({ onMenuClick }: AdvertiserMobileHeaderProps) => {
  return (
    <header className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="font-semibold text-gray-900">Portal do Anunciante</h1>
      <div className="w-9" /> {/* Spacer */}
    </header>
  );
};

export default AdvertiserMobileHeader;
