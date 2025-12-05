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
        className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 transition-colors"
        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-amber-300" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-400" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <Sun className={`h-3 w-3 transition-colors ${!isDark ? 'text-amber-400' : 'text-white/30'}`} />
      
      {/* iOS-style toggle */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`
          relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out
          ${isDark ? 'bg-red-600' : 'bg-white/25'}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm
            transition-transform duration-200 ease-in-out
            ${isDark ? 'translate-x-4' : 'translate-x-0'}
          `}
        />
      </button>
      
      <Moon className={`h-3 w-3 transition-colors ${isDark ? 'text-amber-300' : 'text-white/30'}`} />
    </div>
  );
}

export default ThemeToggle;
