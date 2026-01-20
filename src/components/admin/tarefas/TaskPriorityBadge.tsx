/**
 * TaskPriorityBadge - Badge canônico de prioridade de tarefa
 * Usa cores e labels exclusivamente do mapper central
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTaskPriorityConfig } from '@/constants/taskPriority';
import type { TaskPriorityCanonical } from '@/types/tarefas';

interface TaskPriorityBadgeProps {
  priority: TaskPriorityCanonical | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showIcon = true,
  className
}) => {
  const config = getTaskPriorityConfig(priority);
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <Badge 
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span className="text-[10px]">{config.icon}</span>}
      {config.shortLabel}
    </Badge>
  );
};

export default TaskPriorityBadge;
