import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useRealtimePanelAlerts } from '@/hooks/useRealtimePanelAlerts';
import { SofiaVoiceButton } from '@/components/admin/sofia';
import { SofiaProvider } from '@/contexts/SofiaContext';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  // Listen for real-time panel status changes and show toasts
  useRealtimePanelAlerts();
  
  return (
    <SofiaProvider>
      <SidebarProvider 
        defaultOpen={!isMobile} 
        style={{
          "--sidebar-width": isTablet ? "240px" : "320px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
          {/* Sidebar sempre renderizada, mas em modo drawer/overlay no mobile */}
          <div className="relative z-30">
            <ModernAdminSidebar />
          </div>
          
          {/* Botão 3D vermelho elegante na interseção sidebar/header */}
          <SidebarTrigger 
            className="absolute z-50 hidden md:flex"
            style={{
              left: isTablet ? '240px' : '320px',
              top: '32px',
              transform: 'translate(-50%, -50%)'
            }}
          />
          
          <SidebarInset className="flex flex-col w-full overflow-x-hidden">
            {/* Header - Apple-like clean design */}
            <header className={`sticky top-0 z-10 flex items-center px-3 md:px-4 ${
              isMobile 
                ? 'h-12 mobile-header-clean' 
                : 'h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border'
            }`}>
              {/* Trigger mobile dentro do header */}
              <SidebarTrigger className="md:hidden mr-2" />
              <ModernAdminHeader />
            </header>
            <main className={`flex-1 overflow-y-auto bg-white min-h-0 overflow-x-hidden ${
              isMobile ? 'pb-20' : 'p-6'
            }`}>
              {children || <Outlet />}
            </main>
            {isMobile && <MobileBottomNav />}
          </SidebarInset>
          
          {/* Sofia Voice AI Button */}
          <SofiaVoiceButton />
        </div>
      </SidebarProvider>
    </SofiaProvider>
  );
};

export default ModernAdminLayout;