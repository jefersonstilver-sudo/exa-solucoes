
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { Button } from '@/components/ui/button';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';

const CompleteResponsiveLayout = () => {
  const { isMobile, isTablet } = useMobileBreakpoints();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <main className={`flex-1 overflow-hidden ${!isMobile ? (sidebarCollapsed ? 'ml-16' : 'ml-80') : ''}`}>
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <div className="mb-6 flex items-center space-x-4">
              {!isMobile && !isTablet && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebarCollapse}
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">Portal do Anunciante</h1>
            </div>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteResponsiveLayout;
