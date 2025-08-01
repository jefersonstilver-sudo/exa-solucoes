
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        <ModernAdminSidebar />
        <SidebarInset className="flex flex-col w-full">
          <ModernAdminHeader />
          <main className="flex-1 p-6 overflow-y-auto bg-background">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernSuperAdminLayout;
