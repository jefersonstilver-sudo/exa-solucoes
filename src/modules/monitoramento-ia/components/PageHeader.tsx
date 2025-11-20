/**
 * Component: PageHeader
 * Header padronizado para páginas do módulo IA & Monitoramento
 */

import { ReactNode } from 'react';

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
  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-module-secondary">{description}</p>
          )}
          {lastUpdate && (
            <p className="text-xs text-module-tertiary mt-1">
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
