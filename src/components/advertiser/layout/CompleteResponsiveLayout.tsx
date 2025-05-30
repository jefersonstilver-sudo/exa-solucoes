
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';
import ResponsiveAdvertiserHeader from './ResponsiveAdvertiserHeader';

const CompleteResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useMobileBreakpoints();

  const handleMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row w-full">
      {/* Sidebar */}
      <ResponsiveAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? 'lg:ml-80' : ''}`}>
        {/* Header */}
        <ResponsiveAdvertiserHeader
          onMenuClick={handleMenuClick}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompleteResponsiveLayout;
