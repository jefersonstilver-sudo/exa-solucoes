import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import TaskCard, { type AgendaTask } from './TaskCard';

interface DroppableCalendarDayProps {
  day: Date;
  tasks: AgendaTask[];
  isCurrentMonth: boolean;
  onTaskClick?: (task: AgendaTask) => void;
  fullscreen?: boolean;
}

const DroppableCalendarDay = ({ day, tasks, isCurrentMonth, onTaskClick, fullscreen }: DroppableCalendarDayProps) => {
  const dateKey = format(day, 'yyyy-MM-dd');
  const isTodayDate = isToday(day);
  const maxTasks = fullscreen ? 5 : 3;
  const cellHeight = fullscreen ? 'min-h-[140px]' : 'min-h-[120px]';
  
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        ${cellHeight} rounded-lg p-2 flex flex-col transition-all border
        ${isCurrentMonth ? 'bg-gray-50 border-gray-100' : 'bg-white border-transparent'}
        ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isOver ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 scale-[1.02]' : ''}
        ${fullscreen ? 'backdrop-blur-sm' : ''}
      `}
    >
      <div className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
        {format(day, 'd')}
        {isTodayDate && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
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
          <div className="text-[10px] text-gray-400 pl-1">+{tasks.length - maxTasks} mais</div>
        )}
      </div>
    </div>
  );
};

export default DroppableCalendarDay;