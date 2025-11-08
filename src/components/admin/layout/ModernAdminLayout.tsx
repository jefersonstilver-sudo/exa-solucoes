import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      style={{
        "--sidebar-width": isTablet ? "240px" : "320px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Esconder sidebar no mobile - usar apenas MobileBottomNav */}
        {!isMobile && (
          <div className="relative z-30">
            <ModernAdminSidebar />
          </div>
        )}
        <SidebarInset className="flex flex-col w-full overflow-x-hidden">
          {/* Header with hamburger menu - visible apenas no desktop/tablet */}
          <header className="sticky top-0 z-10 h-14 md:h-16 flex items-center border-b border-border px-3 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {!isMobile && (
              <SidebarTrigger className="mr-3 md:mr-4 h-9 w-9 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors touch-target" />
            )}
            <ModernAdminHeader />
          </header>
          <main className={`flex-1 p-3 md:p-6 overflow-y-auto bg-background min-h-0 overflow-x-hidden ${isMobile ? 'pb-20' : ''}`}>
            {children || <Outlet />}
          </main>
          {isMobile && <MobileBottomNav />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernAdminLayout;