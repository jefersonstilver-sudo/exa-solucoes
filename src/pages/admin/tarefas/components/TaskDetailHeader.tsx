/**
 * TaskDetailHeader - Cabeçalho do drawer de tarefa
 * Exibe título, badges, data/hora e responsáveis
 */

import React from 'react';
import { CalendarDays, Clock, Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskStatusBadge } from '@/components/admin/tarefas/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/admin/tarefas/TaskPriorityBadge';
import { getTaskPriorityConfig } from '@/constants/taskPriority';
import type { TaskWithDetails } from '@/types/tarefas';

interface TaskDetailHeaderProps {
  task: TaskWithDetails;
}

export const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ task }) => {
  const hoje = startOfDay(new Date());
  const isAtrasada = task.data_prevista && isBefore(parseISO(task.data_prevista.split('T')[0]), hoje);
  const priorityConfig = getTaskPriorityConfig(task.prioridade);

  return (
    <div className={cn(
      "px-6 pt-6 pb-4 border-b border-gray-100",
      "bg-gradient-to-b from-gray-50/80 to-white"
    )}>
      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TaskPriorityBadge priority={task.prioridade} size="md" />
        <TaskStatusBadge status={task.status} size="md" />
        
        {task.departamento && (
          <Badge className="text-[10px] bg-gray-50 text-gray-500 border-gray-200/80 font-normal px-2 py-0.5">
            {task.departamento}
          </Badge>
        )}
        
        {isAtrasada && (
          <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200/80 font-medium px-2 py-0.5 animate-[pulse_3s_ease-in-out_infinite]">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasada
          </Badge>
        )}
      </div>

      {/* Título */}
      <h2 className="text-lg font-semibold text-gray-900 leading-snug mb-3">
        {task.titulo}
      </h2>

      {/* Descrição */}
      {task.descricao && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-3">
          {task.descricao}
        </p>
      )}

      {/* Metadados: Data, Hora, Responsáveis */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {/* Data */}
        {task.data_prevista && (
          <div className={cn(
            "flex items-center gap-1.5",
            isAtrasada ? "text-red-600 font-medium" : "text-gray-500"
          )}>
            <CalendarDays className="h-4 w-4" />
            <span>{format(parseISO(task.data_prevista), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
          </div>
        )}

        {/* Horário limite */}
        {task.horario_limite && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{task.horario_limite.slice(0, 5)}</span>
          </div>
        )}
      </div>

      {/* Responsáveis */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {task.todos_responsaveis ? (
              <span className="font-medium text-gray-600">Todos os responsáveis</span>
            ) : task.responsaveis && task.responsaveis.length > 0 ? (
              <span className="font-medium text-gray-600">
                {task.responsaveis.map(r => r.user_nome).join(', ')}
              </span>
            ) : (
              <span className="italic text-gray-400">Sem responsável definido</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailHeader;
