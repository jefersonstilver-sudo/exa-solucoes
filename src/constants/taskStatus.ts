/**
 * MÁQUINA DE ESTADOS DE TAREFAS v1.0
 * 
 * Este arquivo é a ÚNICA FONTE DE VERDADE para status de tarefas.
 * 
 * REGRAS:
 * 1. Nenhum novo status pode ser criado no frontend sem existir aqui
 * 2. Nenhum componente deve ter labels/cores hardcoded - use este mapper
 * 3. O ENUM `task_status` no banco DEVE refletir exatamente esses valores
 */

import type { TaskStatusCanonical } from '@/types/tarefas';

// ============================================================================
// TIPOS
// ============================================================================

export interface TaskStatusConfig {
  label: string;
  shortLabel: string;
  icon: string;
  className: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  /** Se o status é final (não pode mais mudar) */
  isFinal: boolean;
  /** Ordem no fluxo */
  order: number;
}

// ============================================================================
// MAPPER CENTRAL - ÚNICA FONTE DE VERDADE
// ============================================================================

export const TASK_STATUS: Record<TaskStatusCanonical, TaskStatusConfig> = {
  // ⏳ PENDENTE (Aguardando início)
  pendente: {
    label: 'Pendente',
    shortLabel: 'Pendente',
    icon: '⏳',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'Tarefa aguardando início',
    isFinal: false,
    order: 1
  },

  // 🔄 EM ANDAMENTO (Trabalho em progresso)
  em_andamento: {
    label: 'Em Andamento',
    shortLabel: 'Andamento',
    icon: '🔄',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    description: 'Tarefa em execução',
    isFinal: false,
    order: 2
  },

  // ⏸️ AGUARDANDO APROVAÇÃO (Pendente validação)
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação',
    shortLabel: 'Ag. Aprovação',
    icon: '⏸️',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    description: 'Aguardando validação de um gestor',
    isFinal: false,
    order: 3
  },

  // 📦 AGUARDANDO INSUMO (Dependência externa)
  aguardando_insumo: {
    label: 'Aguardando Insumo',
    shortLabel: 'Ag. Insumo',
    icon: '📦',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    description: 'Aguardando recurso ou informação externa',
    isFinal: false,
    order: 4
  },

  // ✅ CONCLUÍDA (Finalizada com sucesso)
  concluida: {
    label: 'Concluída',
    shortLabel: 'Concluída',
    icon: '✅',
    className: 'bg-green-100 text-green-700 border-green-200',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    description: 'Tarefa concluída com sucesso',
    isFinal: true,
    order: 5
  },

  // ❌ NÃO REALIZADA (Não foi possível executar)
  nao_realizada: {
    label: 'Não Realizada',
    shortLabel: 'Não Realizada',
    icon: '❌',
    className: 'bg-red-100 text-red-700 border-red-200',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    description: 'Tarefa não foi possível realizar',
    isFinal: true,
    order: 6
  },

  // 🚫 CANCELADA (Cancelada manualmente)
  cancelada: {
    label: 'Cancelada',
    shortLabel: 'Cancelada',
    icon: '🚫',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    description: 'Tarefa cancelada',
    isFinal: true,
    order: 7
  }
};

// ============================================================================
// FUNÇÕES HELPER
// ============================================================================

/**
 * Obtém a configuração de status.
 * Se o status não for canônico, retorna configuração fallback.
 */
export const getTaskStatusConfig = (status: string): TaskStatusConfig => {
  const config = TASK_STATUS[status as TaskStatusCanonical];
  
  if (config) {
    return config;
  }
  
  // Fallback para status desconhecido
  console.warn(`[TASK_STATUS] Status não canônico detectado: "${status}".`);
  
  return {
    label: status || 'Desconhecido',
    shortLabel: status || '???',
    icon: '❓',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'Status não mapeado',
    isFinal: false,
    order: 99
  };
};

/**
 * Obtém label formatada do status
 */
export const getTaskStatusLabel = (status: string): string => {
  return getTaskStatusConfig(status).label;
};

/**
 * Obtém ícone do status
 */
export const getTaskStatusIcon = (status: string): string => {
  return getTaskStatusConfig(status).icon;
};

/**
 * Obtém className do status (para Badge)
 */
export const getTaskStatusClassName = (status: string): string => {
  return getTaskStatusConfig(status).className;
};

/**
 * Verifica se um status é canônico (válido)
 */
export const isCanonicalTaskStatus = (status: string): status is TaskStatusCanonical => {
  return status in TASK_STATUS;
};

/**
 * Verifica se um status é final
 */
export const isTaskStatusFinal = (status: string): boolean => {
  return getTaskStatusConfig(status).isFinal;
};

/**
 * Lista todos os status canônicos
 */
export const getAllTaskStatuses = (): TaskStatusCanonical[] => {
  return Object.keys(TASK_STATUS) as TaskStatusCanonical[];
};

/**
 * Status que permitem ação de conclusão
 */
export const COMPLETABLE_STATUSES: TaskStatusCanonical[] = [
  'pendente',
  'em_andamento',
  'aguardando_insumo'
];

/**
 * Status finais (não podem ser alterados)
 */
export const FINAL_STATUSES: TaskStatusCanonical[] = [
  'concluida',
  'nao_realizada',
  'cancelada'
];

/**
 * Status ativos (contam como pendentes)
 */
export const ACTIVE_STATUSES: TaskStatusCanonical[] = [
  'pendente',
  'em_andamento',
  'aguardando_aprovacao',
  'aguardando_insumo'
];
