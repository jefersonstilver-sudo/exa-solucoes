import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { TaskWithDetails, TaskFilters, TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';
import { ACTIVE_STATUSES } from '@/constants/taskStatus';
import { comparePriorities } from '@/constants/taskPriority';

interface UseTasksOptions {
  filters?: TaskFilters;
  enabled?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { filters, enabled = true } = options;
  const { userProfile } = useAuth();
  const userId = userProfile?.id;

  const query = useQuery({
    queryKey: ['tasks', userId, filters],
    queryFn: async (): Promise<TaskWithDetails[]> => {
      if (!userId) return [];

      // Query principal das tarefas
      let tasksQuery = supabase
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
        .order('data_prevista', { ascending: true, nullsFirst: false });

      // Filtros de status
      if (filters?.status && filters.status.length > 0) {
        tasksQuery = tasksQuery.in('status', filters.status);
      } else {
        // Por padrão, mostrar apenas tarefas ativas
        tasksQuery = tasksQuery.in('status', ACTIVE_STATUSES);
      }

      // Filtros de prioridade
      if (filters?.prioridade && filters.prioridade.length > 0) {
        tasksQuery = tasksQuery.in('prioridade', filters.prioridade);
      }

      // Filtro de departamento
      if (filters?.departamento) {
        tasksQuery = tasksQuery.eq('task_types.departamento', filters.departamento);
      }

      // Filtro de período
      if (filters?.data_inicio) {
        tasksQuery = tasksQuery.gte('data_prevista', filters.data_inicio);
      }
      if (filters?.data_fim) {
        tasksQuery = tasksQuery.lte('data_prevista', filters.data_fim);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      // Buscar responsáveis de todas as tarefas
      const taskIds = tasks.map(t => t.id);
      
      const { data: responsaveis, error: respError } = await supabase
        .from('task_responsaveis')
        .select(`
          id,
          task_id,
          user_id,
          created_at
        `)
        .in('task_id', taskIds);

      if (respError) {
        console.error('Erro ao buscar responsáveis:', respError);
      }

      // Buscar dados dos usuários responsáveis
      const userIds = [...new Set((responsaveis || []).map(r => r.user_id))];
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

      // Buscar checklist de todas as tarefas
      const { data: checklistItems, error: checklistError } = await supabase
        .from('task_checklist_items')
        .select('*')
        .in('task_id', taskIds)
        .order('ordem', { ascending: true });

      if (checklistError) {
        console.error('Erro ao buscar checklist:', checklistError);
      }

      // Montar mapa de responsáveis por tarefa
      const responsaveisMap: Record<string, typeof responsaveis> = {};
      (responsaveis || []).forEach(r => {
        if (!responsaveisMap[r.task_id]) {
          responsaveisMap[r.task_id] = [];
        }
        responsaveisMap[r.task_id].push({
          ...r,
          user_nome: usersMap[r.user_id]?.nome,
          user_email: usersMap[r.user_id]?.email
        } as any);
      });

      // Montar mapa de checklist por tarefa
      const checklistMap: Record<string, typeof checklistItems> = {};
      (checklistItems || []).forEach(item => {
        if (!checklistMap[item.task_id]) {
          checklistMap[item.task_id] = [];
        }
        checklistMap[item.task_id].push(item);
      });

      // Filtrar por responsabilidade do usuário
      const filteredTasks = tasks.filter(task => {
        // Se todos_responsaveis = true, qualquer admin pode ver
        if (task.todos_responsaveis) return true;
        
        // Caso contrário, verificar se o usuário é responsável
        const taskResps = responsaveisMap[task.id] || [];
        return taskResps.some(r => r.user_id === userId);
      });

      // Filtrar por responsável específico se solicitado
      let finalTasks = filteredTasks;
      if (filters?.responsavel_id) {
        finalTasks = filteredTasks.filter(task => {
          const taskResps = responsaveisMap[task.id] || [];
          return taskResps.some(r => r.user_id === filters.responsavel_id);
        });
      }

      // Montar resultado com detalhes
      const result: TaskWithDetails[] = finalTasks.map(task => {
        const checklist = checklistMap[task.id] || [];
        const taskType = task.task_types as any;
        
        return {
          id: task.id,
          task_type_id: task.task_type_id,
          rotina_id: task.rotina_id,
          origem_id: task.origem_id,
          cliente_id: task.cliente_id,
          titulo: task.titulo,
          descricao: task.descricao,
          prioridade: task.prioridade as TaskPriorityCanonical,
          status: task.status as TaskStatusCanonical,
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
          responsaveis: responsaveisMap[task.id] || [],
          checklist,
          checklist_total: checklist.length,
          checklist_concluidos: checklist.filter(c => c.concluido).length
        } as TaskWithDetails;
      });

      // Ordenar por prioridade e depois por data
      result.sort((a, b) => {
        const priorityCompare = comparePriorities(a.prioridade, b.prioridade);
        if (priorityCompare !== 0) return priorityCompare;
        
        // Se mesma prioridade, ordenar por data
        if (!a.data_prevista && !b.data_prevista) return 0;
        if (!a.data_prevista) return 1;
        if (!b.data_prevista) return -1;
        return new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime();
      });

      return result;
    },
    enabled: enabled && !!userId,
    refetchInterval: 60000, // Atualizar a cada minuto
    staleTime: 30000
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
