import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarProvider, useSidebarContext } from '../context/SidebarContext';
import { cn } from '@/lib/utils';
import '../styles/theme.css';
import '../styles/scrollbar.css';
import '../styles/anydesk.css';

export const MonitoramentoIALayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop: inicia expandido
  const { theme, toggleTheme } = useModuleTheme();
  const themeClass = getThemeClass(theme);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Detectar se está na rota do CRM para layout fullscreen no mobile
  const isCRMRoute = location.pathname.includes('/crm');
  const isFullScreenMobile = isMobile && isCRMRoute;

  return (
    <SidebarProvider>
      <LayoutContent 
        theme={theme}
        themeClass={themeClass}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        toggleTheme={toggleTheme}
        isCRMRoute={isCRMRoute}
        isFullScreenMobile={isFullScreenMobile}
      />
    </SidebarProvider>
  );
};

// Componente interno que usa o contexto
const LayoutContent = ({ 
  theme, 
  themeClass, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  toggleTheme,
  isCRMRoute,
  isFullScreenMobile
}: {
  theme: 'dark' | 'light';
  themeClass: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  isCRMRoute: boolean;
  isFullScreenMobile: boolean;
}) => {
  const { sidebarOpen, setSidebarOpen } = useSidebarContext();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex relative bg-[var(--exa-bg-primary)] overflow-hidden"
      style={{ backgroundAttachment: 'fixed' }}>
      
      {/* Mobile Drawer (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="p-0 w-64 border-0 bg-card"
          >
            <Sidebar 
              isOpen={true}
              onClose={() => setSidebarOpen(false)} 
              theme={theme}
              collapsed={false}
              onToggleCollapse={() => {}}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar - sempre visível no desktop */}
      {!isMobile && (
        <Sidebar 
          isOpen={true}
          onClose={() => {}} 
          theme={theme}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Decorative shapes */}
      <div className="shape-1" />
      <div className="shape-2" />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 relative z-10 overflow-hidden ${
        !isFullScreenMobile && !isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
      }`}>
        {/* Page Content - sem padding/scroll no CRM */}
        <div className={cn(
          "flex-1",
          isCRMRoute ? 'overflow-hidden' : 'p-4 lg:p-8 overflow-y-auto'
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
