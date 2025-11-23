import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ModuleHeader } from '../components/ModuleHeader';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import '../styles/theme.css';
import '../styles/scrollbar.css';
import '../styles/anydesk.css';

export const MonitoramentoIALayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useModuleTheme();
  const themeClass = getThemeClass(theme);

  return (
    <div className={`min-h-screen bg-module-primary flex ${themeClass} relative`} style={{
      backgroundImage: `
        radial-gradient(ellipse at 20% 30%, rgba(156, 30, 30, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, rgba(156, 30, 30, 0.1) 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        theme={theme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Decorative shapes */}
      <div className="shape-1" />
      <div className="shape-2" />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Module Header */}
        <ModuleHeader 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          onToggleSidebar={() => setSidebarOpen(true)} 
        />

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
