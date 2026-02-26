import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Check, 
  AlertTriangle,
  Loader2,
  Video,
  MapPin,
  Users,
  Megaphone,
  Clock
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaskStatusCanonical, TipoEvento } from '@/types/tarefas';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';

export interface AgendaTask {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
  data_prevista: string | null;
  horario_limite: string | null;
  horario_inicio: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tipo_evento: string | null;
  subtipo_reuniao: string | null;
  departamento_id: string | null;
  local_evento: string | null;
  link_reuniao: string | null;
  escopo: string | null;
  concluida_por: string | null;
  data_conclusao: string | null;
  todos_responsaveis?: boolean;
  task_responsaveis?: { user_id: string; users: { nome: string } }[];
}

const STATUS_LABELS: Record<string, string> = {
  'pendente': 'Pendente',
  'em_andamento': 'Em andamento',
  'aguardando_aprovacao': 'Aguardando',
  'aguardando_insumo': 'Aguardando',
  'concluida': 'Concluída',
  'nao_realizada': 'Não realizada',
  'cancelada': 'Cancelada',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'pendente': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'em_andamento': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'aguardando_aprovacao': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'aguardando_insumo': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'concluida': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'nao_realizada': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'cancelada': { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

const PRIORIDADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'emergencia': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'alta': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'media': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'baixa': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

// Fallback estático caso o hook ainda não carregou
const TIPO_EVENTO_FALLBACK: Record<string, { icon: string; color: string; label: string }> = {
  'tarefa': { icon: '✅', color: 'bg-emerald-100 text-emerald-700', label: 'Tarefa' },
  'reuniao': { icon: '📹', color: 'bg-blue-100 text-blue-700', label: 'Reunião' },
  'compromisso': { icon: '📍', color: 'bg-orange-100 text-orange-700', label: 'Compromisso' },
  'aviso': { icon: '📢', color: 'bg-purple-100 text-purple-700', label: 'Aviso' },
};

const getStatusColor = (status: string | null) => {
  if (!status) return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  return STATUS_COLORS[status] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};

const getPrioridadeColor = (prioridade: string | null) => {
  if (!prioridade) return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  return PRIORIDADE_COLORS[prioridade] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};

interface TaskCardProps {
  task: AgendaTask;
  compact?: boolean;
  showCompleteButton?: boolean;
  onComplete?: (taskId: string) => void;
  onClick?: () => void;
}

const TaskCard = ({ task, compact = false, showCompleteButton = true, onComplete, onClick }: TaskCardProps) => {
  const queryClient = useQueryClient();
  const { getEventTypeConfig } = useEventTypes();
  const statusColors = getStatusColor(task.status);
  const prioridadeColors = getPrioridadeColor(task.prioridade);
  
  // Usa dados do banco via hook, com fallback estático
  const dynamicConfig = getEventTypeConfig(task.tipo_evento || 'tarefa');
  const fallback = TIPO_EVENTO_FALLBACK[task.tipo_evento || 'tarefa'] || TIPO_EVENTO_FALLBACK['tarefa'];
  const tipoConfig = {
    icon: <span className="text-xs">{dynamicConfig.icon || fallback.icon}</span>,
    color: dynamicConfig.color || fallback.color,
    label: dynamicConfig.label || fallback.label,
  };
  
  const isOverdue = task.data_prevista && !['concluida', 'cancelada', 'nao_realizada'].includes(task.status) && isBefore(parseISO(task.data_prevista), new Date());
  const isCompleted = task.status === 'concluida';

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'concluida' as TaskStatusCanonical,
          data_conclusao: new Date().toISOString(),
        })
        .eq('id', task.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa marcada como concluída!');
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      onComplete?.(task.id);
    },
    onError: (error: any) => {
      toast.error(`Erro ao concluir tarefa: ${error.message}`);
    }
  });

  // Build responsible name for compact card
  const firstResponsavel = task.task_responsaveis?.[0]?.users?.nome?.split(' ')[0];
  const responsaveisCount = task.task_responsaveis?.length || 0;
  const responsavelLabel = task.todos_responsaveis 
    ? 'Todos' 
    : responsaveisCount > 1 
      ? `${firstResponsavel} +${responsaveisCount - 1}`
      : firstResponsavel || null;

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-sm border ${isOverdue ? 'ring-1 ring-red-400' : ''} ${tipoConfig.color}`}
        title={[
          `${tipoConfig.label}: ${task.titulo}`,
          task.prioridade ? `Prioridade: ${task.prioridade === 'emergencia' ? 'Emergência' : task.prioridade === 'alta' ? 'Alta' : task.prioridade === 'media' ? 'Média' : 'Baixa'}` : null,
          `Status: ${STATUS_LABELS[task.status] || task.status}`,
          task.horario_inicio ? `Início: ${task.horario_inicio.substring(0, 5)}` : null,
          task.horario_limite ? `Até: ${task.horario_limite.substring(0, 5)}` : null,
          responsavelLabel ? `Resp: ${responsavelLabel}` : null,
          task.local_evento ? `Local: ${task.local_evento}` : null,
          task.link_reuniao ? `Link: ${task.link_reuniao}` : null,
          task.descricao ? `${task.descricao.substring(0, 80)}` : null,
        ].filter(Boolean).join('\n')}
      >
        <div className="flex items-center gap-1">
          {tipoConfig.icon}
          <span className="font-medium truncate flex-1">{task.titulo}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 opacity-75">
          <span className="text-[9px] font-medium">{tipoConfig.label}</span>
          {(responsavelLabel || task.horario_inicio) && <span className="text-[9px]">•</span>}
          {responsavelLabel && (
            <span className="text-[9px] flex items-center gap-0.5">
              <Users className="h-2 w-2" />
              {responsavelLabel}
            </span>
          )}
          {task.horario_inicio && (
            <span className="text-[9px] flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {task.horario_inicio.substring(0, 5)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer ${isOverdue ? 'ring-1 ring-red-300' : ''} ${isCompleted ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Tipo de evento badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tipoConfig.color}`}>
              {tipoConfig.icon}
              {tipoConfig.label}
            </span>
            {task.prioridade && (
              <Badge className={`text-[10px] ${prioridadeColors.bg} ${prioridadeColors.text} ${prioridadeColors.border}`}>
                {task.prioridade === 'emergencia' ? '🔴 Emergência' : 
                 task.prioridade === 'alta' ? '🟠 Alta' : 
                 task.prioridade === 'media' ? '🟡 Média' : '🟢 Baixa'}
              </Badge>
            )}
            {task.status && (
              <Badge className={`text-[10px] font-semibold ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                {STATUS_LABELS[task.status] || task.status}
              </Badge>
            )}
            {isOverdue && (
              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 font-semibold">
                Atrasada
              </Badge>
            )}
            {task.escopo === 'global' && (
              <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">
                📢 Global
              </Badge>
            )}
          </div>
          <h3 className={`font-medium text-gray-900 text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {task.titulo}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.data_prevista && (
              <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                <Calendar className="h-3 w-3" />
                {format(parseISO(task.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            {task.horario_inicio && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.horario_inicio.substring(0, 5)}
              </p>
            )}
            {task.horario_limite && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                até {task.horario_limite.substring(0, 5)}
              </p>
            )}
            {task.link_reuniao && (
              <a 
                href={task.link_reuniao} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Video className="h-3 w-3" /> Link
              </a>
            )}
            {task.local_evento && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {task.local_evento}
              </p>
            )}
          </div>
          {task.subtipo_reuniao && (
            <p className="text-xs text-blue-500 mt-1 capitalize">
              Reunião {task.subtipo_reuniao}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {showCompleteButton && !isCompleted && task.tipo_evento !== 'aviso' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
              onClick={(e) => { e.stopPropagation(); completeMutation.mutate(); }}
              disabled={completeMutation.isPending}
              title="Marcar como concluído"
            >
              {completeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;