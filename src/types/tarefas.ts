// Tipos Canônicos para Sistema de Tarefas v3.0
// Baseado nas tabelas: tasks, task_responsaveis, task_checklist_items, task_status_log

// ============================================================================
// ENUMs CANÔNICOS (devem refletir exatamente os ENUMs do banco)
// ============================================================================

export type TaskStatusCanonical = 
  | 'pendente'
  | 'em_andamento'
  | 'aguardando_aprovacao'
  | 'aguardando_insumo'
  | 'concluida'
  | 'nao_realizada'
  | 'cancelada';

export type TaskPriorityCanonical = 
  | 'emergencia'
  | 'alta'
  | 'media'
  | 'baixa';

export type TaskOriginCanonical = 
  | 'manual'
  | 'rotina'
  | 'sistema'
  | 'crm'
  | 'financeiro'
  | 'operacao'
  | 'notion'
  | 'alerta'
  | 'ia';

// ============================================================================
// INTERFACES DO NOVO SISTEMA
// ============================================================================

export interface Task {
  id: string;
  task_type_id: string | null;
  rotina_id: string | null;
  origem_id: string | null;
  cliente_id: string | null;
  titulo: string;
  descricao: string | null;
  prioridade: TaskPriorityCanonical;
  status: TaskStatusCanonical;
  origem: TaskOriginCanonical;
  data_prevista: string | null;
  horario_limite: string | null;
  data_conclusao: string | null;
  concluida_por: string | null;
  motivo_nao_realizada: string | null;
  todos_responsaveis: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskType {
  id: string;
  codigo: string;
  nome: string;
  departamento: string;
  descricao: string | null;
  prioridade_padrao: TaskPriorityCanonical;
  ativo: boolean;
  created_at: string;
}

export interface TaskResponsavel {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
  // Campos do JOIN com users
  user_nome?: string;
  user_email?: string;
  user_avatar?: string;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  descricao: string;
  obrigatorio: boolean;
  concluido: boolean;
  concluido_por: string | null;
  concluido_em: string | null;
  ordem: number;
  created_at: string;
}

export interface TaskStatusLog {
  id: string;
  task_id: string;
  status_anterior: TaskStatusCanonical | null;
  status_novo: TaskStatusCanonical;
  alterado_por: string | null;
  motivo: string | null;
  created_at: string;
  // Campo do JOIN com users
  alterado_por_nome?: string;
}

// ============================================================================
// INTERFACES COMPOSTAS (para UI)
// ============================================================================

export interface TaskWithDetails extends Task {
  // JOIN com task_types
  task_type?: TaskType | null;
  departamento?: string | null;
  
  // JOIN com task_responsaveis + users
  responsaveis?: TaskResponsavel[];
  
  // JOIN com task_checklist_items
  checklist?: TaskChecklistItem[];
  checklist_total?: number;
  checklist_concluidos?: number;
}

export interface MinhaManhaDadosV2 {
  urgentes: TaskWithDetails[];
  importantes: TaskWithDetails[];
  rotina: TaskWithDetails[];
  estatisticas: {
    total: number;
    urgentes: number;
    importantes: number;
    rotina: number;
    atrasadas: number;
    hoje: number;
    concluidas_hoje: number;
  };
}

// ============================================================================
// TIPOS AUXILIARES (para componentes)
// ============================================================================

export type TaskCategory = 'urgente' | 'importante' | 'rotina';

export interface TaskFilters {
  status?: TaskStatusCanonical[];
  prioridade?: TaskPriorityCanonical[];
  departamento?: string;
  responsavel_id?: string;
  data_inicio?: string;
  data_fim?: string;
  apenas_minhas?: boolean;
}

// ============================================================================
// LEGADO - MANTER PARA COMPATIBILIDADE TEMPORÁRIA
// ============================================================================

export type OrigemTarefa = 
  | 'crm' 
  | 'proposta' 
  | 'venda' 
  | 'contrato' 
  | 'financeiro' 
  | 'campanha' 
  | 'operacao'
  | 'manual';

export type PrioridadeTarefa = 'Alta' | 'Média' | 'Baixa';

export type StatusTarefa = 
  | 'aberta' 
  | 'em_andamento' 
  | 'concluida' 
  | 'bloqueada'
  | 'NÃO REALIZADO'
  | 'REALIZADO'
  | 'Concluído';

/** @deprecated Usar TaskWithDetails do novo sistema */
export interface TarefaSistema {
  id: string;
  origem: OrigemTarefa;
  origem_id?: string | null;
  titulo: string;
  descricao?: string | null;
  prioridade: PrioridadeTarefa | string | null;
  status: StatusTarefa | string | null;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  responsavel_avatar?: string | null;
  data_criacao: string;
  prazo?: string | null;
  notion_task_id?: string | null;
  notion_url?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  categoria?: string | null;
  link_contexto?: string | null;
}

/** @deprecated Usar TaskWithDetails do novo sistema */
export interface TarefaNotionExistente {
  id: string;
  nome: string;
  prioridade: string | null;
  status: string | null;
  responsavel: string | null;
  responsavel_avatar: string | null;
  data: string | null;
  finalizado_por: string | null;
  categoria: string | null;
  notion_url: string | null;
  created_at: string;
  updated_at: string;
  descricao?: string | null;
}

/** @deprecated Usar MinhaManhaDadosV2 */
export interface MinhaManhaDados {
  urgentes: TarefaNotionExistente[];
  importantes: TarefaNotionExistente[];
  rotina: TarefaNotionExistente[];
  estatisticas: {
    total: number;
    urgentes: number;
    importantes: number;
    rotina: number;
    atrasadas: number;
    hoje: number;
    concluidas_hoje: number;
  };
}

// Mapeamento de cores por prioridade (legado)
export const PRIORIDADE_CONFIG = {
  'Alta': { 
    cor: 'bg-red-50 border-red-200 text-red-700',
    icone: '🔴',
    label: 'URGENTE'
  },
  'Média': { 
    cor: 'bg-amber-50 border-amber-200 text-amber-700',
    icone: '🟡',
    label: 'IMPORTANTE'
  },
  'Baixa': { 
    cor: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    icone: '🟢',
    label: 'ROTINA'
  },
} as const;

// Mapeamento de origens para navegação (legado)
export const ORIGEM_LINKS: Record<OrigemTarefa, string> = {
  crm: '/admin/crm-hub',
  proposta: '/admin/propostas',
  venda: '/admin/vendas',
  contrato: '/admin/juridico',
  financeiro: '/admin/financeiro',
  campanha: '/admin/campanhas',
  operacao: '/admin/operacao',
  manual: '/admin/agenda',
};

export const ORIGEM_LABELS: Record<OrigemTarefa, string> = {
  crm: 'CRM',
  proposta: 'Propostas',
  venda: 'Vendas',
  contrato: 'Jurídico',
  financeiro: 'Financeiro',
  campanha: 'Campanhas',
  operacao: 'Operação',
  manual: 'Manual',
};
