/**
 * CONFIGURAÇÃO DE PRIORIDADES DE TAREFAS v1.0
 * 
 * Este arquivo é a ÚNICA FONTE DE VERDADE para prioridades de tarefas.
 * 
 * REGRAS:
 * 1. Nenhuma nova prioridade pode ser criada no frontend sem existir aqui
 * 2. Nenhum componente deve ter labels/cores hardcoded - use este mapper
 * 3. O ENUM `task_prioridade` no banco DEVE refletir exatamente esses valores
 */

import type { TaskPriorityCanonical } from '@/types/tarefas';

// ============================================================================
// TIPOS
// ============================================================================

export interface TaskPriorityConfig {
  label: string;
  shortLabel: string;
  icon: string;
  emoji: string;
  className: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  /** Cor da borda esquerda do card */
  borderLeftColor: string;
  /** Cor de fundo do header de seção */
  sectionHeaderBg: string;
  sectionHeaderText: string;
  /** Ordem para sorting (menor = mais urgente) */
  sortOrder: number;
  /** Para qual categoria UI essa prioridade mapeia */
  category: 'urgente' | 'importante' | 'rotina';
}

// ============================================================================
// MAPPER CENTRAL - ÚNICA FONTE DE VERDADE
// ============================================================================

export const TASK_PRIORITY: Record<TaskPriorityCanonical, TaskPriorityConfig> = {
  // 🚨 EMERGÊNCIA (Crítico, drop everything)
  emergencia: {
    label: 'Emergência',
    shortLabel: 'EMERGÊNCIA',
    icon: '🚨',
    emoji: '🔴',
    className: 'bg-red-600 text-white border-red-600',
    textColor: 'text-white',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-600',
    borderLeftColor: 'border-l-red-600',
    sectionHeaderBg: 'bg-red-100',
    sectionHeaderText: 'text-red-900',
    sortOrder: 1,
    category: 'urgente'
  },

  // 🔴 ALTA (Urgente, fazer hoje)
  alta: {
    label: 'Alta',
    shortLabel: 'ALTA',
    icon: '🔴',
    emoji: '🔴',
    className: 'bg-red-100 text-red-700 border-red-200',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    borderLeftColor: 'border-l-red-400',
    sectionHeaderBg: 'bg-red-50',
    sectionHeaderText: 'text-red-900',
    sortOrder: 2,
    category: 'urgente'
  },

  // 🟡 MÉDIA (Importante, esta semana)
  media: {
    label: 'Média',
    shortLabel: 'MÉDIA',
    icon: '🟡',
    emoji: '🟡',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    borderLeftColor: 'border-l-amber-500',
    sectionHeaderBg: 'bg-amber-50',
    sectionHeaderText: 'text-amber-900',
    sortOrder: 3,
    category: 'importante'
  },

  // 🟢 BAIXA (Rotina, quando possível)
  baixa: {
    label: 'Baixa',
    shortLabel: 'BAIXA',
    icon: '🟢',
    emoji: '🟢',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    borderLeftColor: 'border-l-emerald-500',
    sectionHeaderBg: 'bg-emerald-50',
    sectionHeaderText: 'text-emerald-900',
    sortOrder: 4,
    category: 'rotina'
  }
};

// ============================================================================
// FUNÇÕES HELPER
// ============================================================================

/**
 * Obtém a configuração de prioridade.
 * Se a prioridade não for canônica, retorna configuração fallback.
 */
export const getTaskPriorityConfig = (priority: string): TaskPriorityConfig => {
  const config = TASK_PRIORITY[priority as TaskPriorityCanonical];
  
  if (config) {
    return config;
  }
  
  // Fallback para prioridade desconhecida
  console.warn(`[TASK_PRIORITY] Prioridade não canônica detectada: "${priority}".`);
  
  return {
    label: priority || 'Desconhecida',
    shortLabel: priority || '???',
    icon: '❓',
    emoji: '⚪',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    borderLeftColor: 'border-l-gray-400',
    sectionHeaderBg: 'bg-gray-50',
    sectionHeaderText: 'text-gray-900',
    sortOrder: 99,
    category: 'rotina'
  };
};

/**
 * Obtém label formatada da prioridade
 */
export const getTaskPriorityLabel = (priority: string): string => {
  return getTaskPriorityConfig(priority).label;
};

/**
 * Obtém ícone/emoji da prioridade
 */
export const getTaskPriorityIcon = (priority: string): string => {
  return getTaskPriorityConfig(priority).icon;
};

/**
 * Obtém className da prioridade (para Badge)
 */
export const getTaskPriorityClassName = (priority: string): string => {
  return getTaskPriorityConfig(priority).className;
};

/**
 * Verifica se uma prioridade é canônica (válida)
 */
export const isCanonicalTaskPriority = (priority: string): priority is TaskPriorityCanonical => {
  return priority in TASK_PRIORITY;
};

/**
 * Lista todas as prioridades canônicas ordenadas
 */
export const getAllTaskPriorities = (): TaskPriorityCanonical[] => {
  return Object.entries(TASK_PRIORITY)
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([key]) => key as TaskPriorityCanonical);
};

/**
 * Compara duas prioridades para sorting
 */
export const comparePriorities = (a: string, b: string): number => {
  const configA = getTaskPriorityConfig(a);
  const configB = getTaskPriorityConfig(b);
  return configA.sortOrder - configB.sortOrder;
};

/**
 * Obtém a categoria UI baseada na prioridade
 */
export const getPriorityCategory = (priority: string): 'urgente' | 'importante' | 'rotina' => {
  return getTaskPriorityConfig(priority).category;
};

/**
 * Prioridades que mapeiam para "urgente"
 */
export const URGENT_PRIORITIES: TaskPriorityCanonical[] = ['emergencia', 'alta'];

/**
 * Prioridades que mapeiam para "importante"
 */
export const IMPORTANT_PRIORITIES: TaskPriorityCanonical[] = ['media'];

/**
 * Prioridades que mapeiam para "rotina"
 */
export const ROUTINE_PRIORITIES: TaskPriorityCanonical[] = ['baixa'];
