/**
 * Hook: useModuleTheme
 * Gerencia o tema do módulo IA & Monitoramento (Dark/Light)
 * Persiste a escolha no localStorage
 */

import { useState, useEffect } from 'react';

type ModuleTheme = 'dark' | 'light';

const STORAGE_KEY = 'monitoramento-ia-theme';

export const useModuleTheme = () => {
  const [theme, setTheme] = useState<ModuleTheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ModuleTheme) || 'light';
  });

  useEffect(() => {
    // Sincronizar com o sistema global do Tailwind (.dark class)
    localStorage.setItem(STORAGE_KEY, theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
};

/**
 * Retorna a classe CSS para aplicar no container raiz
 */
export const getThemeClass = (theme: ModuleTheme): string => {
  return theme === 'dark' ? 'dark' : '';
};

