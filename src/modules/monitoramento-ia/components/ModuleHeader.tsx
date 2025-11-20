/**
 * Component: ModuleHeader
 * Header corporativo do módulo IA & Monitoramento
 */

import { Sun, Moon } from 'lucide-react';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

interface ModuleHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ModuleHeader = ({ theme, onToggleTheme }: ModuleHeaderProps) => {
  return (
    <div className="sticky top-0 z-40 bg-module-card border-b border-module backdrop-blur-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo EXA */}
          <div className="flex items-center gap-4">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA" 
              className="h-10 lg:h-12 w-auto"
            />
            <h1 className="hidden lg:block text-xl font-bold text-module-primary">
              IA & Monitoramento EXA
            </h1>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-module-input border border-module text-module-primary rounded-lg hover-module-bg transition-module"
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
    </div>
  );
};
