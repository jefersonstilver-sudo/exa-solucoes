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

/**
 * @deprecated Use CSS Variables classes directly (bg-module-primary, text-module-primary, etc)
 * This function is kept for backward compatibility during migration
 */
export const getThemeClasses = (theme: ModuleTheme) => {
  // Retorna classes CSS vazias - componentes devem usar CSS Variables diretamente
  return {
    bgPage: 'bg-module-primary',
    bgCard: 'bg-module-card',
    bgInput: 'bg-module-input',
    bgHover: 'hover-module-bg',
    bgAccent: 'bg-module-accent',
    bgAccentHover: 'hover-module-accent',
    bgSecondary: 'bg-module-secondary',
    
    border: 'border-module',
    borderAccent: 'border-module-accent',
    
    textPrimary: 'text-module-primary',
    textSecondary: 'text-module-secondary',
    textTertiary: 'text-module-tertiary',
    textMuted: 'text-module-muted',
    
    placeholder: 'placeholder:text-module-tertiary',
    
    focusRing: 'focus:ring-[var(--border-accent)]',
    focusBorder: 'focus:border-module-accent',
  };
};
