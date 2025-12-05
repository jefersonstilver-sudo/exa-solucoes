/**
 * Hook: useModuleTheme
 * Wrapper para usar o sistema de tema global
 * Mantém compatibilidade com o código existente
 */

import { useTheme } from '@/components/ui/theme-provider';

type ModuleTheme = 'dark' | 'light';

export const useModuleTheme = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { 
    theme: theme as ModuleTheme, 
    toggleTheme, 
    setTheme: (t: ModuleTheme) => setTheme(t) 
  };
};

/**
 * Retorna a classe CSS para aplicar no container raiz
 */
export const getThemeClass = (theme: ModuleTheme): string => {
  return theme === 'dark' ? 'dark' : '';
};
