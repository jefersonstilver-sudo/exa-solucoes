
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative group p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      {/* Fundo 3D interno */}
      <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 shadow-inner" />
      
      {/* Ícone container */}
      <div className="relative z-10 w-6 h-6 flex items-center justify-center">
        {/* Transição suave entre ícones */}
        <Sun 
          className={`absolute w-4 h-4 text-amber-500 transition-all duration-500 transform ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon 
          className={`absolute w-4 h-4 text-blue-400 transition-all duration-500 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>

      {/* Brilho no hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indexa-mint/20 to-indexa-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Indicador de estado */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
        isDark ? 'bg-blue-500 shadow-blue-500/50' : 'bg-amber-500 shadow-amber-500/50'
      } shadow-lg`} />
    </button>
  );
};

export default ThemeToggle;
