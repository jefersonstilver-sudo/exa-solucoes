import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday } from 'date-fns';
import TaskCard from './TaskCard';

interface NotionTask {
  id: string;
  nome: string;
  prioridade: string | null;
  status: string | null;
  responsavel: string | null;
  responsavel_avatar: string | null;
  data: string | null;
  finalizado_por: string | null;
  categoria: string | null;
  notion_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DroppableCalendarDayProps {
  day: Date;
  tasks: NotionTask[];
  isCurrentMonth: boolean;
  onTaskClick?: (task: NotionTask) => void;
}

const DroppableCalendarDay = ({ day, tasks, isCurrentMonth, onTaskClick }: DroppableCalendarDayProps) => {
  const dateKey = format(day, 'yyyy-MM-dd');
  const isTodayDate = isToday(day);
  
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        min-h-[120px] rounded-lg p-2 flex flex-col transition-all border
        ${isCurrentMonth ? 'bg-gray-50 border-gray-100' : 'bg-white border-transparent'}
        ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isOver ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 scale-[1.02]' : ''}
      `}
    >
      <div className={`text-xs font-medium mb-1.5 ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
        {format(day, 'd')}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {tasks.slice(0, 3).map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            compact 
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length > 3 && (
          <div className="text-[10px] text-gray-400 pl-1">+{tasks.length - 3} mais</div>
        )}
      </div>
    </div>
  );
};

export default DroppableCalendarDay;
