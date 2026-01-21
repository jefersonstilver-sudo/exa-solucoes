/**
 * CentralTarefasPage - Página Central de Tarefas
 * Fase 4.3: Listagem completa com filtros, CTA, FAB mobile
 * Reutiliza TaskCard e TaskDetailDrawer
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw, ListTodo, Clock, PlayCircle, CheckCircle2, Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCentralTarefas } from '@/hooks/tarefas/useCentralTarefas';
import { useTaskDetail } from '@/hooks/tarefas/useTaskDetail';
import { TaskFiltersBar } from './components/TaskFiltersBar';
import { TaskCard } from './components/TaskCard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TaskEmptyState } from './components/TaskEmptyState';
import { TaskFAB } from './components/TaskFAB';
import CreateTaskModal from '@/components/admin/agenda/CreateTaskModal';
import { ACTIVE_STATUSES } from '@/constants/taskStatus';
import type { TaskWithDetails, TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';
import { useIsMobile } from '@/hooks/use-mobile';

const CentralTarefasPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  const handleConcluir = useCallback(async (taskId: string) => {
    // Abre o drawer para conclusão via governança
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDrawerOpen(true);
    }
  }, [tasks]);

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

  const handleCalendarClick = useCallback(() => {
    navigate('/super_admin/agenda');
  }, [navigate]);

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
          {/* Botão Agenda */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalendarClick}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </Button>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PlayCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.em_andamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.concluidas}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
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

      {/* Grid de Tarefas */}
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
                  isConcluindo={false}
                />
              ))}
            </div>

            {/* Carregar Mais */}
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

            {/* Contador de resultados */}
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
