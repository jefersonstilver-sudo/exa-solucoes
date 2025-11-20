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
 * Classes CSS dinâmicas baseadas no tema
 */
export const getThemeClasses = (theme: ModuleTheme) => {
  if (theme === 'dark') {
    return {
      // Backgrounds (Dark mode com toques de vermelho)
      bgPage: 'bg-gradient-to-br from-[#1A0A0A] via-[#0F0505] to-[#0A0A0A]',
      bgCard: 'bg-gradient-to-br from-[#2A1515] to-[#1A1A1A]',
      bgInput: 'bg-[#1A0808]',
      bgHover: 'hover:bg-[#9C1E1E]/30',
      bgAccent: 'bg-[#9C1E1E]',
      bgAccentHover: 'hover:bg-[#B82525]',
      
      // Borders
      border: 'border-[#3A1A1A]',
      borderAccent: 'border-[#9C1E1E]',
      
      // Text
      textPrimary: 'text-white',
      textSecondary: 'text-[#D4A5A5]',
      textTertiary: 'text-[#A08585]',
      textMuted: 'text-white/50',
      
      // Placeholder
      placeholder: 'placeholder:text-[#8B6666]',
      
      // Focus
      focusRing: 'focus:ring-[#9C1E1E]',
      focusBorder: 'focus:border-[#9C1E1E]',
    };
  } else {
    return {
      // Backgrounds (Light mode)
      bgPage: 'bg-white',
      bgCard: 'bg-white',
      bgInput: 'bg-white',
      bgHover: 'hover:bg-gray-50',
      bgAccent: 'bg-[#9C1E1E]',
      bgAccentHover: 'hover:bg-[#9C1E1E]/90',
      
      // Borders
      border: 'border-gray-200',
      borderAccent: 'border-[#9C1E1E]',
      
      // Text
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      textMuted: 'text-gray-400',
      
      // Placeholder
      placeholder: 'placeholder:text-gray-400',
      
      // Focus
      focusRing: 'focus:ring-[#9C1E1E]',
      focusBorder: 'focus:border-[#9C1E1E]',
    };
  }
};
