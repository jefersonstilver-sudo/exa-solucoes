import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

export const MonitoramentoIALayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useModuleTheme();
  const tc = getThemeClasses(theme);

  return (
    <div className={`min-h-screen ${tc.bgPage} flex`}>
      {/* Header com Toggle de Tema */}
      <div className={`lg:ml-64 fixed top-0 right-0 left-0 lg:left-64 ${tc.bgCard} ${tc.border} border-b z-40 px-4 py-3`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`lg:hidden p-2 ${tc.bgCard} ${tc.textPrimary} rounded-lg ${tc.border} border`}
          >
            <Menu size={20} />
          </button>
          
          <div className="lg:hidden"></div>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-2 ${tc.bgCard} ${tc.border} border ${tc.textPrimary} rounded-lg ${tc.bgHover} transition-colors`}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} />
                <span className="hidden sm:inline text-sm">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span className="hidden sm:inline text-sm">Modo Escuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} theme={theme} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-16">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
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
