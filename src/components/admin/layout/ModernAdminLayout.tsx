import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useRealtimePanelAlerts } from '@/hooks/useRealtimePanelAlerts';
import { Menu } from 'lucide-react';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const MobileMenuTrigger = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <button 
      onClick={toggleSidebar} 
      className="md:hidden mr-2 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};

const SidebarTriggerPositioned = ({ isTablet }: { isTablet: boolean }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const expandedWidth = isTablet ? 240 : 320;
  const collapsedWidth = 64;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;
  
  return (
    <SidebarTrigger 
      className="absolute z-50 hidden md:flex transition-all duration-200"
      style={{
        left: `${currentWidth}px`,
        top: '150px',
        transform: 'translate(-50%, -50%)'
      }}
    />
  );
};

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  useRealtimePanelAlerts();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      style={{
        "--sidebar-width": isTablet ? "240px" : "320px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
        <ModernAdminSidebar />
        
        {!isMobile && <SidebarTriggerPositioned isTablet={isTablet} />}
        
        <SidebarInset className="flex flex-col w-full overflow-x-hidden">
          <header className={`sticky top-0 z-10 flex items-center px-3 md:px-4 ${
            isMobile 
              ? 'h-12 bg-white border-b border-gray-200 shadow-sm' 
              : 'h-16 bg-white border-b border-gray-200 shadow-sm'
          }`}>
            <MobileMenuTrigger />
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
