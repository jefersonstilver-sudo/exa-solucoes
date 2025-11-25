import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ModuleHeader } from '../components/ModuleHeader';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarProvider } from '../context/SidebarContext';
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
      <div className={`min-h-screen flex ${themeClass} relative`} style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 50%, #FFFFFF 100%)',
        backgroundAttachment: 'fixed'
      }}>
      
      {/* Desktop Sidebar - sempre visível no desktop */}
      <Sidebar 
        isOpen={true}
        onClose={() => {}} 
        theme={theme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Decorative shapes */}
      <div className="shape-1" />
      <div className="shape-2" />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative z-10 ${
        !isFullScreenMobile && !isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
      }`}>
      {/* Module Header - esconder no CRM */}
        {!isCRMRoute && (
          <ModuleHeader 
            theme={theme} 
            onToggleTheme={toggleTheme} 
            onToggleSidebar={() => {}} 
          />
        )}

        {/* Page Content - sem padding no CRM mobile */}
        <div className={isFullScreenMobile ? '' : 'p-4 lg:p-8'}>
          <Outlet />
        </div>
      </main>
    </div>
    </SidebarProvider>
  );
};
