import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarProvider, useSidebarContext } from '../context/SidebarContext';
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
    <div className={`min-h-screen flex ${themeClass} relative`} style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 50%, #FFFFFF 100%)',
        backgroundAttachment: 'fixed'
      }}>
      
      {/* Mobile Drawer (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="p-0 w-64 border-0"
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(180deg, #3A0808 0%, #1A0404 100%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
            }}
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
      <main className={`flex-1 transition-all duration-300 relative z-10 ${
        !isFullScreenMobile && !isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
      }`}>
        {/* Page Content - sem padding no CRM mobile */}
        <div className={isFullScreenMobile ? '' : 'p-4 lg:p-8'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
