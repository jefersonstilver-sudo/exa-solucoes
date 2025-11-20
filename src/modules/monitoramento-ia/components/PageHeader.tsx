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
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 lg:p-8 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-[#A0A0A0]">{description}</p>
          )}
          {lastUpdate && (
            <p className="text-xs text-[#6B7280] mt-1">
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
