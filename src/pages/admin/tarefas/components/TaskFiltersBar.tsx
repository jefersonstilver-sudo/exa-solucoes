/**
 * TaskFiltersBar - Barra de filtros da Central de Tarefas
 * Fase 4.3: Filtros horizontais para status, prioridade, departamento e responsável
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { TaskFilterSelect } from './TaskFilterSelect';
import { TASK_STATUS, getAllTaskStatuses, ACTIVE_STATUSES } from '@/constants/taskStatus';
import { TASK_PRIORITY, getAllTaskPriorities } from '@/constants/taskPriority';
import type { TaskStatusCanonical, TaskPriorityCanonical } from '@/types/tarefas';

interface TaskFiltersBarProps {
  // Valores atuais
  statusFilter: TaskStatusCanonical[] | undefined;
  prioridadeFilter: TaskPriorityCanonical[] | undefined;
  departamentoFilter: string | undefined;
  responsavelFilter: string | undefined;
  
  // Callbacks
  onStatusChange: (value: TaskStatusCanonical[] | undefined) => void;
  onPrioridadeChange: (value: TaskPriorityCanonical[] | undefined) => void;
  onDepartamentoChange: (value: string | undefined) => void;
  onResponsavelChange: (value: string | undefined) => void;
  onClearAll: () => void;
  
  // Opções dinâmicas
  departamentos: string[];
  responsaveis: Array<{ id: string; nome: string; email: string }>;
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  statusFilter,
  prioridadeFilter,
  departamentoFilter,
  responsavelFilter,
  onStatusChange,
  onPrioridadeChange,
  onDepartamentoChange,
  onResponsavelChange,
  onClearAll,
  departamentos,
  responsaveis
}) => {
  // Opções de status
  const statusOptions = getAllTaskStatuses().map(status => ({
    value: status,
    label: TASK_STATUS[status].shortLabel,
    icon: TASK_STATUS[status].icon
  }));

  // Opções de prioridade
  const prioridadeOptions = getAllTaskPriorities().map(priority => ({
    value: priority,
    label: TASK_PRIORITY[priority].shortLabel,
    icon: TASK_PRIORITY[priority].icon
  }));

  // Opções de departamento
  const departamentoOptions = departamentos.map(dep => ({
    value: dep,
    label: dep
  }));

  // Opções de responsável
  const responsavelOptions = responsaveis.map(r => ({
    value: r.id,
    label: r.nome
  }));

  // Verificar se há filtros ativos (diferentes do default)
  const hasActiveFilters = 
    (statusFilter && statusFilter.length !== ACTIVE_STATUSES.length) ||
    prioridadeFilter ||
    departamentoFilter ||
    responsavelFilter;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="h-4 w-4" />
          <span className="font-medium text-sm">Filtros</span>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Status (multi-select) */}
        <TaskFilterSelect
          label="Status"
          placeholder="Selecionar status"
          options={statusOptions}
          value={statusFilter}
          onChange={(v) => onStatusChange(v as TaskStatusCanonical[] | undefined)}
          multiple
        />

        {/* Filtro de Prioridade (multi-select) */}
        <TaskFilterSelect
          label="Prioridade"
          placeholder="Selecionar prioridade"
          options={prioridadeOptions}
          value={prioridadeFilter}
          onChange={(v) => onPrioridadeChange(v as TaskPriorityCanonical[] | undefined)}
          multiple
        />

        {/* Filtro de Departamento (single-select) */}
        <TaskFilterSelect
          label="Departamento"
          placeholder="Todos os departamentos"
          options={departamentoOptions}
          value={departamentoFilter}
          onChange={(v) => onDepartamentoChange(v as string | undefined)}
        />

        {/* Filtro de Responsável (single-select) */}
        <TaskFilterSelect
          label="Responsável"
          placeholder="Todos os responsáveis"
          options={responsavelOptions}
          value={responsavelFilter}
          onChange={(v) => onResponsavelChange(v as string | undefined)}
        />
      </div>
    </div>
  );
};

export default TaskFiltersBar;
