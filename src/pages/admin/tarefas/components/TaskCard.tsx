/**
 * TaskCard - Card de tarefa para Minha Manhã
 * Layout minimalista, visual moderno, cores do mapper
 */

import React from 'react';
import { Check, Loader2, AlertTriangle, CalendarDays, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskPriorityBadge } from '@/components/admin/tarefas/TaskPriorityBadge';
import { getTaskPriorityConfig } from '@/constants/taskPriority';
import type { TaskWithDetails, TaskCategory } from '@/types/tarefas';

interface TaskCardProps {
  task: TaskWithDetails;
  tipo: TaskCategory;
  onConcluir: (taskId: string) => void;
  isConcluindo: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  tipo,
  onConcluir,
  isConcluindo
}) => {
  const hoje = startOfDay(new Date());
  const isAtrasada = task.data_prevista && isBefore(parseISO(task.data_prevista.split('T')[0]), hoje);
  
  const priorityConfig = getTaskPriorityConfig(task.prioridade);
  
  // Configurações visuais por tipo de seção
  const tipoConfig = {
    urgente: {
      bg: 'bg-red-50/50 hover:bg-red-50',
      hoverShadow: 'hover:shadow-red-100/50',
    },
    importante: {
      bg: 'bg-amber-50/50 hover:bg-amber-50',
      hoverShadow: 'hover:shadow-amber-100/50',
    },
    rotina: {
      bg: 'bg-emerald-50/50 hover:bg-emerald-50',
      hoverShadow: 'hover:shadow-emerald-100/50',
    },
  };

  const config = tipoConfig[tipo];

  // Determinar responsável a mostrar
  const responsavelDisplay = task.todos_responsaveis 
    ? null 
    : task.responsaveis?.[0]?.user_nome || null;

  // Progresso do checklist
  const checklistTotal = task.checklist_total || task.checklist?.length || 0;
  const checklistConcluidos = task.checklist_concluidos || 
    task.checklist?.filter(item => item.concluido).length || 0;

  return (
    <div 
      className={cn(
        "p-4 rounded-xl border-l-4 transition-all duration-200 cursor-pointer group",
        priorityConfig.borderLeftColor,
        config.bg,
        "border border-gray-100/80",
        "hover:shadow-md",
        config.hoverShadow
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <TaskPriorityBadge priority={task.prioridade} size="sm" />
            
            {task.departamento && (
              <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-medium">
                {task.departamento}
              </Badge>
            )}
            
            {isAtrasada && (
              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 font-semibold animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                Atrasada
              </Badge>
            )}
          </div>
          
          {/* Título */}
          <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1.5 line-clamp-2">
            {task.titulo}
          </h4>
          
          {/* Linha de metadados */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {/* Data */}
            {task.data_prevista && (
              <div className={cn(
                "flex items-center gap-1",
                isAtrasada ? "text-red-600 font-medium" : "text-gray-500"
              )}>
                <CalendarDays className="h-3 w-3" />
                {format(parseISO(task.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
            
            {/* Horário limite */}
            {task.horario_limite && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" />
                {task.horario_limite.slice(0, 5)}
              </div>
            )}
          </div>

          {/* Linha inferior: Responsável + Checklist */}
          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Responsável */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              {task.todos_responsaveis ? (
                <>
                  <Users className="h-3 w-3" />
                  <span>Todos</span>
                </>
              ) : responsavelDisplay ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                    {responsavelDisplay.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[100px]">{responsavelDisplay}</span>
                </>
              ) : null}
            </div>

            {/* Progresso Checklist */}
            {checklistTotal > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Check className="h-3 w-3" />
                <span>{checklistConcluidos}/{checklistTotal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ação Concluir (hover only) */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              "hover:bg-emerald-100 hover:text-emerald-600",
              "focus:ring-2 focus:ring-emerald-200"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onConcluir(task.id);
            }}
            disabled={isConcluindo}
            title="Concluir tarefa"
          >
            {isConcluindo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
