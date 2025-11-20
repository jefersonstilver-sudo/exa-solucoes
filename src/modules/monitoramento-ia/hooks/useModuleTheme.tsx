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
    return (stored as ModuleTheme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
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
  return theme === 'dark' ? 'theme-dark' : 'theme-light';
};

