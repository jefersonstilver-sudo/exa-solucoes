
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';

const CompleteResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useMobileBreakpoints();

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <ResponsiveAdvertiserSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />

      {/* Main Content Area - sem header separado */}
      <main className={`flex-1 overflow-hidden ${!isMobile ? 'ml-80' : ''}`}>
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
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
