/**
 * useMinhaManha - Hook migrado para o novo sistema de tarefas
 * Fonte de dados: tabela `tasks` (canônica)
 * Remove dependência do Notion
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { format, parseISO, isBefore, isToday, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ACTIVE_STATUSES, COMPLETABLE_STATUSES } from '@/constants/taskStatus';
import { URGENT_PRIORITIES, IMPORTANT_PRIORITIES, ROUTINE_PRIORITIES } from '@/constants/taskPriority';
import type { TaskWithDetails, MinhaManhaDadosV2, TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';

export function useMinhaManha() {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();

  // Buscar tarefas do novo sistema
  const { data: tarefas, isLoading, error, refetch } = useQuery({
    queryKey: ['minha-manha-tasks-v2', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar tarefas com status ativo
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_types (
            id,
            codigo,
            nome,
            departamento
          ),
          task_responsaveis (
            id,
            user_id,
            users:user_id (
              id,
              nome,
              email
            )
          ),
          task_checklist_items (
            id,
            descricao,
            obrigatorio,
            concluido,
            ordem
          )
        `)
        .in('status', ACTIVE_STATUSES)
        .order('prioridade', { ascending: true })
        .order('data_prevista', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      // Filtrar tarefas onde o usuário é responsável OU todos_responsaveis = true
      const filteredTasks = (tasks || []).filter(task => {
        if (task.todos_responsaveis) return true;
        const responsaveis = task.task_responsaveis || [];
        return responsaveis.some((r: any) => r.user_id === user.id);
      });

      // Mapear para o formato esperado
      return filteredTasks.map((task: any): TaskWithDetails => {
        const checklist = task.task_checklist_items || [];
        const responsaveis = (task.task_responsaveis || []).map((r: any) => ({
          id: r.id,
          task_id: task.id,
          user_id: r.user_id,
          user_nome: r.users?.nome || r.users?.email || 'Desconhecido',
          user_email: r.users?.email,
          created_at: r.created_at || task.created_at
        }));

        return {
          ...task,
          task_type: task.task_types || null,
          departamento: task.task_types?.departamento || null,
          responsaveis,
          checklist,
          checklist_total: checklist.length,
          checklist_concluidos: checklist.filter((c: any) => c.concluido).length
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Processar e categorizar tarefas
  const dados: MinhaManhaDadosV2 = useMemo(() => {
    if (!tarefas || tarefas.length === 0) {
      return {
        urgentes: [],
        importantes: [],
        rotina: [],
        estatisticas: {
          total: 0,
          urgentes: 0,
          importantes: 0,
          rotina: 0,
          atrasadas: 0,
          hoje: 0,
          concluidas_hoje: 0,
        },
      };
    }

    const hoje = startOfDay(new Date());
    const hojeStr = format(hoje, 'yyyy-MM-dd');

    // Identificar atrasadas
    const isAtrasada = (task: TaskWithDetails): boolean => {
      if (!task.data_prevista) return false;
      const dataTask = parseISO(task.data_prevista.split('T')[0]);
      return isBefore(dataTask, hoje);
    };

    // Identificar tarefas de hoje
    const isHoje = (task: TaskWithDetails): boolean => {
      if (!task.data_prevista) return false;
      return task.data_prevista.split('T')[0] === hojeStr;
    };

    // URGENTE: emergencia, alta, ou atrasada
    const urgentes = tarefas.filter(t => {
      if (isAtrasada(t)) return true;
      return URGENT_PRIORITIES.includes(t.prioridade as TaskPriorityCanonical);
    }).sort((a, b) => {
      // Ordenar: atrasadas primeiro, depois por data
      const aAtrasada = isAtrasada(a);
      const bAtrasada = isAtrasada(b);
      if (aAtrasada && !bAtrasada) return -1;
      if (!aAtrasada && bAtrasada) return 1;
      if (!a.data_prevista && !b.data_prevista) return 0;
      if (!a.data_prevista) return 1;
      if (!b.data_prevista) return -1;
      return new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime();
    });

    // IDs das urgentes para evitar duplicação
    const urgentesIds = new Set(urgentes.map(t => t.id));

    // IMPORTANTE: média prioridade OU hoje (sem ser urgente)
    const importantes = tarefas.filter(t => {
      if (urgentesIds.has(t.id)) return false;
      if (IMPORTANT_PRIORITIES.includes(t.prioridade as TaskPriorityCanonical)) return true;
      if (isHoje(t)) return true;
      return false;
    }).sort((a, b) => {
      if (!a.data_prevista && !b.data_prevista) return 0;
      if (!a.data_prevista) return 1;
      if (!b.data_prevista) return -1;
      return new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime();
    });

    // IDs das importantes para evitar duplicação
    const importantesIds = new Set(importantes.map(t => t.id));

    // ROTINA: baixa prioridade ou restantes
    const rotina = tarefas.filter(t => {
      if (urgentesIds.has(t.id)) return false;
      if (importantesIds.has(t.id)) return false;
      return true;
    }).sort((a, b) => {
      if (!a.data_prevista && !b.data_prevista) return 0;
      if (!a.data_prevista) return 1;
      if (!b.data_prevista) return -1;
      return new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime();
    });

    // Estatísticas
    const atrasadas = tarefas.filter(isAtrasada);
    const tarefasHoje = tarefas.filter(isHoje);

    return {
      urgentes,
      importantes,
      rotina,
      estatisticas: {
        total: tarefas.length,
        urgentes: urgentes.length,
        importantes: importantes.length,
        rotina: rotina.length,
        atrasadas: atrasadas.length,
        hoje: tarefasHoje.length,
        concluidas_hoje: 0, // Será calculado separadamente se necessário
      },
    };
  }, [tarefas]);

  // Mutation para concluir tarefa
  const concluirTarefa = useMutation({
    mutationFn: async (taskId: string) => {
      // Verificar se há itens obrigatórios não concluídos
      const task = tarefas?.find(t => t.id === taskId);
      if (task?.checklist) {
        const obrigatoriosPendentes = task.checklist.filter(
          item => item.obrigatorio && !item.concluido
        );
        if (obrigatoriosPendentes.length > 0) {
          throw new Error(`Existem ${obrigatoriosPendentes.length} item(ns) obrigatório(s) pendente(s) no checklist`);
        }
      }

      // Atualizar status da tarefa
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'concluida' as TaskStatusCanonical,
          data_conclusao: new Date().toISOString(),
          concluida_por: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa concluída!');
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks-v2'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao concluir tarefa');
    }
  });

  return {
    dados,
    tarefas: tarefas || [],
    isLoading,
    error,
    refetch,
    concluirTarefa: concluirTarefa.mutate,
    isConcluindo: concluirTarefa.isPending,
    // Removido: sincronizar (não há mais Notion)
    // Removido: isSincronizando (não há mais Notion)
  };
}
