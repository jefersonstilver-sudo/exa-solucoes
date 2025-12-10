import React from 'react';
import { Moon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ScheduledShutdownBadgeProps {
  className?: string;
  compact?: boolean;
}

// Helper to check if we're in scheduled shutdown period (1:00 - 4:00 BRT)
export const isScheduledShutdownPeriod = (): boolean => {
  const brazilTime = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const hour = new Date(brazilTime).getHours();
  return hour >= 1 && hour < 4;
};

export const ScheduledShutdownBadge: React.FC<ScheduledShutdownBadgeProps> = ({ 
  className,
  compact = false 
}) => {
  const isShutdown = isScheduledShutdownPeriod();

  if (!isShutdown) return null;

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className={cn("cursor-pointer transition-all duration-300", className)}>
          <Badge
            className={cn(
              "bg-amber-500/90 hover:bg-amber-500 text-white border-0",
              "shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50",
              "animate-pulse hover:animate-none",
              "flex items-center gap-1.5 px-2 py-1",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            <Moon className={cn("animate-bounce", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className="font-semibold">DESLIGAMENTO PROGRAMADO</span>
            <span className="opacity-90 font-mono">1h-4h</span>
          </Badge>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent 
        className="w-80 bg-white/95 backdrop-blur-sm border border-amber-200 shadow-xl"
        side="bottom"
        align="center"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Moon className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Período de Desligamento</p>
              <p className="text-xs text-gray-500">1:00 às 4:00 (Horário de Brasília)</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">Durante este período:</span>
            </div>
            <ul className="text-[11px] text-amber-800 space-y-1 ml-5">
              <li>• Painéis desligam automaticamente</li>
              <li>• Alertas de offline são <strong>ignorados</strong></li>
              <li>• Modo 100% ativo <strong>não é afetado</strong></li>
              <li>• Quedas são registradas apenas em log</li>
            </ul>
          </div>

          <p className="text-[10px] text-center text-gray-400">
            Os alertas retornam ao normal às 4:00
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
