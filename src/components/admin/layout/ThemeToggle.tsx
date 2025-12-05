import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/ui/theme-provider';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  
  if (collapsed) {
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors"
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-amber-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-400" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-1.5">
        <Sun className={`h-3.5 w-3.5 transition-colors ${theme === 'light' ? 'text-amber-400' : 'text-white/40'}`} />
        <span className={`text-[10px] font-medium transition-colors ${theme === 'light' ? 'text-white' : 'text-white/40'}`}>
          Claro
        </span>
      </div>
      
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-white/20 h-5 w-9"
      />
      
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-medium transition-colors ${theme === 'dark' ? 'text-white' : 'text-white/40'}`}>
          Escuro
        </span>
        <Moon className={`h-3.5 w-3.5 transition-colors ${theme === 'dark' ? 'text-amber-300' : 'text-white/40'}`} />
      </div>
    </div>
  );
}

export default ThemeToggle;
