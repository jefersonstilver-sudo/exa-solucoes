
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { useSidebarResponsive } from '@/hooks/useSidebarResponsive';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNavigation from '@/components/mobile/MobileBottomNavigation';
import MobileDrawerNavigation from '@/components/mobile/MobileDrawerNavigation';
import AdvertiserDesktopSidebar from './AdvertiserDesktopSidebar';
import AdvertiserMobileHeader from './AdvertiserMobileHeader';

const ResponsiveAdvertiserLayout = () => {
  const { isMobile, isTablet } = useMobileBreakpoints();
  const { 
    isOpen, 
    variant, 
    isMobileDrawerOpen, 
    toggle, 
    closeMobileDrawer 
  } = useSidebarResponsive();
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Layout Mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Mobile Header */}
        <AdvertiserMobileHeader onMenuClick={toggle} />

        {/* Mobile Drawer */}
        <MobileDrawerNavigation
          isOpen={isMobileDrawerOpen}
          onClose={closeMobileDrawer}
          userProfile={userProfile}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="px-4 py-6">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <MobileBottomNavigation />
      </div>
    );
  }

  // Layout Desktop/Tablet
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className={`${isOpen ? 'w-80' : 'w-16'} transition-all duration-300 fixed inset-y-0 z-30`}>
        <AdvertiserDesktopSidebar collapsed={!isOpen} onToggle={toggle} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isOpen ? 'ml-80' : 'ml-16'} transition-all duration-300`}>
        {/* Mobile Header - só mostra em tablet */}
        {isTablet && <AdvertiserMobileHeader onMenuClick={toggle} />}

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResponsiveAdvertiserLayout;
