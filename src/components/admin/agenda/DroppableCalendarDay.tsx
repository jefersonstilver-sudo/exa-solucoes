import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import TaskCard, { type AgendaTask } from './TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface DroppableCalendarDayProps {
  day: Date;
  tasks: AgendaTask[];
  isCurrentMonth: boolean;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const DroppableCalendarDay = ({ day, tasks, isCurrentMonth, onTaskClick, fullscreen }: DroppableCalendarDayProps) => {
  const isMobile = useIsMobile();
  const dateKey = format(day, 'yyyy-MM-dd');
  const isTodayDate = isToday(day);
  const maxTasks = isMobile ? 2 : fullscreen ? 5 : 3;
  const cellHeight = isMobile ? 'min-h-[72px]' : fullscreen ? 'min-h-[140px]' : 'min-h-[120px]';
  
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        ${cellHeight} rounded-lg p-1 md:p-2 flex flex-col transition-all border
        ${isCurrentMonth ? 'bg-muted/30 border-border/50' : 'bg-background border-transparent'}
        ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
        ${isOver ? 'bg-primary/10 border-primary/30 ring-2 ring-primary scale-[1.02]' : ''}
        ${fullscreen ? 'backdrop-blur-sm' : ''}
      `}
    >
      <div className={`text-[10px] md:text-xs font-medium mb-0.5 md:mb-1.5 flex items-center gap-1 ${isTodayDate ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
        {format(day, 'd')}
        {isTodayDate && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <div className="flex-1 space-y-0.5 md:space-y-1 overflow-hidden">
        {tasks.slice(0, maxTasks).map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            compact 
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length > maxTasks && (
          <div className="text-[9px] md:text-[10px] text-muted-foreground pl-1">+{tasks.length - maxTasks} mais</div>
        )}
      </div>
    </div>
  );
};

export default DroppableCalendarDay;