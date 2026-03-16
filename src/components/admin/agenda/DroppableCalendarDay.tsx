import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import TaskCard, { type AgendaTask } from './TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';

interface DroppableCalendarDayProps {
  day: Date;
  tasks: AgendaTask[];
  isCurrentMonth: boolean;
  onTaskClick?: (task: AgendaTask) => void;
  onDaySelect?: (date: Date) => void;
  fullscreen?: boolean;
}

const DEFAULT_DOT_COLORS = ['#C7141A', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

const DroppableCalendarDay = ({ day, tasks, isCurrentMonth, onTaskClick, onDaySelect, fullscreen }: DroppableCalendarDayProps) => {
  const isMobile = useIsMobile();
  const { eventTypes } = useEventTypes();
  const dateKey = format(day, 'yyyy-MM-dd');
  const isTodayDate = isToday(day);
  
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  const getTaskColor = (task: AgendaTask): string => {
    if (task.tipo_evento && eventTypes) {
      const et = eventTypes.find(e => e.value === task.tipo_evento);
      if (et?.color) return et.color;
    }
    const idx = tasks.indexOf(task) % DEFAULT_DOT_COLORS.length;
    return DEFAULT_DOT_COLORS[idx];
  };

  const handleCellClick = () => {
    if (isMobile && onDaySelect) {
      onDaySelect(day);
    }
  };

  // Mobile: Google Calendar-style dots
  if (isMobile) {
    const maxDots = 3;
    const dotTasks = tasks.slice(0, maxDots);
    const remaining = tasks.length - maxDots;

    return (
      <div
        ref={setNodeRef}
        onClick={handleCellClick}
        className={`
          min-h-[48px] rounded-md p-1 flex flex-col items-center justify-start transition-all cursor-pointer
          ${isCurrentMonth ? 'bg-muted/20' : 'bg-transparent'}
          ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
          ${isOver ? 'bg-primary/10 ring-2 ring-primary scale-[1.02]' : ''}
        `}
      >
        <span className={`
          text-xs font-medium leading-none mb-1
          ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}
          ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/30'}
        `}>
          {format(day, 'd')}
        </span>
        
        {tasks.length > 0 && (
          <div className="flex items-center gap-[3px] flex-wrap justify-center mt-0.5">
            {dotTasks.map((task, i) => (
              <span
                key={task.id}
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ backgroundColor: getTaskColor(task) }}
              />
            ))}
          </div>
        )}
        {remaining > 0 && (
          <span className="text-[8px] text-muted-foreground mt-0.5 leading-none">+{remaining}</span>
        )}
      </div>
    );
  }

  // Desktop: original behavior with TaskCards
  const maxTasks = fullscreen ? 5 : 3;
  const cellHeight = fullscreen ? 'min-h-[140px]' : 'min-h-[120px]';

  return (
    <div 
      ref={setNodeRef}
      className={`
        ${cellHeight} rounded-lg p-2 flex flex-col transition-all border
        ${isCurrentMonth ? 'bg-muted/30 border-border/50' : 'bg-background border-transparent'}
        ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
        ${isOver ? 'bg-primary/10 border-primary/30 ring-2 ring-primary scale-[1.02]' : ''}
        ${fullscreen ? 'backdrop-blur-sm' : ''}
      `}
    >
      <div className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${isTodayDate ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
        {format(day, 'd')}
        {isTodayDate && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {tasks.slice(0, maxTasks).map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            compact 
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length > maxTasks && (
          <div className="text-[10px] text-muted-foreground pl-1">+{tasks.length - maxTasks} mais</div>
        )}
      </div>
    </div>
  );
};

export default DroppableCalendarDay;
