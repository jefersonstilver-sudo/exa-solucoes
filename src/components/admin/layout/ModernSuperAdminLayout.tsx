import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
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
          {/* Sidebar sempre renderizada, mas em modo drawer/overlay no mobile */}
          <div className="relative z-30"><ModernAdminSidebar /></div>
          <SidebarInset className="flex flex-col w-full overflow-x-hidden">
            {/* Header with hamburger menu - sempre visível */}
            <header className={`sticky top-0 z-10 h-16 md:h-20 flex items-center border-b px-3 md:px-6 shadow-lg ${
              isMobile 
                ? 'bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-white/20' 
                : 'bg-background border-border'
            }`}>
              <SidebarTrigger className={`mr-3 md:mr-4 h-9 w-9 rounded-md transition-colors touch-target ${
                isMobile ? 'hover:bg-white/20 text-white' : 'hover:bg-accent text-foreground'
              }`} />
              <ModernAdminHeader />
            </header>
            <main className="flex-1 p-3 md:p-6 overflow-y-auto bg-background min-h-0 overflow-x-hidden">
              {children || <Outlet />}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
  );
};

export default ModernSuperAdminLayout;
