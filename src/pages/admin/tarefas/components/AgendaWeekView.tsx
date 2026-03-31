/**
 * AgendaWeekView - Grid 7 colunas com posicionamento absoluto (estilo Google Calendar)
 * Tarefas se estendem visualmente pela duração real
 */

import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';

interface AgendaWeekViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR);

const timeToMinutes = (timeStr: string): number => {
  const h = parseInt(timeStr.substring(0, 2), 10);
  const m = parseInt(timeStr.substring(3, 5), 10) || 0;
  return h * 60 + m;
};

interface PositionedTask {
  task: AgendaTask;
  topPercent: number;
  heightPercent: number;
  column: number;
  totalColumns: number;
}

const AgendaWeekView: React.FC<AgendaWeekViewProps> = ({ tasks, currentDate, onTaskClick, fullscreen }) => {
  const isMobile = useIsMobile();
  const { getEventTypeConfig } = useEventTypes();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const HOUR_HEIGHT = isMobile ? 40 : fullscreen ? 52 : 44;
  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;
  const hourColWidth = isMobile ? 44 : 60;

  const { positionedByDay, allDayByDay } = useMemo(() => {
    const posMap: Record<string, PositionedTask[]> = {};
    const allDayMap: Record<string, AgendaTask[]> = {};
    const timelineStart = START_HOUR * 60;
    const timelineEnd = END_HOUR * 60;

    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      allDayMap[key] = [];
      const timed: { task: AgendaTask; startMin: number; endMin: number }[] = [];

      tasks.forEach(task => {
        if (!task.data_prevista) return;
        if (task.data_prevista.split('T')[0] !== key) return;

        const startStr = task.horario_inicio || task.horario_limite;
        if (!startStr) {
          allDayMap[key].push(task);
          return;
        }

        let startMin = timeToMinutes(startStr);
        let endMin: number;

        if (task.horario_inicio && task.horario_limite) {
          endMin = timeToMinutes(task.horario_limite);
          if (endMin <= startMin) endMin = startMin + 60;
        } else {
          endMin = startMin + 60;
        }

        startMin = Math.max(timelineStart, Math.min(timelineEnd, startMin));
        endMin = Math.max(startMin + 15, Math.min(timelineEnd, endMin));

        timed.push({ task, startMin, endMin });
      });

      timed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

      // Overlap grouping
      const groups: typeof timed[] = [];
      let currentGroup: typeof timed = [];

      timed.forEach(item => {
        if (currentGroup.length === 0) {
          currentGroup.push(item);
        } else {
          const groupEnd = Math.max(...currentGroup.map(g => g.endMin));
          if (item.startMin < groupEnd) {
            currentGroup.push(item);
          } else {
            groups.push(currentGroup);
            currentGroup = [item];
          }
        }
      });
      if (currentGroup.length > 0) groups.push(currentGroup);

      const positioned: PositionedTask[] = [];
      groups.forEach(group => {
        const cols: { endMin: number }[] = [];
        const assignments = group.map(item => {
          let col = cols.findIndex(c => c.endMin <= item.startMin);
          if (col === -1) {
            col = cols.length;
            cols.push({ endMin: item.endMin });
          } else {
            cols[col].endMin = item.endMin;
          }
          return { ...item, column: col };
        });

        const totalCols = cols.length;
        assignments.forEach(({ task, startMin, endMin, column }) => {
          const topPercent = ((startMin - timelineStart) / (timelineEnd - timelineStart)) * 100;
          const heightPercent = ((endMin - startMin) / (timelineEnd - timelineStart)) * 100;
          positioned.push({ task, topPercent, heightPercent, column, totalColumns: totalCols });
        });
      });

      posMap[key] = positioned;
    });

    return { positionedByDay: posMap, allDayByDay: allDayMap };
  }, [tasks, weekDays]);

  const hasAllDay = Object.values(allDayByDay).some(arr => arr.length > 0);

  const nowTopPercent = todayStr
    ? ((currentHour * 60 + currentMinute - START_HOUR * 60) / (TOTAL_HOURS * 60)) * 100
    : -1;

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
        <div style={{ minWidth: isMobile ? 500 : 700 }}>
          {/* Header row */}
          <div className="flex sticky top-0 bg-card z-20 border-b border-border">
            <div className="flex-shrink-0 border-r border-border" style={{ width: hourColWidth }} />
            {weekDays.map(day => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 text-center py-1.5 md:py-2 border-r border-border last:border-r-0 ${today ? 'bg-primary/10' : ''}`}
                >
                  <div className={`text-[9px] md:text-[10px] uppercase tracking-wider ${today ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {isMobile ? format(day, 'EEEEE', { locale: ptBR }) : format(day, 'EEEE', { locale: ptBR })}
                  </div>
                  <div className={`text-xs md:text-sm font-semibold ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All day row */}
          {hasAllDay && (
            <div className="flex border-b border-border bg-muted/30">
              <div className="flex-shrink-0 border-r border-border text-[9px] md:text-[10px] text-muted-foreground text-center py-1" style={{ width: hourColWidth }}>
                Dia
              </div>
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const dayAllDay = allDayByDay[key] || [];
                return (
                  <div key={key} className="flex-1 border-r border-border last:border-r-0 p-0.5 md:p-1" style={{ minHeight: 28 }}>
                    {dayAllDay.slice(0, isMobile ? 1 : 2).map(task => {
                      const config = getEventTypeConfig(task.tipo_evento || 'tarefa');
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick?.(task)}
                          className={`text-[8px] md:text-[9px] px-1 py-0.5 rounded truncate cursor-pointer border mb-0.5 ${config.color}`}
                          title={task.titulo}
                        >
                          {task.titulo}
                        </div>
                      );
                    })}
                    {dayAllDay.length > (isMobile ? 1 : 2) && (
                      <div className="text-[8px] text-muted-foreground pl-1">+{dayAllDay.length - (isMobile ? 1 : 2)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline body */}
          <div className="flex" style={{ height: totalHeight }}>
            {/* Hour labels */}
            <div className="flex-shrink-0 border-r border-border" style={{ width: hourColWidth }}>
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="text-[9px] md:text-[10px] text-muted-foreground text-right pr-1 md:pr-2 pt-0.5"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const isTodayCol = key === todayStr;
              const dayPositioned = positionedByDay[key] || [];

              return (
                <div
                  key={key}
                  className={`flex-1 relative border-r border-border last:border-r-0 ${isTodayCol ? 'bg-primary/[0.03]' : ''}`}
                  style={{ height: totalHeight }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((hour, i) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-b border-border/50"
                      style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Now indicator */}
                  {isTodayCol && nowTopPercent >= 0 && nowTopPercent <= 100 && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                      style={{ top: `${nowTopPercent}%` }}
                    >
                      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                    </div>
                  )}

                  {/* Tasks */}
                  {dayPositioned.map(({ task, topPercent, heightPercent, column, totalColumns }) => {
                    const config = getEventTypeConfig(task.tipo_evento || 'tarefa');
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = column * widthPercent;

                    return (
                      <div
                        key={task.id}
                        className={`absolute rounded cursor-pointer transition-opacity hover:opacity-80 z-10 overflow-hidden border text-[8px] md:text-[9px] ${config.color}`}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          minHeight: 18,
                          left: `calc(${leftPercent}% + 1px)`,
                          width: `calc(${widthPercent}% - 2px)`,
                        }}
                        onClick={() => onTaskClick?.(task)}
                        title={task.titulo}
                      >
                        <div className="px-0.5 md:px-1 py-0.5 truncate">
                          <span className="font-medium">{task.horario_inicio?.substring(0, 5) || ''} </span>
                          {task.titulo}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaWeekView;
