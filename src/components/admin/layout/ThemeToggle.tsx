import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  if (collapsed) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px]"
        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-amber-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-400" />
        )}
      </button>
    );
  }

  // Two simple touchable icons - Apple style
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 min-h-[40px] min-w-[40px] ${
          !isDark 
            ? 'bg-white/10 text-amber-400' 
            : 'text-white/30 hover:text-white/50 hover:bg-white/5'
        }`}
        title="Modo Claro"
      >
        <Sun className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 min-h-[40px] min-w-[40px] ${
          isDark 
            ? 'bg-white/10 text-amber-300' 
            : 'text-white/30 hover:text-white/50 hover:bg-white/5'
        }`}
        title="Modo Escuro"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ThemeToggle;
