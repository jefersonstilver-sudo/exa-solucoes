/**
 * AgendaDayView - Timeline vertical com slots de hora (08:00-22:00)
 */

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import TaskCard from '@/components/admin/agenda/TaskCard';

interface AgendaDayViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
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

const AgendaDayView: React.FC<AgendaDayViewProps> = ({ tasks, currentDate, onTaskClick }) => {
  const dateStr = format(currentDate, 'yyyy-MM-dd');

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground capitalize">
          {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>
      </div>

      {/* All day tasks */}
      {allDayTasks.length > 0 && (
        <div className="bg-muted/50 rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Dia inteiro / Sem horário</span>
            <span className="text-xs text-muted-foreground">({allDayTasks.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {allDayTasks.map(task => (
              <div key={task.id} className={`border-l-4 ${getPriorityBorderColor(task.prioridade)} rounded-r-lg`}>
                <TaskCard task={task} compact onClick={() => onTaskClick?.(task)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {HOURS.map(hour => {
          const hourTasks = scheduledByHour[hour] || [];
          const hourStr = `${hour.toString().padStart(2, '0')}:00`;
          const isCurrentHour = new Date().getHours() === hour && format(new Date(), 'yyyy-MM-dd') === dateStr;

          return (
            <div
              key={hour}
              className={`flex border-b border-border last:border-b-0 min-h-[60px] ${isCurrentHour ? 'bg-primary/5' : ''}`}
            >
              {/* Hour label */}
              <div className={`w-16 md:w-20 flex-shrink-0 py-2 px-3 text-xs font-medium border-r border-border ${isCurrentHour ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {hourStr}
              </div>

              {/* Tasks */}
              <div className="flex-1 p-1.5 space-y-1">
                {hourTasks.map(task => (
                  <div key={task.id} className={`border-l-3 ${getPriorityBorderColor(task.prioridade)} rounded-r-lg`}>
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
