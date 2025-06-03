
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isCollapsed, toggle } = useSidebarToggle();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <ModernAdminSidebar isCollapsed={isCollapsed} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header com botão hambúrguer */}
        <ModernAdminHeader onToggleSidebar={toggle} />
        
        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default ModernSuperAdminLayout;
