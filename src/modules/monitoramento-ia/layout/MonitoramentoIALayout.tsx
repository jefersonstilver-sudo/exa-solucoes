import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

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
        {/* Module Header com Logo EXA + Toggle */}
        <div className={`sticky top-0 z-40 ${tc.bgCard} ${tc.border} border-b`}>
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            {/* Logo EXA */}
            <div className="flex items-center gap-3">
              <img 
                src={EXA_LOGO_URL} 
                alt="EXA" 
                className="h-10 w-auto"
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 ${tc.bgInput} ${tc.border} border ${tc.textPrimary} rounded-lg ${tc.bgHover} transition-colors`}
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
