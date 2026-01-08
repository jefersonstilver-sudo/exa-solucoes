import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { format, parseISO, isBefore, isToday, startOfDay } from 'date-fns';
import type { TarefaNotionExistente, MinhaManhaDados } from '@/types/tarefas';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useMinhaManha() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  // Buscar todas as tarefas do notion_tasks
  const { data: tarefas, isLoading, error, refetch } = useQuery({
    queryKey: ['minha-manha-tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_tasks' as any)
        .select('*')
        .order('data', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return (data || []) as unknown as TarefaNotionExistente[];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Processar e categorizar tarefas
  const dados: MinhaManhaDados = useMemo(() => {
    if (!tarefas) {
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

    // Filtrar tarefas não concluídas
    const tarefasAtivas = tarefas.filter(t => 
      t.status !== 'Concluído' && t.status !== 'concluida'
    );

    // Calcular atrasadas
    const atrasadas = tarefasAtivas.filter(t => {
      if (!t.data) return false;
      const dataTask = parseISO(t.data.split('T')[0]);
      return isBefore(dataTask, hoje);
    });

    // Tarefas de hoje
    const tarefasHoje = tarefasAtivas.filter(t => {
      if (!t.data) return false;
      return t.data.split('T')[0] === hojeStr;
    });

    // Concluídas hoje
    const concluidasHoje = tarefas.filter(t => {
      if (t.status !== 'Concluído' && t.status !== 'concluida') return false;
      if (!t.updated_at) return false;
      return isToday(parseISO(t.updated_at));
    });

    // Categorizar por prioridade
    // URGENTE: Alta prioridade OU atrasada
    const urgentes = tarefasAtivas.filter(t => {
      const isAtrasada = t.data && isBefore(parseISO(t.data.split('T')[0]), hoje);
      return t.prioridade === 'Alta' || isAtrasada;
    }).sort((a, b) => {
      // Ordenar por data, atrasadas primeiro
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    // IMPORTANTE: Média prioridade ou tarefas de hoje sem alta prioridade
    const importantes = tarefasAtivas.filter(t => {
      const isAtrasada = t.data && isBefore(parseISO(t.data.split('T')[0]), hoje);
      if (isAtrasada) return false; // Já está em urgentes
      if (t.prioridade === 'Alta') return false; // Já está em urgentes
      
      const isHoje = t.data && t.data.split('T')[0] === hojeStr;
      return t.prioridade === 'Média' || isHoje;
    }).sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    // ROTINA: Baixa prioridade ou sem prioridade definida
    const rotina = tarefasAtivas.filter(t => {
      const isAtrasada = t.data && isBefore(parseISO(t.data.split('T')[0]), hoje);
      if (isAtrasada) return false;
      if (t.prioridade === 'Alta') return false;
      if (t.prioridade === 'Média') return false;
      const isHoje = t.data && t.data.split('T')[0] === hojeStr;
      if (isHoje) return false;
      
      return true;
    }).sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    return {
      urgentes,
      importantes,
      rotina,
      estatisticas: {
        total: tarefasAtivas.length,
        urgentes: urgentes.length,
        importantes: importantes.length,
        rotina: rotina.length,
        atrasadas: atrasadas.length,
        hoje: tarefasHoje.length,
        concluidas_hoje: concluidasHoje.length,
      },
    };
  }, [tarefas]);

  // Mutation para concluir tarefa
  const concluirTarefa = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('notion_tasks' as any)
        .update({ 
          status: 'Concluído',
          finalizado_por: userProfile?.nome || userProfile?.email || 'Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa concluída!');
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['notion-tasks'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao concluir tarefa: ${error.message}`);
    }
  });

  // Mutation para sincronizar com Notion
  const sincronizar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-notion-tasks', {
        body: { force: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronizado! ${data?.stats?.updated || 0} atualizadas`);
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['notion-tasks'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
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
    sincronizar: sincronizar.mutate,
    isSincronizando: sincronizar.isPending,
  };
}
