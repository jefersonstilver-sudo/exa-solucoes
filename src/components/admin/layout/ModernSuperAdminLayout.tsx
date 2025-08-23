
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        <ModernAdminSidebar />
        <SidebarInset className="flex flex-col w-full">
          {/* Header with hamburger menu */}
          <header className="h-16 flex items-center border-b border-border px-4 bg-background">
            <SidebarTrigger className="mr-4" />
            <ModernAdminHeader />
          </header>
          <main className="flex-1 p-6 overflow-y-auto bg-background">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernSuperAdminLayout;
