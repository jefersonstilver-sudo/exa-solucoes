/**
 * Component: ModuleHeader
 * Header corporativo do módulo IA & Monitoramento
 */

import { Sun, Moon, Menu } from 'lucide-react';
import { NotificationSettings } from '@/components/admin/notifications/NotificationSettings';

interface ModuleHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

export const ModuleHeader = ({ theme, onToggleTheme, onToggleSidebar }: ModuleHeaderProps) => {
  return (
    <div className={`sticky top-0 z-20 glass-card backdrop-blur-xl border-b ${
      theme === 'dark' ? 'border-white/10' : 'border-[#9C1E1E]/15'
    }`}>
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onToggleSidebar}
          className={`lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : 'bg-white border border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
          }`}
          title="Abrir Menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notification Settings */}
          <NotificationSettings variant="icon" />
          
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:glow-exa'
                : 'bg-[#9C1E1E] border border-[#9C1E1E] text-white hover:bg-[#B82525] shadow-md hover:shadow-lg'
            }`}
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
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
    </div>
  );
};
