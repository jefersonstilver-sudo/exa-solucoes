/**
 * TaskStatusHistory - Histórico de mudanças de status
 * Collapsible por padrão, somente leitura
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTaskStatusConfig } from '@/constants/taskStatus';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TaskStatusLog, TaskStatusCanonical } from '@/types/tarefas';

interface TaskStatusHistoryProps {
  taskId: string;
}

export const TaskStatusHistory: React.FC<TaskStatusHistoryProps> = ({ taskId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ['task-status-history', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_status_log')
        .select(`
          id,
          status_anterior,
          status_novo,
          motivo,
          created_at,
          alterado_por,
          users:alterado_por (
            nome,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any): TaskStatusLog => ({
        id: item.id,
        task_id: taskId,
        status_anterior: item.status_anterior,
        status_novo: item.status_novo,
        alterado_por: item.alterado_por,
        motivo: item.motivo,
        created_at: item.created_at,
        alterado_por_nome: item.users?.nome || item.users?.email || 'Sistema'
      }));
    },
    enabled: isOpen // Só busca quando abrir
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Histórico de Status
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-400">
            Nenhum histórico registrado
          </div>
        ) : (
          <div className="relative pl-4 space-y-3">
            {/* Linha vertical do timeline */}
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200" />

            {history.map((entry, index) => {
              const statusConfig = getTaskStatusConfig(entry.status_novo);
              const isFirst = index === 0;

              return (
                <div key={entry.id} className="relative flex gap-3">
                  {/* Ponto do timeline */}
                  <div 
                    className={cn(
                      "absolute -left-2.5 w-3 h-3 rounded-full border-2 border-white",
                      statusConfig.bgColor
                    )}
                  />

                  {/* Conteúdo */}
                  <div className="flex-1 ml-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("font-medium", statusConfig.textColor)}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                      {entry.status_anterior && (
                        <span className="text-gray-400">
                          ← {getTaskStatusConfig(entry.status_anterior).label}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {entry.alterado_por_nome} • {format(parseISO(entry.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>

                    {entry.motivo && (
                      <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">
                        {entry.motivo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TaskStatusHistory;
