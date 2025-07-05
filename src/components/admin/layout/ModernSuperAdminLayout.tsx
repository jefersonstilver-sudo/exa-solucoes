
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <ModernAdminSidebar isCollapsed={sidebarCollapsed} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header único - apenas ModernAdminHeader */}
        <ModernAdminHeader 
          onToggleSidebar={toggleSidebarCollapse}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default ModernSuperAdminLayout;
