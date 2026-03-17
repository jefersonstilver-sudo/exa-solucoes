import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { SofiaVoiceButton } from '@/components/admin/sofia';
import { SofiaProvider } from '@/contexts/SofiaContext';

// Rotas que devem ocultar o header para modo fullscreen
const FULLSCREEN_ROUTES = ['/admin/contatos-kanban', '/super_admin/contatos-kanban', '/tarefas/fullscreen'];

const SidebarTriggerPositioned = ({ isTablet }: { isTablet: boolean }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const expandedWidth = isTablet ? 220 : 260;
  const collapsedWidth = 64;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;
  
  return (
    <SidebarTrigger 
      className="absolute z-50 hidden md:flex transition-all duration-200 h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5"
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
  const location = useLocation();
  
  // Verifica se deve ocultar o header (modo fullscreen)
  const isFullscreenMode = FULLSCREEN_ROUTES.some(route => location.pathname.includes(route.split('/').pop() || ''));
  
  // Sidebar minimizada por padrão em modo fullscreen
  const sidebarDefaultOpen = isFullscreenMode ? false : !isMobile;
  
  return (
    <SofiaProvider>
      <SidebarProvider
        defaultOpen={sidebarDefaultOpen} 
        style={{
          "--sidebar-width": isTablet ? "220px" : "260px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
          <ModernAdminSidebar />
          
          {!isMobile && <SidebarTriggerPositioned isTablet={isTablet} />}
          
          <SidebarInset className="flex flex-col w-full overflow-x-hidden">
            {/* Header com logo EXA - oculto em modo fullscreen */}
            {!isFullscreenMode && (
              <header className={`sticky top-0 z-10 h-14 md:h-20 flex items-center border-b px-3 md:px-6 shadow-lg ${
                isMobile 
                  ? 'bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-white/20' 
                  : 'bg-background border-border'
              }`}>
                {/* Trigger mobile dentro do header */}
                <SidebarTrigger className="md:hidden mr-3" />
                <ModernAdminHeader />
              </header>
            )}
            <main className={`flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 min-h-0 overflow-x-hidden ${
              isFullscreenMode ? 'p-0' : 'p-2 md:p-6'
            }`}>
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
