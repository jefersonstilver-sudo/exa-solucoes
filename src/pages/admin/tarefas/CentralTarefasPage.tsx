/**
 * CentralTarefasPage - Página Central de Tarefas
 * Fase 4.3: Listagem completa com filtros, reutilizando TaskCard e TaskDetailDrawer
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw, ListTodo, Clock, PlayCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCentralTarefas } from '@/hooks/tarefas/useCentralTarefas';
import { useTaskDetail } from '@/hooks/tarefas/useTaskDetail';
import { TaskFiltersBar } from './components/TaskFiltersBar';
import { TaskCard } from './components/TaskCard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { ACTIVE_STATUSES } from '@/constants/taskStatus';
import type { TaskWithDetails, TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';

const CentralTarefasPage: React.FC = () => {
  // Estado dos filtros
  const [statusFilter, setStatusFilter] = useState<TaskStatusCanonical[] | undefined>(
    [...ACTIVE_STATUSES] // Default: status ativos
  );
  const [prioridadeFilter, setPrioridadeFilter] = useState<TaskPriorityCanonical[] | undefined>();
  const [departamentoFilter, setDepartamentoFilter] = useState<string | undefined>();
  const [responsavelFilter, setResponsavelFilter] = useState<string | undefined>();
  const [offset, setOffset] = useState(0);

  // Estado do drawer
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Determinar categoria visual para cada tarefa
  const getTaskCategory = (task: TaskWithDetails): 'urgente' | 'importante' | 'rotina' => {
    if (task.prioridade === 'emergencia' || task.prioridade === 'alta') return 'urgente';
    if (task.prioridade === 'media') return 'importante';
    return 'rotina';
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Tarefas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visualize e gerencie todas as tarefas do sistema
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ListTodo className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <PlayCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.em_andamento}</p>
              <p className="text-xs text-gray-500">Em Andamento</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
              <p className="text-xs text-gray-500">Concluídas</p>
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
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <ListTodo className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-sm text-gray-500">
              Tente ajustar os filtros para ver mais resultados
            </p>
          </div>
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
            <p className="text-center text-xs text-gray-400 pt-2">
              Exibindo {tasks.length} de {stats.total} tarefas
            </p>
          </>
        )}
      </div>

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
