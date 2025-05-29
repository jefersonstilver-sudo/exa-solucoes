
import React from 'react';
import { Outlet } from 'react-router-dom';
import ModernAdvertiserSidebar from './ModernAdvertiserSidebar';
import ModernAdvertiserHeader from './ModernAdvertiserHeader';

const ModernAdvertiserLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 fixed inset-y-0 z-30">
        <ModernAdvertiserSidebar />
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <ModernAdvertiserHeader />
        
        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default ModernAdvertiserLayout;
