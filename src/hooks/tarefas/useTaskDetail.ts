import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TaskWithDetails, TaskStatusCanonical, TaskChecklistItem } from '@/types/tarefas';

interface UseTaskDetailOptions {
  taskId: string | null;
  enabled?: boolean;
}

export function useTaskDetail(options: UseTaskDetailOptions) {
  const { taskId, enabled = true } = options;
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Query para detalhes da tarefa
  const taskQuery = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async (): Promise<TaskWithDetails | null> => {
      if (!taskId) return null;

      // Buscar tarefa
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_types (
            id,
            codigo,
            nome,
            departamento,
            descricao,
            prioridade_padrao
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      if (!task) return null;

      // Buscar responsáveis
      const { data: responsaveis } = await supabase
        .from('task_responsaveis')
        .select('*')
        .eq('task_id', taskId);

      // Buscar dados dos usuários
      const userIds = (responsaveis || []).map(r => r.user_id);
      let usersMap: Record<string, { nome: string; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, nome, email')
          .in('id', userIds);
        
        if (users) {
          usersMap = users.reduce((acc, u) => {
            acc[u.id] = { nome: u.nome || '', email: u.email || '' };
            return acc;
          }, {} as Record<string, { nome: string; email: string }>);
        }
      }

      // Buscar checklist
      const { data: checklist } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('ordem', { ascending: true });

      const taskType = task.task_types as any;
      const taskChecklist = checklist || [];

      return {
        id: task.id,
        task_type_id: task.task_type_id,
        rotina_id: task.rotina_id,
        origem_id: task.origem_id,
        cliente_id: task.cliente_id,
        titulo: task.titulo,
        descricao: task.descricao,
        prioridade: task.prioridade,
        status: task.status,
        origem: task.origem,
        data_prevista: task.data_prevista,
        horario_limite: task.horario_limite,
        data_conclusao: task.data_conclusao,
        concluida_por: task.concluida_por,
        motivo_nao_realizada: task.motivo_nao_realizada,
        todos_responsaveis: task.todos_responsaveis,
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        task_type: taskType,
        departamento: taskType?.departamento || null,
        responsaveis: (responsaveis || []).map(r => ({
          ...r,
          user_nome: usersMap[r.user_id]?.nome,
          user_email: usersMap[r.user_id]?.email
        })),
        checklist: taskChecklist,
        checklist_total: taskChecklist.length,
        checklist_concluidos: taskChecklist.filter(c => c.concluido).length
      } as TaskWithDetails;
    },
    enabled: enabled && !!taskId
  });

  // Mutation para atualizar status da tarefa
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      status, 
      motivo 
    }: { 
      status: TaskStatusCanonical; 
      motivo?: string;
    }) => {
      if (!taskId || !userProfile?.id) {
        throw new Error('Tarefa ou usuário não identificado');
      }

      // Verificar se há itens obrigatórios pendentes ao concluir
      if (status === 'concluida') {
        const task = taskQuery.data;
        if (task?.checklist) {
          const pendentesObrigatorios = task.checklist.filter(
            item => item.obrigatorio && !item.concluido
          );
          if (pendentesObrigatorios.length > 0) {
            throw new Error(
              `Existem ${pendentesObrigatorios.length} item(ns) obrigatório(s) pendente(s) no checklist`
            );
          }
        }
      }

      // Construir objeto de update
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };

      // Se concluída, registrar quem concluiu (coluna é concluida_por no banco)
      if (status === 'concluida') {
        updateData.data_conclusao = new Date().toISOString();
        updateData.concluida_por = userProfile.id;
      }

      // Se não realizada, exigir motivo
      if (status === 'nao_realizada') {
        if (!motivo) {
          throw new Error('É obrigatório informar o motivo para marcar como não realizada');
        }
        updateData.motivo_nao_realizada = motivo;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const statusLabels: Record<TaskStatusCanonical, string> = {
        pendente: 'pendente',
        em_andamento: 'em andamento',
        aguardando_aprovacao: 'aguardando aprovação',
        aguardando_insumo: 'aguardando insumo',
        concluida: 'concluída',
        nao_realizada: 'não realizada',
        cancelada: 'cancelada'
      };
      
      toast.success(`Tarefa marcada como ${statusLabels[variables.status]}!`);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  });

  // Mutation para atualizar item do checklist
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ 
      itemId, 
      concluido 
    }: { 
      itemId: string; 
      concluido: boolean;
    }) => {
      if (!userProfile?.id) {
        throw new Error('Usuário não identificado');
      }

      const updateData: Record<string, any> = {
        concluido,
        updated_at: new Date().toISOString()
      };

      if (concluido) {
        updateData.concluido_por = userProfile.id;
        updateData.concluido_em = new Date().toISOString();
      } else {
        updateData.concluido_por = null;
        updateData.concluido_em = null;
      }

      const { error } = await supabase
        .from('task_checklist_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar checklist');
    }
  });

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    error: taskQuery.error,
    refetch: taskQuery.refetch,
    
    // Mutations
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    updateChecklistItem: updateChecklistItemMutation.mutate,
    isUpdatingChecklist: updateChecklistItemMutation.isPending
  };
}
