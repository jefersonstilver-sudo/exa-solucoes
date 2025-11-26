
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdvertiserDesktopSidebar from './layout/AdvertiserDesktopSidebar';
import AdvertiserMobileSidebar from './layout/AdvertiserMobileSidebar';
import ResponsiveAdvertiserHeader from './layout/ResponsiveAdvertiserHeader';
import { ProfileIncompleteAlert } from './ProfileIncompleteAlert';
import { useIsMobile } from '@/hooks/use-mobile';

const AdvertiserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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
        {/* Responsive Header with EXA branding */}
        <ResponsiveAdvertiserHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">
          <ProfileIncompleteAlert />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdvertiserLayout;
