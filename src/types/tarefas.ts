// Tipos para Central de Tarefas sincronizada com Notion

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

// Mapeamento de cores por prioridade
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

// Mapeamento de origens para navegação
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
