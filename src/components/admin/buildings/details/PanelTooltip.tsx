
import React, { memo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PanelTooltipProps {
  panel: any;
  children: React.ReactNode;
}

const PanelTooltip: React.FC<PanelTooltipProps> = memo(({ panel, children }) => {
  // Simplified tooltip content to avoid performance issues
  const tooltipContent = (
    <div className="p-2 space-y-1 max-w-xs">
      <div className="font-semibold">{panel.code}</div>
      <div className="text-sm text-gray-600">
        Status: <span className="capitalize">{panel.status || 'offline'}</span>
      </div>
      {panel.resolucao && (
        <div className="text-sm text-gray-600">
          Resolução: {panel.resolucao}
        </div>
      )}
      {panel.polegada && (
        <div className="text-sm text-gray-600">
          Tamanho: {panel.polegada}"
        </div>
      )}
      {panel.sistema_operacional && (
        <div className="text-sm text-gray-600">
          Sistema: {panel.sistema_operacional}
        </div>
      )}
      {panel.localizacao && (
        <div className="text-sm text-gray-600">
          Local: {panel.localizacao}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

PanelTooltip.displayName = 'PanelTooltip';

export default PanelTooltip;
