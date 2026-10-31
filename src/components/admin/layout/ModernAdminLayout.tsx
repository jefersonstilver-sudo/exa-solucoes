import React from 'react';
import { DentroDoLayout } from '@/components/loading/MarcaCarregando';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminMenuButton from './AdminMenuButton';
import { ADMIN_FUNDO_CLASSE } from './ModernSuperAdminLayout';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import ConviteAvisos from '@/components/avisos/ConviteAvisos';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useTecladoCelular } from '@/hooks/useTecladoCelular';
import { useRealtimePanelAlerts } from '@/hooks/useRealtimePanelAlerts';

interface ModernAdminLayoutProps {
  children?: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  useTecladoCelular(isMobile);
  const location = useLocation();
  const isConversation = /\/crm-evolution\/conversas\//.test(location.pathname);
  
  useRealtimePanelAlerts();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      style={{
        "--sidebar-width": isTablet ? "240px" : "248px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className={`exa-admin exa-app-altura flex w-full overflow-hidden relative ${ADMIN_FUNDO_CLASSE}`}>
        <ModernAdminSidebar />
        
        <SidebarInset className="flex flex-col w-full overflow-x-hidden bg-transparent">
          {!(isMobile && isConversation) && (
          <header
            className={`sticky top-0 z-10 flex items-center gap-2 px-4 md:px-5 ${
              isMobile
                ? 'h-14 bg-gradient-to-b from-[#A8261F] to-[#86190F] text-white shadow-md'
                : 'h-16 bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/5 text-[#17181A]'
            }`}
            style={isMobile ? { paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' } : undefined}
          >
            {!isMobile && <AdminMenuButton className="hover:bg-black/5" />}
            <ModernAdminHeader />
          </header>
          )}
          <main className={`${isMobile ? (isConversation ? 'exa-main-conversa' : 'exa-main-nav') : ''} flex-1 overflow-y-auto min-h-0 overflow-x-hidden ${
            isConversation ? 'p-0 overflow-hidden cx-sem-topo' : isMobile ? 'p-3' : 'p-6'
          }`}>
            <DentroDoLayout.Provider value={true}>{children || <Outlet />}</DentroDoLayout.Provider>
          </main>
          {isMobile && <MobileBottomNav />}
          <ConviteAvisos publico="equipe" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ModernAdminLayout;
