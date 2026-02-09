import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import TaskCard, { type AgendaTask } from './TaskCard';

interface DraggableTaskCardProps {
  task: AgendaTask;
  showCompleteButton?: boolean;
}

const DraggableTaskCard = ({ task, showCompleteButton = true }: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      <div 
        {...listeners} 
        {...attributes}
        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="pl-2">
        <TaskCard task={task} showCompleteButton={showCompleteButton} />
      </div>
    </div>
  );
};

export default DraggableTaskCard;