
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdvertiserDesktopSidebar from './layout/AdvertiserDesktopSidebar';
import AdvertiserMobileSidebar from './layout/AdvertiserMobileSidebar';
import ResponsiveAdvertiserHeader from './layout/ResponsiveAdvertiserHeader';
import UnifiedAdvertiserMobileHeader from './layout/UnifiedAdvertiserMobileHeader';
import { ProfileIncompleteAlert } from './ProfileIncompleteAlert';
import { useIsMobile } from '@/hooks/use-mobile';

const AdvertiserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Define títulos para cada rota
  const getPageTitle = () => {
    if (location.pathname.includes('/pedido/')) return 'Detalhes do Pedido';
    if (location.pathname.includes('/pedidos')) return 'Meus Pedidos';
    if (location.pathname.includes('/videos')) return 'Meus Vídeos';
    if (location.pathname.includes('/perfil')) return 'Perfil';
    return 'Portal do Anunciante';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <AdvertiserDesktopSidebar />

      {/* Mobile Sidebar Overlay */}
      <AdvertiserMobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-80 flex-1 flex flex-col min-h-screen">
        {/* Mobile: Unified Header com logo EXA */}
        {isMobile ? (
          <UnifiedAdvertiserMobileHeader
            title={getPageTitle()}
            onMenuClick={() => setSidebarOpen(true)}
          />
        ) : (
          /* Desktop: Header normal */
          <ResponsiveAdvertiserHeader 
            onMenuClick={() => setSidebarOpen(true)} 
            isMobile={isMobile}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <ProfileIncompleteAlert />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdvertiserLayout;
