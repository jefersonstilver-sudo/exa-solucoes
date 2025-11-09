import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day?: boolean;
}

interface VideoScheduleTooltipProps {
  scheduleRules?: ScheduleRule[];
  isCurrentlyActive: boolean;
  children: React.ReactNode;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatTime = (time: string) => {
  return time.slice(0, 5); // HH:MM
};

const formatDays = (days: number[]) => {
  if (days.length === 7) return 'Todos os dias';
  if (days.length === 0) return 'Nenhum dia';
  
  return days
    .sort((a, b) => a - b)
    .map(day => DAY_NAMES[day])
    .join(', ');
};

export const VideoScheduleTooltip: React.FC<VideoScheduleTooltipProps> = ({
  scheduleRules,
  isCurrentlyActive,
  children
}) => {
  if (!scheduleRules || scheduleRules.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold text-sm">Agendamento</span>
            </div>
            
            {scheduleRules.map((rule, index) => (
              <div key={index} className="border-l-2 border-primary/30 pl-2 py-1 space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{formatDays(rule.days_of_week)}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>
                    {rule.is_all_day 
                      ? 'O dia todo' 
                      : `${formatTime(rule.start_time)} - ${formatTime(rule.end_time)}`
                    }
                  </span>
                </div>
              </div>
            ))}
            
            <div className="mt-2 pt-2 border-t">
              <Badge 
                variant={isCurrentlyActive ? "default" : "secondary"}
                className={isCurrentlyActive ? "bg-green-500" : ""}
              >
                {isCurrentlyActive ? '🟢 No AR agora' : '⏸️ Fora do horário'}
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
