import React, { useState } from 'react';
import { CheckCircle2, Trophy, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFullUptimeMode, formatUptimeDuration } from '@/hooks/useFullUptimeMode';
import { FullUptimeModal } from './FullUptimeModal';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface FullUptimeBadgeProps {
  className?: string;
  compact?: boolean;
}

export const FullUptimeBadge: React.FC<FullUptimeBadgeProps> = ({ 
  className,
  compact = false 
}) => {
  const { isFullUptime, currentDuration, record, loading, isPausedDuringShutdown, allDevicesReallyOnline } = useFullUptimeMode();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) return null;
  
  // CRITICAL: Only show green badge when ALL devices are REALLY online
  // If we're in shutdown period with offline devices, DON'T show the green badge
  if (!isFullUptime || !allDevicesReallyOnline) return null;

  return (
    <>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div
            onClick={() => setModalOpen(true)}
            className={cn(
              "cursor-pointer transition-all duration-300",
              className
            )}
          >
            <Badge
              className={cn(
                "bg-emerald-500/90 hover:bg-emerald-500 text-white border-0",
                "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50",
                "animate-pulse hover:animate-none",
                "flex items-center gap-1.5 px-2 py-1",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              <CheckCircle2 className={cn("animate-bounce", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="font-semibold">100% ATIVO</span>
              <span className="opacity-90 font-mono">
                {formatUptimeDuration(currentDuration)}
              </span>
            </Badge>
          </div>
        </HoverCardTrigger>
        
        <HoverCardContent 
          className="w-72 bg-white/95 backdrop-blur-sm border border-emerald-200 shadow-xl"
          side="bottom"
          align="center"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Modo 100% Ativo</p>
                <p className="text-xs text-gray-500">Todos os painéis online</p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Tempo atual:</span>
                </div>
                <span className="font-mono font-semibold text-sm text-emerald-700">
                  {formatUptimeDuration(currentDuration)}
                </span>
              </div>
              
              {record && (
                <div className="flex items-center justify-between border-t border-emerald-200 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    <span>Recorde:</span>
                  </div>
                  <span className="font-mono font-semibold text-sm text-amber-600">
                    {formatUptimeDuration(record.duration_seconds)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-center text-gray-400">
              Clique para ver histórico completo
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>

      <FullUptimeModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
