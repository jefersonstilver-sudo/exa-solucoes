
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/user/UserMenu';

const ModernAdminHeader = () => {
  return (
    <header className="border-b bg-gradient-to-r from-indexa-purple to-indexa-purple/95 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SidebarTrigger className="text-white hover:bg-white/10 transition-colors duration-200" />
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
