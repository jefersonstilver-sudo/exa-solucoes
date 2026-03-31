/**
 * AgendaDayView - Timeline vertical com posicionamento absoluto (estilo Google Calendar)
 * Tarefas se estendem visualmente pela duração real (horario_inicio → horario_limite)
 */

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';

interface AgendaDayViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 14 hours
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR); // 08:00 to 22:00

const getPriorityBorderColor = (prioridade: string) => {
  switch (prioridade) {
    case 'emergencia': return 'border-l-red-500';
    case 'alta': return 'border-l-orange-500';
    case 'media': return 'border-l-yellow-500';
    case 'baixa': return 'border-l-green-500';
    default: return 'border-l-gray-300';
  }
};

/** Parse "HH:MM" or "HH:MM:SS" to minutes since midnight */
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

const AgendaDayView: React.FC<AgendaDayViewProps> = ({ tasks, currentDate, onTaskClick, fullscreen }) => {
  const isMobile = useIsMobile();
  const { getEventTypeConfig } = useEventTypes();
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isCurrentDay = format(now, 'yyyy-MM-dd') === dateStr;

  const HOUR_HEIGHT = isMobile ? 60 : fullscreen ? 80 : 70; // px per hour
  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;
  const hourLabelWidth = isMobile ? 48 : fullscreen ? 80 : 64;

  const { positionedTasks, allDayTasks } = useMemo(() => {
    const dayTasks = tasks.filter(t => t.data_prevista?.split('T')[0] === dateStr);

    const allDay: AgendaTask[] = [];
    const timed: { task: AgendaTask; startMin: number; endMin: number }[] = [];

    const timelineStart = START_HOUR * 60;
    const timelineEnd = END_HOUR * 60;

    dayTasks.forEach(task => {
      const startStr = task.horario_inicio || task.horario_limite;
      if (!startStr) {
        allDay.push(task);
        return;
      }

      let startMin = timeToMinutes(startStr);
      let endMin: number;

      if (task.horario_inicio && task.horario_limite) {
        endMin = timeToMinutes(task.horario_limite);
        if (endMin <= startMin) endMin = startMin + 60; // fallback 1h
      } else {
        endMin = startMin + 60; // default 1 hour
      }

      // Clamp to timeline
      startMin = Math.max(timelineStart, Math.min(timelineEnd, startMin));
      endMin = Math.max(startMin + 15, Math.min(timelineEnd, endMin)); // min 15min visual

      timed.push({ task, startMin, endMin });
    });

    // Sort by start, then longer events first
    timed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    // Overlap columns (greedy)
    const columns: { endMin: number }[] = [];
    const positioned: PositionedTask[] = [];

    // Group overlapping tasks
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

    return { positionedTasks: positioned, allDayTasks: allDay };
  }, [tasks, dateStr]);

  // Now indicator position
  const nowTopPercent = isCurrentDay
    ? ((currentHour * 60 + currentMinute - START_HOUR * 60) / (TOTAL_HOURS * 60)) * 100
    : -1;

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
            {allDayTasks.map(task => {
              const config = getEventTypeConfig(task.tipo_evento || 'tarefa');
              return (
                <div
                  key={task.id}
                  className={`border-l-4 ${getPriorityBorderColor(task.prioridade)} rounded-r-lg px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity ${config.color}`}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-center gap-1 text-xs">
                    <span>{config.icon}</span>
                    <span className="font-medium truncate">{task.titulo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex" style={{ minHeight: totalHeight }}>
          {/* Hour labels column */}
          <div className="flex-shrink-0 border-r border-border" style={{ width: hourLabelWidth }}>
            {HOURS.map(hour => (
              <div
                key={hour}
                className={`text-[10px] md:text-xs font-medium px-2 md:px-3 ${
                  currentHour === hour && isCurrentDay ? 'text-primary font-bold' : 'text-muted-foreground'
                }`}
                style={{ height: HOUR_HEIGHT, paddingTop: 4 }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Timeline body with absolute tasks */}
          <div className="flex-1 relative" style={{ height: totalHeight }}>
            {/* Hour grid lines */}
            {HOURS.map((hour, i) => (
              <div
                key={hour}
                className={`absolute left-0 right-0 border-b border-border ${
                  currentHour === hour && isCurrentDay ? 'bg-primary/5' : ''
                }`}
                style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour lines (subtle) */}
            {HOURS.slice(0, -1).map((hour, i) => (
              <div
                key={`half-${hour}`}
                className="absolute left-0 right-0 border-b border-border/30"
                style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Now indicator */}
            {isCurrentDay && nowTopPercent >= 0 && nowTopPercent <= 100 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ top: `${nowTopPercent}%` }}
              >
                <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
            )}

            {/* Positioned task blocks */}
            {positionedTasks.map(({ task, topPercent, heightPercent, column, totalColumns }) => {
              const config = getEventTypeConfig(task.tipo_evento || 'tarefa');
              const widthPercent = 100 / totalColumns;
              const leftPercent = column * widthPercent;
              const minHeightPx = isMobile ? 24 : 28;

              const timeLabel = [
                task.horario_inicio?.substring(0, 5),
                task.horario_limite ? `– ${task.horario_limite.substring(0, 5)}` : null
              ].filter(Boolean).join(' ');

              // Determine if block is tall enough to show details
              const blockHeightPx = (heightPercent / 100) * totalHeight;
              const showDetails = blockHeightPx > 40;

              return (
                <div
                  key={task.id}
                  className={`absolute rounded-lg border cursor-pointer transition-all hover:opacity-90 hover:shadow-md z-10 overflow-hidden ${config.color}`}
                  style={{
                    top: `${topPercent}%`,
                    height: `${heightPercent}%`,
                    minHeight: minHeightPx,
                    left: `calc(${leftPercent}% + 2px)`,
                    width: `calc(${widthPercent}% - 4px)`,
                  }}
                  onClick={() => onTaskClick?.(task)}
                  title={`${config.label}: ${task.titulo}\n${timeLabel}`}
                >
                  <div className="p-1 md:p-1.5 h-full flex flex-col">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] md:text-xs flex-shrink-0">{config.icon}</span>
                      <span className="text-[10px] md:text-xs font-semibold truncate">{task.titulo}</span>
                    </div>
                    {showDetails && (
                      <>
                        {timeLabel && (
                          <span className="text-[9px] md:text-[10px] opacity-75 mt-0.5">{timeLabel}</span>
                        )}
                        {task.subtipo_reuniao && (
                          <span className="text-[9px] opacity-60 capitalize mt-0.5">{task.subtipo_reuniao}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaDayView;
