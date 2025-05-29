
import React from 'react';
import { X } from 'lucide-react';
import AdvertiserSidebarContent from './AdvertiserSidebarContent';

interface AdvertiserMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvertiserMobileSidebar = ({ isOpen, onClose }: AdvertiserMobileSidebarProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="lg:hidden fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <div className="w-80 h-full" onClick={e => e.stopPropagation()}>
        <AdvertiserSidebarContent onItemClick={onClose} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AdvertiserMobileSidebar;
