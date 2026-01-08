// Tipos para o CRM Unificado - FASE 2

export type FunilStatus = 'lead' | 'oportunidade' | 'cliente' | 'churn';

export interface ClientCRM {
  id: string;
  nome: string;
  sobrenome?: string;
  empresa?: string;
  telefone?: string;
  email?: string;
  categoria?: string;
  funil_status: FunilStatus;
  temperatura?: string;
  pontuacao?: number;
  origem?: string;
  responsavel_id?: string;
  conversation_id?: string;
  created_at: string;
  updated_at?: string;
  last_interaction_at?: string;
  // Campos adicionais
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface FunilColumn {
  id: FunilStatus;
  title: string;
  color: string;
  bgColor: string;
  count: number;
}

export const FUNIL_COLUMNS: FunilColumn[] = [
  { id: 'lead', title: 'Lead', color: '#3B82F6', bgColor: 'bg-blue-500/10', count: 0 },
  { id: 'oportunidade', title: 'Oportunidade', color: '#F59E0B', bgColor: 'bg-amber-500/10', count: 0 },
  { id: 'cliente', title: 'Cliente', color: '#10B981', bgColor: 'bg-emerald-500/10', count: 0 },
  { id: 'churn', title: 'Churn', color: '#EF4444', bgColor: 'bg-red-500/10', count: 0 },
];

export interface CRMHubFilters {
  funilStatus?: FunilStatus;
  categoria?: string;
  responsavelId?: string;
  temperatura?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CRMHubMetrics {
  totalContatos: number;
  leads: number;
  oportunidades: number;
  clientes: number;
  churn: number;
  conversaoRate: number;
}
