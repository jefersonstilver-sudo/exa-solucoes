/**
 * useCentralTarefas - Hook para Central de Tarefas
 * Fase 4.3: Listagem completa com filtros dinâmicos
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ACTIVE_STATUSES } from '@/constants/taskStatus';
import type { TaskWithDetails, TaskStatusCanonical, TaskPriorityCanonical, TaskFilters } from '@/types/tarefas';

interface CentralTarefasFilters extends TaskFilters {
  limit?: number;
  offset?: number;
}

interface CentralTarefasStats {
  total: number;
  pendentes: number;
  em_andamento: number;
  concluidas: number;
}

interface UseCentralTarefasResult {
  tasks: TaskWithDetails[];
  stats: CentralTarefasStats;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
  departamentos: string[];
  responsaveis: Array<{ id: string; nome: string; email: string }>;
}

const PAGE_SIZE = 50;

export function useCentralTarefas(filters: CentralTarefasFilters): UseCentralTarefasResult {
  const { userProfile } = useAuth();

  // Query para departamentos disponíveis
  const departamentosQuery = useQuery({
    queryKey: ['central-tarefas-departamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_types')
        .select('departamento')
        .eq('ativo', true)
        .order('departamento');

      if (error) throw error;

      const uniqueDeps = [...new Set((data || []).map(d => d.departamento))].filter(Boolean);
      return uniqueDeps as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para responsáveis disponíveis (usuários com tarefas)
  const responsaveisQuery = useQuery({
    queryKey: ['central-tarefas-responsaveis'],
    queryFn: async () => {
      // Buscar usuários distintos que têm tarefas
      const { data: taskResp, error: respError } = await supabase
        .from('task_responsaveis')
        .select('user_id');

      if (respError) throw respError;

      const userIds = [...new Set((taskResp || []).map(r => r.user_id))];
      
      if (userIds.length === 0) return [];

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nome, email')
        .in('id', userIds)
        .order('nome');

      if (usersError) throw usersError;

      return (users || []).map(u => ({
        id: u.id,
        nome: u.nome || u.email || 'Sem nome',
        email: u.email || ''
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query principal de tarefas com filtros
  const tasksQuery = useQuery({
    queryKey: ['central-tarefas', filters],
    queryFn: async (): Promise<{ tasks: TaskWithDetails[]; total: number }> => {
      const limit = filters.limit || PAGE_SIZE;
      const offset = filters.offset || 0;

      // Construir query base
      let query = supabase
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
        `, { count: 'exact' });

      // Aplicar filtro de status
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Aplicar filtro de prioridade
      if (filters.prioridade && filters.prioridade.length > 0) {
        query = query.in('prioridade', filters.prioridade);
      }

      // Ordenação: prioridade (emergencia primeiro), depois data_prevista
      query = query
        .order('prioridade', { ascending: true })
        .order('data_prevista', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const { data: tasks, error, count } = await query;

      if (error) throw error;

      // Se filtro de departamento, filtrar no cliente (ou fazer subquery)
      let filteredTasks = tasks || [];
      
      if (filters.departamento) {
        filteredTasks = filteredTasks.filter(t => {
          const taskType = t.task_types as any;
          return taskType?.departamento === filters.departamento;
        });
      }

      // Buscar responsáveis para as tarefas
      const taskIds = filteredTasks.map(t => t.id);
      
      let responsaveisMap: Record<string, Array<{ user_id: string; user_nome?: string; user_email?: string }>> = {};
      
      if (taskIds.length > 0) {
        const { data: responsaveis } = await supabase
          .from('task_responsaveis')
          .select('*')
          .in('task_id', taskIds);

        // Se filtro de responsável, filtrar tarefas
        if (filters.responsavel_id) {
          const filteredTaskIds = new Set(
            (responsaveis || [])
              .filter(r => r.user_id === filters.responsavel_id)
              .map(r => r.task_id)
          );
          
          // Incluir também tarefas com todos_responsaveis = true
          filteredTasks = filteredTasks.filter(t => 
            t.todos_responsaveis || filteredTaskIds.has(t.id)
          );
        }

        // Buscar nomes dos usuários
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

        // Montar mapa de responsáveis por tarefa
        (responsaveis || []).forEach(r => {
          if (!responsaveisMap[r.task_id]) {
            responsaveisMap[r.task_id] = [];
          }
          responsaveisMap[r.task_id].push({
            user_id: r.user_id,
            user_nome: usersMap[r.user_id]?.nome,
            user_email: usersMap[r.user_id]?.email
          });
        });
      }

      // Buscar checklists
      let checklistMap: Record<string, { total: number; concluidos: number }> = {};
      
      if (taskIds.length > 0) {
        const { data: checklists } = await supabase
          .from('task_checklist_items')
          .select('task_id, concluido')
          .in('task_id', taskIds);

        (checklists || []).forEach(c => {
          if (!checklistMap[c.task_id]) {
            checklistMap[c.task_id] = { total: 0, concluidos: 0 };
          }
          checklistMap[c.task_id].total++;
          if (c.concluido) {
            checklistMap[c.task_id].concluidos++;
          }
        });
      }

      // Montar resultado
      const result: TaskWithDetails[] = filteredTasks.map(task => {
        const taskType = task.task_types as any;
        const checklistInfo = checklistMap[task.id] || { total: 0, concluidos: 0 };
        
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
          responsaveis: responsaveisMap[task.id] || [],
          checklist_total: checklistInfo.total,
          checklist_concluidos: checklistInfo.concluidos
        } as TaskWithDetails;
      });

      return { tasks: result, total: count || 0 };
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  // Query de estatísticas
  const statsQuery = useQuery({
    queryKey: ['central-tarefas-stats', filters.departamento, filters.responsavel_id],
    queryFn: async (): Promise<CentralTarefasStats> => {
      // Query base para contagem
      let baseQuery = supabase.from('tasks').select('status', { count: 'exact' });

      // Aplicar filtros de departamento via join se necessário
      // Por simplicidade, fazemos contagem geral

      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('status');

      if (error) throw error;

      const tasks = allTasks || [];
      
      return {
        total: tasks.length,
        pendentes: tasks.filter(t => 
          ['pendente', 'aguardando_aprovacao', 'aguardando_insumo'].includes(t.status)
        ).length,
        em_andamento: tasks.filter(t => t.status === 'em_andamento').length,
        concluidas: tasks.filter(t => t.status === 'concluida').length
      };
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  const currentOffset = filters.offset || 0;
  const total = tasksQuery.data?.total || 0;
  const hasMore = currentOffset + PAGE_SIZE < total;

  return {
    tasks: tasksQuery.data?.tasks || [],
    stats: statsQuery.data || { total: 0, pendentes: 0, em_andamento: 0, concluidas: 0 },
    isLoading: tasksQuery.isLoading || statsQuery.isLoading,
    isLoadingMore: tasksQuery.isFetching && currentOffset > 0,
    error: tasksQuery.error || statsQuery.error,
    refetch: () => {
      tasksQuery.refetch();
      statsQuery.refetch();
    },
    hasMore,
    loadMore: () => {
      // Implementado via mudança de offset no componente pai
    },
    departamentos: departamentosQuery.data || [],
    responsaveis: responsaveisQuery.data || []
  };
}
