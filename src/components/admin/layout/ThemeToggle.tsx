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
        className="flex items-center justify-center p-1 rounded-md hover:bg-white/10 transition-colors"
        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-amber-300" />
        ) : (
          <Sun className="h-3 w-3 text-amber-400" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-1">
      <Sun className={`h-2.5 w-2.5 transition-colors ${!isDark ? 'text-amber-400' : 'text-white/30'}`} />
      
      {/* Minimal pill toggle */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`
          relative w-6 h-3 rounded-full transition-colors duration-200
          ${isDark ? 'bg-white/30' : 'bg-white/20'}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full shadow-sm
            transition-transform duration-200
            ${isDark ? 'translate-x-3' : 'translate-x-0'}
          `}
        />
      </button>
      
      <Moon className={`h-2.5 w-2.5 transition-colors ${isDark ? 'text-amber-300' : 'text-white/30'}`} />
    </div>
  );
}

export default ThemeToggle;
