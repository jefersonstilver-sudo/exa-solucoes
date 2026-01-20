/**
 * TaskStatusBadge - Badge canônico de status de tarefa
 * Usa cores e labels exclusivamente do mapper central
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTaskStatusConfig } from '@/constants/taskStatus';
import type { TaskStatusCanonical } from '@/types/tarefas';

interface TaskStatusBadgeProps {
  status: TaskStatusCanonical | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = false,
  className
}) => {
  const config = getTaskStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <Badge 
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
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

export default TaskStatusBadge;
