
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
          <div className="bg-gradient-to-r from-[#3C1361] via-[#9333EA] to-[#A855F7] border-b border-white/20 px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="p-2 hover:bg-white/20 text-white border border-white/30 rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-white">Portal do Anunciante</h1>
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
