/**
 * TaskDetailDrawer - Drawer de detalhe de tarefa
 * Fase 4.2: Execução de tarefas com checklist, status actions e histórico
 */

import React from 'react';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { TaskDetailHeader } from './TaskDetailHeader';
import { TaskChecklist } from './TaskChecklist';
import { TaskStatusActions } from './TaskStatusActions';
import { TaskStatusHistory } from './TaskStatusHistory';
import { TaskNotificationStatus } from './TaskNotificationStatus';
import type { TaskWithDetails, TaskStatusCanonical } from '@/types/tarefas';

interface TaskDetailDrawerProps {
  task: TaskWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatusCanonical, motivo?: string) => Promise<void>;
  onChecklistItemToggle: (itemId: string, concluido: boolean) => Promise<void>;
  isUpdating: boolean;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  open,
  onOpenChange,
  onStatusChange,
  onChecklistItemToggle,
  isUpdating
}) => {
  if (!task) return null;

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <span>Detalhes da Tarefa</span>
        </SheetHeader>
        
        {/* Header com informações principais */}
        <TaskDetailHeader task={task} />
        
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Checklist editável */}
          {task.checklist && task.checklist.length > 0 && (
            <TaskChecklist 
              items={task.checklist}
              onToggle={onChecklistItemToggle}
              isUpdating={isUpdating}
            />
          )}

          {/* Ações de Status */}
          <TaskStatusActions 
            task={task}
            onStatusChange={onStatusChange}
            isUpdating={isUpdating}
            onClose={handleClose}
          />

          {/* Monitor de Notificações */}
          <TaskNotificationStatus taskId={task.id} />

          {/* Histórico de Status (collapsed por padrão) */}
          <TaskStatusHistory taskId={task.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailDrawer;
