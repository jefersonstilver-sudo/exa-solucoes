/**
 * Component: PageHeader
 * Header padronizado para páginas do módulo IA & Monitoramento
 */

import { ReactNode } from 'react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  lastUpdate?: Date;
}

export const PageHeader = ({ 
  title, 
  description, 
  actions, 
  lastUpdate 
}: PageHeaderProps) => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`${tc.bgCard} rounded-xl ${tc.border} border p-6 lg:p-8 mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${tc.textPrimary} mb-2`}>
            {title}
          </h1>
          {description && (
            <p className={tc.textSecondary}>{description}</p>
          )}
          {lastUpdate && (
            <p className={`text-xs ${tc.textTertiary} mt-1`}>
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
