import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

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
          text: 'Conectado',
          lampColor: 'text-green-500',
          glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.8),0_0_40px_rgba(34,197,94,0.4)]',
          bgGradient: 'from-green-400/20 to-green-600/20',
          animation: 'animate-pulse',
          bulbGlow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]',
        };
      case 'disconnected':
        return {
          text: 'Desconectado',
          lampColor: 'text-red-500',
          glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.8),0_0_40px_rgba(239,68,68,0.4)]',
          bgGradient: 'from-red-400/20 to-red-600/20',
          animation: 'animate-[ping_1s_ease-in-out_infinite]',
          bulbGlow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]',
        };
      default:
        return {
          text: 'Verificando...',
          lampColor: 'text-yellow-500',
          glowColor: 'shadow-[0_0_12px_rgba(234,179,8,0.6)]',
          bgGradient: 'from-yellow-400/20 to-yellow-600/20',
          animation: '',
          bulbGlow: 'drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 cursor-help group">
            {/* Lampadinha 3D Premium */}
            <div className="relative">
              {/* Glow effect base */}
              <div 
                className={cn(
                  'absolute inset-0 rounded-full blur-xl transition-all duration-300',
                  config.glowColor,
                  config.animation
                )}
              />
              
              {/* Lamp container */}
              <div className={cn(
                'relative w-8 h-8 rounded-full flex items-center justify-center',
                'bg-gradient-to-br backdrop-blur-sm',
                config.bgGradient,
                'border border-white/20',
                'transition-transform duration-300 group-hover:scale-110'
              )}>
                <Lightbulb 
                  className={cn(
                    'w-5 h-5 transition-all duration-300',
                    config.lampColor,
                    config.bulbGlow,
                    config.animation
                  )}
                  fill="currentColor"
                />
              </div>
            </div>
            
            <span className="text-xs font-medium text-foreground">
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
