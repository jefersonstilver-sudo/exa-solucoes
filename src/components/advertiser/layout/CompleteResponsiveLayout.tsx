
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';

const CompleteResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop, isXl } = useMobileBreakpoints();

  const handleSidebarClose = () => {
    console.log('🔴 Fechando sidebar');
    setSidebarOpen(false);
  };

  const handleSidebarOpen = () => {
    console.log('🟢 Abrindo sidebar');
    setSidebarOpen(true);
  };

  const toggleSidebarCollapse = () => {
    console.log('🔄 Toggle collapse:', !sidebarCollapsed);
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full relative">
      {/* Sidebar */}
      <ResponsiveAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
        isTablet={isTablet}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full min-h-screen transition-all duration-300",
        !(isMobile || isTablet) && (sidebarCollapsed ? 'ml-16' : 'ml-80')
      )}>
        <div className="h-full">
          {/* Header com botão hambúrguer */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex items-center space-x-4">
                {(isMobile || isTablet) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSidebarOpen}
                    className="flex-shrink-0 bg-gradient-to-r from-exa-red to-exa-red/90 text-white hover:from-exa-red/90 hover:to-exa-red shadow-md transition-all duration-300"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                {(isDesktop || isXl) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebarCollapse}
                    className="flex-shrink-0 text-[#3C1361] hover:bg-[#3C1361]/10 transition-colors"
                    aria-label="Alternar menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-[#3C1361] truncate">
                  Portal do Anunciante
                </h1>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteResponsiveLayout;
