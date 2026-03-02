/**
 * AgendaWeekView - Grid 7 colunas com slots de hora
 * Mobile: scroll horizontal snap-x
 */

import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';

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

const getPriorityEmoji = (prioridade: string) => {
  switch (prioridade) {
    case 'emergencia': return '🔴';
    case 'alta': return '🟠';
    case 'media': return '🟡';
    case 'baixa': return '🟢';
    default: return '⚪';
  }
};

const AgendaWeekView: React.FC<AgendaWeekViewProps> = ({ tasks, currentDate, onTaskClick, fullscreen }) => {
  const isMobile = useIsMobile();
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

  const cellHeight = isMobile ? 40 : fullscreen ? 52 : 44;
  const minTableWidth = isMobile ? 500 : 700;
  const hourColWidth = isMobile ? 44 : 60;

  return (
    <div className="space-y-2">
      {!fullscreen && (
        <div className="text-center mb-2">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground">
            {format(weekDays[0], "d MMM", { locale: ptBR })} — {format(weekDays[6], "d MMM yyyy", { locale: ptBR })}
          </h3>
        </div>
      )}

      <div
        className="bg-card rounded-xl border border-border overflow-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full border-collapse" style={{ minWidth: minTableWidth, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: hourColWidth }} />
            {weekDays.map((_, i) => <col key={i} />)}
          </colgroup>

          {/* Header */}
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              <th className="border-b border-r border-border p-1 md:p-2 text-[10px] text-muted-foreground font-normal" />
              {weekDays.map(day => {
                const today = isToday(day);
                return (
                  <th
                    key={day.toISOString()}
                    className={`border-b border-r border-border last:border-r-0 p-1 md:p-2 text-center font-normal ${today ? 'bg-primary/10' : ''}`}
                  >
                    <div className={`text-[9px] md:text-[10px] uppercase tracking-wider ${today ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {isMobile
                        ? format(day, 'EEEEE', { locale: ptBR })
                        : format(day, 'EEEE', { locale: ptBR })
                      }
                    </div>
                    <div className={`text-xs md:text-sm font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* All day row */}
            {hasAllDay && (
              <tr className="bg-muted/30">
                <td className="border-b border-r border-border p-1 text-[9px] md:text-[10px] text-muted-foreground text-center align-middle">
                  Dia
                </td>
                {weekDays.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayAllDay = tasksByDayAndHour.allDayMap[key] || [];
                  return (
                    <td key={key} className="border-b border-r border-border last:border-r-0 p-0.5 md:p-1 align-top" style={{ minHeight: 32 }}>
                      <div className="space-y-0.5">
                        {dayAllDay.slice(0, isMobile ? 1 : 2).map(task => (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick?.(task)}
                            className={`text-[8px] md:text-[9px] px-1 py-0.5 rounded truncate cursor-pointer border ${getPriorityColor(task.prioridade)}`}
                            title={task.titulo}
                          >
                            {task.titulo}
                          </div>
                        ))}
                        {dayAllDay.length > (isMobile ? 1 : 2) && (
                          <div className="text-[8px] md:text-[9px] text-muted-foreground pl-1">+{dayAllDay.length - (isMobile ? 1 : 2)}</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Hour rows */}
            {HOURS.map(hour => {
              const isCurrentHourRow = currentHour === hour;
              return (
                <tr key={hour}>
                  <td
                    className="border-b border-r border-border text-[9px] md:text-[10px] text-muted-foreground text-right pr-1 md:pr-2 align-top pt-1 last:border-b-0"
                    style={{ height: cellHeight }}
                  >
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </td>
                  {weekDays.map(day => {
                    const key = format(day, 'yyyy-MM-dd');
                    const hourTasks = tasksByDayAndHour.map[key]?.[hour] || [];
                    const isTodayCol = key === todayStr;
                    return (
                      <td
                        key={`${key}-${hour}`}
                        className={`border-b border-r border-border last:border-r-0 last:border-b-0 p-0.5 align-top relative ${isTodayCol ? 'bg-primary/[0.03]' : ''}`}
                        style={{ height: cellHeight }}
                      >
                        {/* Now indicator */}
                        {isCurrentHourRow && isTodayCol && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                            style={{ top: `${(currentMinute / 60) * 100}%` }}
                          >
                            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          {hourTasks.map(task => (
                            <div
                              key={task.id}
                              onClick={() => onTaskClick?.(task)}
                              className={`text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 md:py-1 rounded cursor-pointer border truncate hover:opacity-80 transition-opacity ${getPriorityColor(task.prioridade)}`}
                              title={task.titulo}
                            >
                              {isMobile ? (
                                `${getPriorityEmoji(task.prioridade)} ${task.titulo}`
                              ) : (
                                <>
                                  <span className="font-medium">{task.horario_inicio?.substring(0,5) || ''}</span>{' '}
                                  {task.titulo}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgendaWeekView;
