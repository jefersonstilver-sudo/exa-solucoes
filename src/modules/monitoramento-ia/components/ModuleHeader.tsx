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
          
          {/* Theme Toggle 3D Glass Switch */}
          <button
            onClick={onToggleTheme}
            className="relative w-16 h-8 backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/10 
              rounded-full border border-white/30 shadow-lg cursor-pointer transition-all hover:scale-105
              hover:shadow-xl hover:border-white/40"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full 
              bg-gradient-to-br shadow-lg
              transition-all duration-300 ease-out flex items-center justify-center ${
                theme === 'dark' 
                  ? 'left-1 from-slate-700 to-slate-800 shadow-slate-900/50' 
                  : 'left-9 from-amber-400 to-orange-500 shadow-orange-600/50'
              }`}
            >
              {theme === 'dark' ? (
                <Moon size={14} className="text-white" />
              ) : (
                <Sun size={14} className="text-white" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
