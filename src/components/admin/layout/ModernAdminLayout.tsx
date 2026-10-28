import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminMenuButton from './AdminMenuButton';
import { ADMIN_FUNDO_CLASSE } from './ModernSuperAdminLayout';
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
  
  useRealtimePanelAlerts();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile} 
      style={{
        "--sidebar-width": isTablet ? "240px" : "248px",
        "--sidebar-width-icon": "64px",
      } as React.CSSProperties}
    >
      <div className={`flex h-screen w-full overflow-hidden relative ${ADMIN_FUNDO_CLASSE}`}>
        <ModernAdminSidebar />
        
        <SidebarInset className="flex flex-col w-full overflow-x-hidden bg-transparent">
          <header
            className={`sticky top-0 z-10 flex items-center gap-2 px-2 md:px-5 ${
              isMobile
                ? 'h-14 bg-gradient-to-b from-[#A8261F] to-[#86190F] text-white shadow-md'
                : 'h-16 bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/5 text-[#17181A]'
            }`}
            style={isMobile ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
          >
            <AdminMenuButton className={isMobile ? 'hover:bg-white/10' : 'hover:bg-black/5'} />
            <ModernAdminHeader />
          </header>
          <main className={`flex-1 overflow-y-auto min-h-0 overflow-x-hidden ${
            isMobile ? 'p-2 pb-24' : 'p-6'
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
