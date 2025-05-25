
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/user/UserMenu';

const ModernAdminHeader = () => {
  return (
    <header className="border-b bg-indexa-purple text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-white hover:bg-white/10" />
          <div>
            <h1 className="text-xl font-semibold">INDEXA MEDIA</h1>
            <p className="text-sm text-white/80">Painel Administrativo</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
