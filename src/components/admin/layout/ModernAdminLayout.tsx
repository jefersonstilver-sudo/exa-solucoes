import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useSidebarResize } from '@/hooks/useSidebarResize';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  const { width, isDragging, isCollapsed, startResize } = useSidebarResize();
  
  // Determine sidebar width based on resize or default
  const sidebarWidth = isMobile ? "18rem" : isCollapsed ? "64px" : `${width}px`;
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile && !isCollapsed} 
      style={{
        "--sidebar-width": sidebarWidth,
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className={`flex h-screen w-full bg-background overflow-hidden ${isDragging ? 'select-none' : ''}`}>
        {/* Sidebar sempre renderizada, mas em modo drawer/overlay no mobile */}
        <div className="relative z-30">
          <ModernAdminSidebar 
            width={isMobile ? undefined : width}
            isDragging={isDragging}
            onStartResize={isMobile ? undefined : startResize}
          />
        </div>
        <SidebarInset className="flex flex-col w-full overflow-x-hidden">
          {/* Header with hamburger menu - sempre visível */}
          <header className={`sticky top-0 z-10 flex items-center border-b px-3 md:px-4 ${
            isMobile 
              ? 'h-14 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-white/20' 
              : 'h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border'
          }`}>
            <SidebarTrigger className={`mr-3 md:mr-4 h-9 w-9 rounded-md transition-colors touch-target ${
              isMobile ? 'hover:bg-white/20 text-white' : 'hover:bg-accent hover:text-accent-foreground'
            }`} />
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
