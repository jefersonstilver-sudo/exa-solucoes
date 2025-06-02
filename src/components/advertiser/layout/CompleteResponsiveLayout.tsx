
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
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236B46C1%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M50%2050c0-13.8-11.2-25-25-25S0%2036.2%200%2050s11.2%2025%2025%2025%2025-11.2%2025-25zm50%200c0-13.8-11.2-25-25-25s-25%2011.2-25%2025%2011.2%2025%2025%2025%2025-11.2%2025-25z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
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
