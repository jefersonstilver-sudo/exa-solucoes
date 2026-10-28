import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import AdminMenuButton from './AdminMenuButton';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { SofiaLauncher } from '@/components/admin/sofia/SofiaLauncher';
import AdminMasterWelcomeDialog from '@/components/impersonation/AdminMasterWelcomeDialog';

// Rotas que devem ocultar o header para modo fullscreen
const FULLSCREEN_ROUTES = ['/admin/contatos-kanban', '/super_admin/contatos-kanban', '/tarefas/fullscreen'];

/** Fundo claro "glass" do painel: off-white quente com um véu vermelho suave no topo. */
export const ADMIN_FUNDO_CLASSE =
  'bg-[#F4F1EC] bg-[radial-gradient(70%_40%_at_15%_0%,rgba(234,37,29,0.08),rgba(234,37,29,0)_70%)]';

const ModernSuperAdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  const location = useLocation();

  const isFullscreenMode = FULLSCREEN_ROUTES.some(route => location.pathname.includes(route.split('/').pop() || ''));
  const sidebarDefaultOpen = isFullscreenMode ? false : !isMobile;

  return (
    <>
      <SidebarProvider
        defaultOpen={sidebarDefaultOpen}
        style={{
          "--sidebar-width": isTablet ? "220px" : "248px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        <div className={`flex h-screen w-full overflow-hidden relative ${ADMIN_FUNDO_CLASSE}`}>
          <ModernAdminSidebar />

          <SidebarInset className="flex flex-col w-full overflow-x-hidden bg-transparent">
            {!isFullscreenMode && (
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
            )}
            {isFullscreenMode && (
              <AdminMenuButton className="absolute left-2 top-2 z-20 bg-white/80 backdrop-blur shadow hover:bg-white" />
            )}
            <main className={`flex-1 overflow-y-auto min-h-0 overflow-x-hidden ${
              isFullscreenMode ? 'p-0' : isMobile ? 'p-2 pb-24' : 'p-6'
            }`}>
              {children || <Outlet />}
            </main>
            {isMobile && !isFullscreenMode && <MobileBottomNav />}
          </SidebarInset>

          <SofiaLauncher />
          <AdminMasterWelcomeDialog />
        </div>
      </SidebarProvider>
    </>
  );
};

export default ModernSuperAdminLayout;
