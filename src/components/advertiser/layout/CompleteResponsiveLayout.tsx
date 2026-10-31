
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ResponsiveAdvertiserSidebar from './ResponsiveAdvertiserSidebar';
import { AnuncianteAppTopo, AnuncianteNavInferior } from './AnuncianteAppChrome';
import ConviteAvisos from '@/components/avisos/ConviteAvisos';
import { useTecladoCelular } from '@/hooks/useTecladoCelular';
import { DentroDoLayout } from '@/components/loading/MarcaCarregando';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import ImpersonationTopBar from '@/components/impersonation/ImpersonationTopBar';
import { useAuth } from '@/hooks/useAuth';
import { useFimAbertura } from '@/lib/fimAbertura';

const CompleteResponsiveLayout = () => {
  useFimAbertura();
  const { userProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop, isXl } = useMobileBreakpoints();
  const location = useLocation();
  // Modo embutido: usado quando o portal é renderizado dentro de um iframe
  // a partir do super_admin (ClientOrderViewSheet). Mantém a navegação do cliente
  // dentro do próprio painel, mas sem duplicar a barra vermelha global.
  const isEmbedded = new URLSearchParams(location.search).get('embedded') === '1';
  const celular = isMobile || isTablet;
  useTecladoCelular(celular);

  const getPageTitle = () => {
    if (location.pathname.includes('/pedido/')) return 'Detalhes do Pedido';
    if (location.pathname.includes('/pedidos')) return 'Meus Pedidos';
    if (location.pathname.includes('/videos')) return 'Relatório';
    if (location.pathname.includes('/perfil')) return 'Perfil';
    if (location.pathname.includes('/configuracoes')) return 'Configurações';
    return 'Área do anunciante';
  };

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarOpen = () => setSidebarOpen(true);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <ImpersonationProvider fallbackUserId={(userProfile as any)?.user_id || (userProfile as any)?.id || null}>
      {!isEmbedded && <ImpersonationTopBar />}
      <div className="exa-admin exa-anunciante min-h-screen bg-[#f3f1f2] flex w-full relative">
        {!celular && <ResponsiveAdvertiserSidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          isMobile={isMobile}
          isTablet={isTablet}
          isCollapsed={sidebarCollapsed}
        />}

      <main className={cn(
        "flex-1 w-full min-h-screen transition-all duration-300",
        // celular: quem rola é a página (topo e abas ficam presos com sticky); computador: rola a área principal
        !celular && 'overflow-y-auto',
        !(isMobile || isTablet) && (sidebarCollapsed ? 'ml-[72px]' : 'ml-72')
      )}>
        <div className="h-full">
          {(isDesktop || isXl) && (
            <div className="sticky top-0 z-10 border-b border-[#ebe6e7] bg-[#f3f1f2]/85 backdrop-blur">
              <div className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebarCollapse}
                    className="h-9 w-9 flex-shrink-0 rounded-xl text-[#554e50] hover:bg-white"
                    aria-label="Alternar menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="truncate text-[15px] font-bold text-[#1b1719]">{getPageTitle()}</h1>
                </div>
              </div>
            </div>
          )}

          {celular && <AnuncianteAppTopo />}

          <div className={cn('px-4 sm:px-6', celular ? 'pt-1 pb-[calc(6rem+env(safe-area-inset-bottom))]' : 'py-5 sm:py-6')}>
            <DentroDoLayout.Provider value={true}>
              <Outlet />
            </DentroDoLayout.Provider>
          </div>
        </div>
      </main>
      {celular && <AnuncianteNavInferior />}
      <ConviteAvisos publico="cliente" />
      </div>
    </ImpersonationProvider>
  );
};

export default CompleteResponsiveLayout;
