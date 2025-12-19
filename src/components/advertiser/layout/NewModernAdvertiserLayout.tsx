import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import NewModernAdvertiserSidebar from './NewModernAdvertiserSidebar';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { SofiaClientProvider } from '@/contexts/SofiaClientContext';
import { SofiaClientVoiceButton, SofiaNavigationPopup, SofiaQRCodePopup } from '@/components/client/sofia';

interface NewModernAdvertiserLayoutProps {
  children?: React.ReactNode;
}

const NewModernAdvertiserLayout: React.FC<NewModernAdvertiserLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useAdvancedResponsive();
  
  return (
    <SofiaClientProvider>
      <SidebarProvider 
        defaultOpen={!isMobile} 
        style={{
          "--sidebar-width": isTablet ? "240px" : "320px",
          "--sidebar-width-icon": "64px",
        } as React.CSSProperties}
      >
        <div className="flex h-screen w-full bg-background overflow-hidden">
          <div className="relative z-30">
            <NewModernAdvertiserSidebar />
          </div>
          <SidebarInset className="flex flex-col w-full overflow-x-hidden">
            <header className={`sticky top-0 z-10 flex items-center border-b px-3 md:px-4 ${
              isMobile 
                ? 'h-14 bg-gradient-to-r from-[#7A3838] to-[#9C1E1E] border-white/10' 
                : 'h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border'
            }`}>
              <SidebarTrigger className={`mr-3 md:mr-4 h-9 w-9 rounded-md transition-colors touch-target ${
                isMobile ? 'hover:bg-white/20 text-white' : 'hover:bg-accent hover:text-accent-foreground'
              }`} />
              {isMobile && (
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white truncate">Portal do Anunciante</h1>
                </div>
              )}
              {!isMobile && (
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-foreground">Portal do Anunciante</h1>
                </div>
              )}
            </header>
            <main className={`flex-1 p-3 md:p-6 overflow-y-auto bg-background min-h-0 overflow-x-hidden ${isMobile ? 'pb-20' : ''}`}>
              {children || <Outlet />}
            </main>
          </SidebarInset>
        </div>
        
        {/* Sofia Client Components */}
        <SofiaClientVoiceButton />
        <SofiaNavigationPopup />
        <SofiaQRCodePopup />
      </SidebarProvider>
    </SofiaClientProvider>
  );
};

export default NewModernAdvertiserLayout;
