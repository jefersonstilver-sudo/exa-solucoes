/**
 * AgendaDayView - Timeline vertical com slots de hora (08:00-22:00)
 */

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import TaskCard from '@/components/admin/agenda/TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface AgendaDayViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

const getPriorityBorderColor = (prioridade: string) => {
  switch (prioridade) {
    case 'emergencia': return 'border-l-red-500';
    case 'alta': return 'border-l-orange-500';
    case 'media': return 'border-l-yellow-500';
    case 'baixa': return 'border-l-green-500';
    default: return 'border-l-gray-300';
  }
};

const AgendaDayView: React.FC<AgendaDayViewProps> = ({ tasks, currentDate, onTaskClick, fullscreen }) => {
  const isMobile = useIsMobile();
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isCurrentDay = format(now, 'yyyy-MM-dd') === dateStr;

  const { scheduledByHour, allDayTasks } = useMemo(() => {
    const dayTasks = tasks.filter(t => t.data_prevista?.split('T')[0] === dateStr);
    
    const scheduled: Record<number, AgendaTask[]> = {};
    const allDay: AgendaTask[] = [];

    dayTasks.forEach(task => {
      const timeStr = task.horario_inicio || task.horario_limite;
      if (timeStr) {
        const hour = parseInt(timeStr.substring(0, 2), 10);
        const clampedHour = Math.max(8, Math.min(22, hour));
        if (!scheduled[clampedHour]) scheduled[clampedHour] = [];
        scheduled[clampedHour].push(task);
      } else {
        allDay.push(task);
      }
    });

    return { scheduledByHour: scheduled, allDayTasks: allDay };
  }, [tasks, dateStr]);

  const hourLabelWidth = isMobile ? 'w-12' : 'w-16 md:w-20';
  const slotHeight = isMobile ? 'min-h-[50px]' : fullscreen ? 'min-h-[80px]' : 'min-h-[60px]';

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      {!fullscreen && (
        <div className="text-center">
          <h3 className="text-base md:text-lg font-semibold text-foreground capitalize">
            {format(currentDate, isMobile ? "EEE, d MMM" : "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
      )}

      {/* All day tasks */}
      {allDayTasks.length > 0 && (
        <div className="bg-muted/50 rounded-xl border border-border p-2 md:p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Dia inteiro / Sem horário</span>
            <span className="text-[10px] md:text-xs text-muted-foreground">({allDayTasks.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
            {allDayTasks.map(task => (
              <div key={task.id} className={`border-l-4 ${getPriorityBorderColor(task.prioridade)} rounded-r-lg`}>
                <TaskCard task={task} compact onClick={() => onTaskClick?.(task)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        {HOURS.map(hour => {
          const hourTasks = scheduledByHour[hour] || [];
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          const isCurrentHour = currentHour === hour && isCurrentDay;

          return (
            <div
              key={hour}
              className={`relative flex border-b border-border last:border-b-0 ${slotHeight} ${isCurrentHour ? 'bg-primary/5' : ''}`}
            >
              {/* Now indicator line */}
              {isCurrentHour && isCurrentDay && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{ top: `${(currentMinute / 60) * 100}%` }}
                >
                  <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
              )}

              {/* Hour label */}
              <div className={`${hourLabelWidth} flex-shrink-0 py-2 px-2 md:px-3 text-[10px] md:text-xs font-medium border-r border-border ${isCurrentHour ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {hourStr}
              </div>

              {/* Tasks */}
              <div className="flex-1 p-1 md:p-1.5 space-y-1">
                {hourTasks.map(task => (
                  <div key={task.id} className={`border-l-3 ${getPriorityBorderColor(task.prioridade)} rounded-r-lg hover-scale`}>
                    <TaskCard task={task} compact onClick={() => onTaskClick?.(task)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaDayView;
