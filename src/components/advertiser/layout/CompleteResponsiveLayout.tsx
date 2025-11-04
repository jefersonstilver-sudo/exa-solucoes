
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { Button } from '@/components/ui/button';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';

const CompleteResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop, isXl } = useMobileBreakpoints();

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <ResponsiveAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
        isTablet={isTablet}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area - sem header separado */}
      <main className={`flex-1 overflow-hidden ${!(isMobile || isTablet) ? (sidebarCollapsed ? 'ml-16' : 'ml-80') : ''}`}>
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 flex items-center space-x-4">
              {isMobile || isTablet ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="bg-gradient-to-r from-[#3C1361] to-[#5a1a8f] text-white hover:from-[#5a1a8f] hover:to-[#3C1361] shadow-md transition-all duration-300"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              ) : (isDesktop || isXl) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebarCollapse}
                  className="text-[#3C1361] hover:bg-[#3C1361]/10 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              ) : null}
              <h1 className="text-2xl font-bold text-[#3C1361]">Portal do Anunciante</h1>
            </div>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteResponsiveLayout;
