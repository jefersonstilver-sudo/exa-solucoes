/**
 * AgendaWeekView - Grid 7 colunas com slots de hora
 */

import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import TaskCard from '@/components/admin/agenda/TaskCard';

interface AgendaWeekViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

const getPriorityColor = (prioridade: string) => {
  switch (prioridade) {
    case 'emergencia': return 'bg-red-100 border-red-300 text-red-800';
    case 'alta': return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'media': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'baixa': return 'bg-green-100 border-green-300 text-green-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const AgendaWeekView: React.FC<AgendaWeekViewProps> = ({ tasks, currentDate, onTaskClick, fullscreen }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDayAndHour = useMemo(() => {
    const map: Record<string, Record<number, AgendaTask[]>> = {};
    const allDayMap: Record<string, AgendaTask[]> = {};

    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = {};
      allDayMap[key] = [];
    });

    tasks.forEach(task => {
      if (!task.data_prevista) return;
      const dateKey = task.data_prevista.split('T')[0];
      if (!map[dateKey]) return;

      const timeStr = task.horario_inicio || task.horario_limite;
      if (timeStr) {
        const hour = Math.max(8, Math.min(22, parseInt(timeStr.substring(0, 2), 10)));
        if (!map[dateKey][hour]) map[dateKey][hour] = [];
        map[dateKey][hour].push(task);
      } else {
        allDayMap[dateKey].push(task);
      }
    });

    return { map, allDayMap };
  }, [tasks, weekDays]);

  const hasAllDay = Object.values(tasksByDayAndHour.allDayMap).some(arr => arr.length > 0);

  return (
    <div className="space-y-2">
      {!fullscreen && (
        <div className="text-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(weekDays[0], "d MMM", { locale: ptBR })} — {format(weekDays[6], "d MMM yyyy", { locale: ptBR })}
          </h3>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
            <div className="p-2 text-xs text-muted-foreground border-r border-border" />
            {weekDays.map(day => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-r border-border last:border-r-0 ${today ? 'bg-primary/10' : ''}`}
                >
                  <div className={`text-[10px] uppercase ${today ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-sm font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All day row */}
          {hasAllDay && (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
              <div className="p-1 text-[10px] text-muted-foreground border-r border-border flex items-center justify-center">
                Dia
              </div>
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayAllDay = tasksByDayAndHour.allDayMap[key] || [];
                return (
                  <div key={key} className="p-1 border-r border-border last:border-r-0 space-y-0.5 min-h-[32px]">
                    {dayAllDay.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer border ${getPriorityColor(task.prioridade)}`}
                        title={task.titulo}
                      >
                        {task.titulo}
                      </div>
                    ))}
                    {dayAllDay.length > 2 && (
                      <div className="text-[9px] text-muted-foreground pl-1">+{dayAllDay.length - 2}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hour rows */}
          {HOURS.map(hour => {
            const isCurrentHourRow = currentHour === hour;
            return (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0 relative">
              <div className="p-1 text-[10px] text-muted-foreground border-r border-border text-right pr-2 pt-1">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const hourTasks = tasksByDayAndHour.map[key]?.[hour] || [];
                const cellHeight = fullscreen ? 'min-h-[52px]' : 'min-h-[40px]';
                const isTodayCol = key === todayStr;
                return (
                  <div key={`${key}-${hour}`} className={`relative p-0.5 border-r border-border last:border-r-0 ${cellHeight} space-y-0.5 ${isTodayCol ? 'bg-primary/[0.03]' : ''}`}>
                    {/* Now indicator */}
                    {isCurrentHourRow && isTodayCol && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ top: `${(currentMinute / 60) * 100}%` }}
                      >
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                    )}
                    {hourTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`text-[9px] px-1.5 py-1 rounded cursor-pointer border truncate hover-scale ${getPriorityColor(task.prioridade)}`}
                        title={task.titulo}
                      >
                        <span className="font-medium">{task.horario_inicio?.substring(0,5) || ''}</span>{' '}
                        {task.titulo}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgendaWeekView;
