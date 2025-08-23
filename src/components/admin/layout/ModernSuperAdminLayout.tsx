
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isMobile, isTablet } = useResponsiveLayout();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      style={{
        "--sidebar-width": "320px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <div className="relative z-30"><ModernAdminSidebar /></div>
        <SidebarInset className="flex flex-col w-full overflow-x-hidden">
          {/* Header with hamburger menu - always visible */}
          <header className="sticky top-0 z-10 h-16 flex items-center border-b border-border px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="mr-4 h-9 w-9 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors" />
            <ModernAdminHeader />
          </header>
          <main className="flex-1 p-6 overflow-y-auto bg-background min-h-0 overflow-x-hidden">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernSuperAdminLayout;
