import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ModuleHeader } from '../components/ModuleHeader';
import { useState } from 'react';
import { useModuleTheme, getThemeClass } from '../hooks/useModuleTheme';
import '../styles/theme.css';
import '../styles/scrollbar.css';

export const MonitoramentoIALayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useModuleTheme();
  const themeClass = getThemeClass(theme);

  return (
    <div className={`min-h-screen bg-module-primary flex ${themeClass}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        theme={theme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
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
