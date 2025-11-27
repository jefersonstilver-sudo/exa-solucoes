import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'pending';
  lastCheck?: string;
  latency?: number;
  phone?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  lastCheck,
  latency,
  phone,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          glow: 'shadow-[0_0_12px_rgba(34,197,94,0.6)]',
          animation: 'animate-pulse',
          text: 'Conectado',
          icon: '●',
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.6)]',
          animation: 'animate-ping',
          text: 'Desconectado',
          icon: '●',
        };
      default:
        return {
          color: 'bg-yellow-500',
          glow: 'shadow-[0_0_8px_rgba(234,179,8,0.4)]',
          animation: '',
          text: 'Verificando...',
          icon: '●',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div className="relative w-3 h-3">
              <div
                className={cn(
                  'absolute inset-0 rounded-full',
                  config.color,
                  config.glow,
                  config.animation
                )}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {config.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover border-border">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-foreground">{config.text}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-medium text-foreground">{phone}</span>
              </div>
            )}
            {latency && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Latência:</span>
                <span className="font-medium text-foreground">{latency}ms</span>
              </div>
            )}
            {lastCheck && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última verificação:</span>
                <span className="font-medium text-foreground">
                  {new Date(lastCheck).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
