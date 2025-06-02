
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import ModernAdvertiserSidebar from './ModernAdvertiserSidebar';
import ModernAdvertiserHeader from './ModernAdvertiserHeader';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col lg:flex-row w-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236B46C1" fill-opacity="0.05"%3E%3Cpath d="M50 50c0-13.8-11.2-25-25-25S0 36.2 0 50s11.2 25 25 25 25-11.2 25-25zm50 0c0-13.8-11.2-25-25-25s-25 11.2-25 25 11.2 25 25 25 25-11.2 25-25z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Sidebar */}
      <ModernAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen relative z-10 ${!isMobile ? 'lg:ml-80' : ''}`}>
        {/* Header */}
        <ModernAdvertiserHeader
          onMenuClick={handleMenuClick}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 min-h-[calc(100vh-200px)] p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompleteResponsiveLayout;
