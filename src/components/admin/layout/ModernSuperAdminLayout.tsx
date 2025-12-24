import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { SofiaVoiceButton } from '@/components/admin/sofia';
import { SofiaProvider } from '@/contexts/SofiaContext';

const SidebarTriggerPositioned = ({ isTablet }: { isTablet: boolean }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const expandedWidth = isTablet ? 220 : 260;
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

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  return (
    <SofiaProvider>
      <SidebarProvider
        defaultOpen={!isMobile} 
        style={{
          "--sidebar-width": isTablet ? "220px" : "260px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
          {/* Sidebar sempre renderizada, mas em modo drawer/overlay no mobile */}
          <div className="relative z-30"><ModernAdminSidebar /></div>
          
          {/* Botão 3D vermelho elegante na interseção sidebar/header */}
          <SidebarTriggerPositioned isTablet={isTablet} />
          
          <SidebarInset className="flex flex-col w-full overflow-x-hidden">
            {/* Header com logo EXA - estilo elegante vermelho */}
            <header className={`sticky top-0 z-10 h-14 md:h-20 flex items-center border-b px-3 md:px-6 shadow-lg ${
              isMobile 
                ? 'bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-white/20' 
                : 'bg-background border-border'
            }`}>
              {/* Trigger mobile dentro do header */}
              <SidebarTrigger className="md:hidden mr-3" />
              <ModernAdminHeader />
            </header>
            <main className="flex-1 p-2 md:p-6 overflow-y-auto bg-gradient-to-b from-background to-muted/20 min-h-0 overflow-x-hidden">
              {children || <Outlet />}
            </main>
          </SidebarInset>
          
          {/* Sofia Voice AI Button */}
          <SofiaVoiceButton />
        </div>
      </SidebarProvider>
    </SofiaProvider>
  );
};

export default ModernSuperAdminLayout;
