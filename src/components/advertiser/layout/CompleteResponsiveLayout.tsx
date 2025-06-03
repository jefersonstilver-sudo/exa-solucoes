
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';

const CompleteResponsiveLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useMobileBreakpoints();
  const { isCollapsed, toggle } = useSidebarToggle();

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      toggle();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <ResponsiveAdvertiserSidebar
        isOpen={isMobile ? mobileMenuOpen : !isCollapsed}
        onClose={handleMobileMenuClose}
        isMobile={isMobile}
        isCollapsed={!isMobile && isCollapsed}
      />

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden transition-all duration-300 ${
        !isMobile ? (isCollapsed ? 'ml-16' : 'ml-80') : ''
      }`}>
        <div className="h-full overflow-y-auto">
          {/* Header com botão hambúrguer */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="p-2 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Portal do Anunciante</h1>
            </div>
          </div>

          {/* Conteúdo da página */}
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteResponsiveLayout;
