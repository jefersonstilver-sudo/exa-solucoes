/**
 * Component: ModuleHeader
 * Header corporativo do módulo IA & Monitoramento
 */

import { Sun, Moon } from 'lucide-react';

interface ModuleHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ModuleHeader = ({ theme, onToggleTheme }: ModuleHeaderProps) => {
  return (
    <div className="sticky top-0 z-40 bg-module-card border-b border-module backdrop-blur-sm">
      <div className="px-4 lg:px-8 py-4 flex items-center justify-end">
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
  );
};
