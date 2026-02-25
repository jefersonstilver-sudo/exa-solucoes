/**
 * CentralTarefasPage - Página Central de Tarefas
 * Fase 4.3: Listagem completa com filtros, CTA, FAB mobile
 * Reutiliza TaskCard e TaskDetailDrawer
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw, Loader2, Plus, ChevronDown, ChevronUp, X, SlidersHorizontal, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TASK_STATUS } from '@/constants/taskStatus';
import { TASK_PRIORITY } from '@/constants/taskPriority';
import { Button } from '@/components/ui/button';
import { useCentralTarefas } from '@/hooks/tarefas/useCentralTarefas';
import { useTaskDetail } from '@/hooks/tarefas/useTaskDetail';
import { TaskFiltersBar } from './components/TaskFiltersBar';
import { TaskCard } from './components/TaskCard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TaskEmptyState } from './components/TaskEmptyState';
import { TaskFAB } from './components/TaskFAB';
import EmbeddedAgenda from './components/EmbeddedAgenda';
import CreateTaskModal from '@/components/admin/agenda/CreateTaskModal';
import { ACTIVE_STATUSES } from '@/constants/taskStatus';
import type { TaskWithDetails, TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CentralTarefasPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Estado dos filtros
  const [statusFilter, setStatusFilter] = useState<TaskStatusCanonical[] | undefined>(
    [...ACTIVE_STATUSES] // Default: status ativos
  );
  const [prioridadeFilter, setPrioridadeFilter] = useState<TaskPriorityCanonical[] | undefined>();
  const [departamentoFilter, setDepartamentoFilter] = useState<string | undefined>();
  const [responsavelFilter, setResponsavelFilter] = useState<string | undefined>();
  const [offset, setOffset] = useState(0);

  // Estado do drawer e modal
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Hook principal
  const {
    tasks,
    stats,
    isLoading,
    isLoadingMore,
    error,
    refetch,
    hasMore,
    departamentos,
    responsaveis
  } = useCentralTarefas({
    status: statusFilter,
    prioridade: prioridadeFilter,
    departamento: departamentoFilter,
    responsavel_id: responsavelFilter,
    offset
  });

  // Query para tarefas da agenda (todas, sem filtro de paginação)
  const { data: agendaTasks = [] } = useQuery({
    queryKey: ['agenda-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, titulo, descricao, prioridade, status, data_prevista, horario_limite, horario_inicio, created_by, created_at, updated_at, tipo_evento, subtipo_reuniao, departamento_id, local_evento, link_reuniao, escopo, concluida_por, data_conclusao, todos_responsaveis, task_responsaveis(user_id, users:user_id(nome))')
        .order('data_prevista', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as AgendaTask[];
    }
  });

  // Hook para detalhes da tarefa selecionada
  const taskDetail = useTaskDetail({
    taskId: selectedTask?.id || null,
    enabled: drawerOpen && !!selectedTask
  });

  // Handlers
  const handleTaskClick = useCallback((task: TaskWithDetails) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  }, []);

  // Direct completion mutation
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const [concluindoId, setConcluindoId] = useState<string | null>(null);

  const concluirMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userProfile?.id) throw new Error('Usuário não identificado');
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'concluida',
          data_conclusao: new Date().toISOString(),
          concluida_por: userProfile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onMutate: (taskId) => setConcluindoId(taskId),
    onSuccess: () => {
      toast.success('Tarefa concluída!');
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setConcluindoId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao concluir tarefa');
      setConcluindoId(null);
    }
  });

  const handleConcluir = useCallback((taskId: string) => {
    concluirMutation.mutate(taskId);
  }, [concluirMutation]);

  const handleStatusChange = useCallback(async (
    taskId: string,
    newStatus: TaskStatusCanonical,
    motivo?: string
  ) => {
    await taskDetail.updateStatus({ status: newStatus, motivo });
  }, [taskDetail]);

  const handleChecklistItemToggle = useCallback(async (itemId: string, concluido: boolean) => {
    await taskDetail.updateChecklistItem({ itemId, concluido });
  }, [taskDetail]);

  const handleClearFilters = useCallback(() => {
    setStatusFilter([...ACTIVE_STATUSES]);
    setPrioridadeFilter(undefined);
    setDepartamentoFilter(undefined);
    setResponsavelFilter(undefined);
    setOffset(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    setOffset(prev => prev + 50);
  }, []);

  const handleRefresh = useCallback(() => {
    setOffset(0);
    refetch();
  }, [refetch]);

  const handleCreateTask = useCallback(() => {
    setCreateModalOpen(true);
  }, []);


  // Determinar categoria visual para cada tarefa
  const getTaskCategory = (task: TaskWithDetails): 'urgente' | 'importante' | 'rotina' => {
    if (task.prioridade === 'emergencia' || task.prioridade === 'alta') return 'urgente';
    if (task.prioridade === 'media') return 'importante';
    return 'rotina';
  };

  const isEmpty = tasks.length === 0 && !isLoading;
  const hasFilters = statusFilter?.length !== ACTIVE_STATUSES.length || prioridadeFilter || departamentoFilter || responsavelFilter;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Central de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize e gerencie todas as tarefas do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">

          {/* Botão Atualizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {/* Botão Tela Cheia */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/super_admin/tarefas/fullscreen')}
            className="gap-2"
            title="Tela Cheia"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Tela Cheia</span>
          </Button>

          {/* Botão Nova Tarefa - Desktop */}
          {!isMobile && (
            <Button
              onClick={handleCreateTask}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Stats Inline Bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm py-2 px-1">
        <span className="text-muted-foreground">Total: <b className="text-foreground text-base">{stats.total}</b></span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">Pendentes: <b className="text-foreground text-base">{stats.pendentes}</b></span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">Em Andamento: <b className="text-foreground text-base">{stats.em_andamento}</b></span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">Concluídas: <b className="text-foreground text-base">{stats.concluidas}</b></span>
      </div>

      {/* Agenda Integrada (prioridade visual) */}
      <div>
        <EmbeddedAgenda 
          tasks={agendaTasks}
          filterTrigger={
            <Collapsible defaultOpen={false}>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted group">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Filtros</span>
                  <ChevronDown className="h-3 w-3 group-data-[state=open]:hidden" />
                  <ChevronUp className="h-3 w-3 hidden group-data-[state=open]:block" />
                </CollapsibleTrigger>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {statusFilter && statusFilter.length !== ACTIVE_STATUSES.length
                    ? `${statusFilter.map(s => TASK_STATUS[s]?.shortLabel || s).join(', ')}`
                    : ''}
                  {prioridadeFilter ? ` · ${prioridadeFilter.map(p => TASK_PRIORITY[p]?.shortLabel || p).join(', ')}` : ''}
                </span>
                {(statusFilter?.length !== ACTIVE_STATUSES.length || prioridadeFilter || departamentoFilter || responsavelFilter) && (
                  <button onClick={handleClearFilters} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <CollapsibleContent className="pt-2">
                <TaskFiltersBar
                  statusFilter={statusFilter}
                  prioridadeFilter={prioridadeFilter}
                  departamentoFilter={departamentoFilter}
                  responsavelFilter={responsavelFilter}
                  onStatusChange={setStatusFilter}
                  onPrioridadeChange={setPrioridadeFilter}
                  onDepartamentoChange={setDepartamentoFilter}
                  onResponsavelChange={setResponsavelFilter}
                  onClearAll={handleClearFilters}
                  departamentos={departamentos}
                  responsaveis={responsaveis}
                />
              </CollapsibleContent>
            </Collapsible>
          }
        />
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {isLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <TaskEmptyState 
            variant={hasFilters ? 'no-results' : 'no-tasks'} 
            onCreateTask={handleCreateTask}
            filterActive={!!hasFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  tipo={getTaskCategory(task)}
                  onConcluir={handleConcluir}
                  onClick={handleTaskClick}
                  isConcluindo={concluindoId === task.id}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais tarefas'
                  )}
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground pt-2">
              Exibindo {tasks.length} de {stats.total} tarefas
            </p>
          </>
        )}
      </div>

      {/* FAB para mobile */}
      {isMobile && (
        <TaskFAB onClick={handleCreateTask} />
      )}

      {/* Modal de criação */}
      <CreateTaskModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />

      {/* Drawer de Detalhes */}
      <TaskDetailDrawer
        task={taskDetail.task || selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onChecklistItemToggle={handleChecklistItemToggle}
        isUpdating={taskDetail.isUpdatingStatus || taskDetail.isUpdatingChecklist}
      />
    </div>
  );
};

export default CentralTarefasPage;
