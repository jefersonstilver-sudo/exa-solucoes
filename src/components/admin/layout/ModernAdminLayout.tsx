import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useRealtimePanelAlerts } from '@/hooks/useRealtimePanelAlerts';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  // Listen for real-time panel status changes and show toasts
  useRealtimePanelAlerts();
  
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
        <div className="relative z-30">
          <ModernAdminSidebar />
        </div>
        <SidebarInset className="flex flex-col w-full overflow-x-hidden">
          {/* Header - Apple-like clean design */}
          <header className={`sticky top-0 z-10 flex items-center px-3 md:px-4 ${
            isMobile 
              ? 'h-12 mobile-header-clean' 
              : 'h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border'
          }`}>
            <SidebarTrigger className={`mr-2 md:mr-4 h-8 w-8 rounded-lg transition-colors touch-target ${
              isMobile 
                ? 'hover:bg-black/5 text-foreground' 
                : 'hover:bg-accent hover:text-accent-foreground'
            }`} />
            <ModernAdminHeader />
          </header>
          <main className={`flex-1 overflow-y-auto bg-white min-h-0 overflow-x-hidden ${
            isMobile ? 'pb-20' : 'p-6'
          }`}>
            {children || <Outlet />}
          </main>
          {isMobile && <MobileBottomNav />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernAdminLayout;