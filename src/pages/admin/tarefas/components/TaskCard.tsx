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
  onClick?: (task: TaskWithDetails) => void;
  isConcluindo: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  tipo,
  onConcluir,
  onClick,
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
        "border border-gray-100/60",
        // Shadow sutil no hover (premium, não chamativo)
        "hover:shadow-sm hover:border-gray-200/80",
        config.hoverShadow
      )}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Título - elemento de maior hierarquia visual */}
          <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
            {task.titulo}
          </h4>
          
          {/* Badges - peso visual reduzido, secundários */}
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <TaskPriorityBadge priority={task.prioridade} size="sm" />
            
            {/* Badge departamento - mais discreto */}
            {task.departamento && (
              <Badge className="text-[9px] bg-gray-50 text-gray-500 border-gray-200/80 font-normal px-1.5 py-0">
                {task.departamento}
              </Badge>
            )}
            
            {/* Badge Atrasada - animação mais sutil */}
            {isAtrasada && (
              <Badge className="text-[9px] bg-red-50 text-red-600 border-red-200/80 font-medium px-1.5 py-0 animate-[pulse_3s_ease-in-out_infinite]">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Atrasada
              </Badge>
            )}
          </div>
          
          {/* Linha de metadados */}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            {/* Data */}
            {task.data_prevista && (
              <div className={cn(
                "flex items-center gap-1",
                isAtrasada ? "text-red-500 font-medium" : "text-gray-400"
              )}>
                <CalendarDays className="h-3 w-3" />
                {format(parseISO(task.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
            
            {/* Horário limite */}
            {task.horario_limite && (
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="h-3 w-3" />
                {task.horario_limite.slice(0, 5)}
              </div>
            )}
          </div>

          {/* Linha inferior: Responsável + Checklist */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100/60">
            {/* Responsável */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              {task.todos_responsaveis ? (
                <>
                  <Users className="h-3 w-3" />
                  <span className="text-gray-500">Todos</span>
                </>
              ) : responsavelDisplay ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-medium text-gray-500">
                    {responsavelDisplay.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[100px] text-gray-500">{responsavelDisplay}</span>
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

        {/* Ação Concluir - discreto, apenas no hover */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 w-7 p-0 rounded-full",
              "bg-transparent hover:bg-emerald-50 hover:text-emerald-600",
              "text-gray-300 group-hover:text-gray-400",
              "transition-colors duration-200"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onConcluir(task.id);
            }}
            disabled={isConcluindo}
            title="Concluir tarefa"
          >
            {isConcluindo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
