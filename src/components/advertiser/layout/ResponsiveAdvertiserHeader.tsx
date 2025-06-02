
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
      <header className="bg-indexa-purple border-b border-purple-800/30 px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/10"
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

  return <ModernAdvertiserHeader onMenuClick={onMenuClick} isMobile={isMobile} />;
};

export default ResponsiveAdvertiserHeader;
