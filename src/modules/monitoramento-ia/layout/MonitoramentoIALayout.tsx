import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu, Sun, Moon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

export const MonitoramentoIALayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useModuleTheme();
  const tc = getThemeClasses(theme);

  return (
    <div className={`min-h-screen ${tc.bgPage} flex`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} theme={theme} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Module Header com Logo + Toggle */}
        <div className={`sticky top-0 z-40 ${tc.bgCard} ${tc.border} border-b`}>
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            {/* Logo EXA + Título do Módulo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden p-2 ${tc.textPrimary} ${tc.bgHover} rounded-lg`}
              >
                <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#9C1E1E] rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white" size={22} />
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-lg font-bold ${tc.textPrimary}`}>IA & Monitoramento</h1>
                  <p className={`text-xs ${tc.textMuted}`}>EXA Platform</p>
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 ${tc.bgInput} ${tc.border} border ${tc.textPrimary} rounded-lg ${tc.bgHover} transition-colors shadow-sm`}
              title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={18} />
                  <span className="hidden sm:inline text-sm font-medium">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={18} />
                  <span className="hidden sm:inline text-sm font-medium">Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </div>

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
