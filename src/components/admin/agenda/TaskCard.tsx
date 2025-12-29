import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'NÃO REALIZADO': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'REALIZADO': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PRIORIDADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Alta': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Média': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Baixa': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
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
  task: NotionTask;
  compact?: boolean;
  showCompleteButton?: boolean;
  onComplete?: (taskId: string) => void;
}

const TaskCard = ({ task, compact = false, showCompleteButton = true, onComplete }: TaskCardProps) => {
  const queryClient = useQueryClient();
  const statusColors = getStatusColor(task.status);
  const prioridadeColors = getPrioridadeColor(task.prioridade);
  
  const isOverdue = task.data && task.status !== 'Concluído' && isBefore(parseISO(task.data), new Date());
  const isCompleted = task.status === 'Concluído';

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notion_tasks' as any)
        .update({ 
          status: 'Concluído',
          finalizado_por: 'Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa marcada como concluída!');
      queryClient.invalidateQueries({ queryKey: ['notion-tasks'] });
      onComplete?.(task.id);
    },
    onError: (error: any) => {
      toast.error(`Erro ao concluir tarefa: ${error.message}`);
    }
  });

  if (compact) {
    return (
      <div 
        className={`px-2 py-1 rounded text-xs cursor-pointer transition-all hover:scale-105 ${statusColors.bg} ${statusColors.text} border ${statusColors.border} ${isOverdue ? 'ring-1 ring-red-400' : ''}`}
        title={`${task.nome} - ${task.status || 'Sem status'}`}
      >
        <div className="flex items-center gap-1">
          {task.prioridade === 'Alta' && <AlertTriangle className="h-3 w-3 text-red-500" />}
          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
          <span className="font-medium truncate">{task.nome}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all ${isOverdue ? 'ring-1 ring-red-300' : ''} ${isCompleted ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {task.prioridade && (
              <Badge className={`text-[10px] ${prioridadeColors.bg} ${prioridadeColors.text} ${prioridadeColors.border}`}>
                {task.prioridade}
              </Badge>
            )}
            {task.status && (
              <Badge className={`text-[10px] ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                {task.status}
              </Badge>
            )}
            {isOverdue && (
              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">
                Atrasada
              </Badge>
            )}
          </div>
          <h3 className={`font-medium text-gray-900 text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {task.nome}
          </h3>
          {task.responsavel && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {task.responsavel_avatar ? (
                <img src={task.responsavel_avatar} className="h-4 w-4 rounded-full" alt="" />
              ) : (
                <span>👤</span>
              )}
              {task.responsavel}
            </p>
          )}
          {task.data && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.data), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
          {task.finalizado_por && isCompleted && (
            <p className="text-xs text-emerald-600 mt-1">
              ✓ Concluído por {task.finalizado_por}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {showCompleteButton && !isCompleted && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
              onClick={() => completeMutation.mutate()}
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
          {task.notion_url && (
            <a
              href={task.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Abrir no Notion"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
