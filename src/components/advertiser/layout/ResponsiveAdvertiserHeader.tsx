
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnlineStoreButton from '@/components/layout/header/OnlineStoreButton';
import ModernAdvertiserHeader from './ModernAdvertiserHeader';

interface ResponsiveAdvertiserHeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

const ResponsiveAdvertiserHeader = ({ 
  onMenuClick, 
  isMobile 
}: ResponsiveAdvertiserHeaderProps) => {
  if (isMobile) {
    return (
      <header className="bg-gradient-to-r from-[#3C1361] via-[#9333EA] to-[#A855F7] border-b border-white/20 px-4 py-3 shadow-lg lg:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-white font-semibold">Portal do Anunciante</h1>
          
          <div className="flex items-center space-x-2">
            <OnlineStoreButton />
          </div>
        </div>
      </header>
    );
  }

  return <ModernAdvertiserHeader />;
};

export default ResponsiveAdvertiserHeader;
