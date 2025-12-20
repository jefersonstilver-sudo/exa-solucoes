
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
      <header className="bg-gradient-to-r from-[#7A3838] to-[#9C1E1E] border-b border-white/10 px-3 py-2 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium text-white/90">Portal</span>
          
          <div className="flex items-center">
            <OnlineStoreButton />
          </div>
        </div>
      </header>
    );
  }

  return <ModernAdvertiserHeader />;
};

export default ResponsiveAdvertiserHeader;
