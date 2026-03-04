
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';
import UnifiedAdvertiserMobileHeader from './UnifiedAdvertiserMobileHeader';

const CompleteResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop, isXl } = useMobileBreakpoints();
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.includes('/pedido/')) return 'Detalhes do Pedido';
    if (location.pathname.includes('/pedidos')) return 'Meus Pedidos';
    if (location.pathname.includes('/videos')) return 'Relatório';
    if (location.pathname.includes('/perfil')) return 'Perfil';
    if (location.pathname.includes('/configuracoes')) return 'Configurações';
    return 'Portal do Anunciante';
  };

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarOpen = () => setSidebarOpen(true);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full relative">
      <ResponsiveAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
        isTablet={isTablet}
        isCollapsed={sidebarCollapsed}
      />

      <main className={cn(
        "flex-1 w-full min-h-screen overflow-y-auto transition-all duration-300",
        !(isMobile || isTablet) && (sidebarCollapsed ? 'ml-16' : 'ml-80')
      )}>
        <div className="h-full">
          {(isDesktop || isXl) && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebarCollapse}
                    className="flex-shrink-0 text-[#3C1361] hover:bg-[#3C1361]/10 transition-colors"
                    aria-label="Alternar menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#3C1361] truncate">
                    Meus Pedidos
                  </h1>
                </div>
              </div>
            </div>
          )}
          
          {(isMobile || isTablet) && (
            <UnifiedAdvertiserMobileHeader
              title={getPageTitle()}
              onMenuClick={handleSidebarOpen}
            />
          )}

          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteResponsiveLayout;
