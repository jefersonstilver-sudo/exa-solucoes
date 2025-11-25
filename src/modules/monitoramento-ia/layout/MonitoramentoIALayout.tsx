import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ModuleHeader } from '../components/ModuleHeader';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import '../styles/theme.css';
import '../styles/scrollbar.css';
import '../styles/anydesk.css';

export const MonitoramentoIALayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useModuleTheme();
  const themeClass = getThemeClass(theme);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Detectar se está na rota do CRM para layout fullscreen (mobile E desktop)
  const isCRMRoute = location.pathname.includes('/crm');
  const isFullScreenCRM = isCRMRoute;

  return (
    <div className={`min-h-screen flex ${themeClass} relative`} style={{
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 50%, #FFFFFF 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Sidebar - não exibir em CRM */}
      {!isFullScreenCRM && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          theme={theme}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Decorative shapes - não exibir em CRM */}
      {!isFullScreenCRM && (
        <>
          <div className="shape-1" />
          <div className="shape-2" />
        </>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative z-10 ${!isFullScreenCRM && (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64')}`}>
        {/* Module Header - esconder no CRM */}
        {!isFullScreenCRM && (
          <ModuleHeader 
            theme={theme} 
            onToggleTheme={toggleTheme} 
            onToggleSidebar={() => setSidebarOpen(true)} 
          />
        )}

        {/* Page Content - sem padding no CRM */}
        <div className={isFullScreenCRM ? '' : 'p-4 lg:p-8'}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay - não exibir em CRM */}
      {sidebarOpen && !isFullScreenCRM && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
