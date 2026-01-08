// =====================================================
// FASE 2: Tipos para a nova arquitetura de Vendas
// =====================================================

export type StatusVenda = 'em_negociacao' | 'ganha' | 'perdida';
export type StatusCampanhaOperacional = 'aguardando_contrato' | 'aguardando_video' | 'em_revisao' | 'ativa' | 'pausada' | 'encerrada';
export type TipoAssinatura = 'avista' | 'fidelidade';
export type StatusAssinatura = 'ativa' | 'suspensa' | 'cancelada';

// Entidade principal: VENDA
export interface Venda {
  id: string;
  client_id: string;
  proposta_id?: string | null;
  pedido_id?: string | null;
  valor_total: number;
  plano_meses: number;
  cupom_id?: string | null;
  status_venda: StatusVenda;
  responsavel_id?: string | null;
  data_fechamento?: string | null;
  created_at: string;
  updated_at: string;
}

// Campanha operacional (mídia)
export interface CampanhaExa {
  id: string;
  venda_id?: string | null;
  pedido_id?: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  lista_predios: string[];
  lista_paineis: string[];
  status_operacional: StatusCampanhaOperacional;
  created_at: string;
  updated_at: string;
}

// Assinatura (placeholder - sem financeiro)
export interface Assinatura {
  id: string;
  venda_id?: string | null;
  pedido_id?: string | null;
  tipo: TipoAssinatura;
  status: StatusAssinatura;
  dia_vencimento?: number | null;
  metodo_pagamento?: string | null;
  created_at: string;
  updated_at: string;
}

// Venda com dados relacionados para exibição
export interface VendaComDetalhes extends Venda {
  // Cliente
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  
  // Contrato (via contratos_legais)
  contrato_status?: string;
  contrato_clicksign_key?: string;
  
  // Campanha (via campanhas_exa)
  campanha_status?: StatusCampanhaOperacional;
  campanha_periodo_inicio?: string;
  campanha_periodo_fim?: string;
  
  // Assinatura
  assinatura_status?: StatusAssinatura;
  assinatura_tipo?: TipoAssinatura;
}

// Filtros para a página de vendas
export interface VendasFilters {
  status_venda?: StatusVenda | 'todas';
  responsavel_id?: string;
  search?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Métricas do dashboard de vendas
export interface VendasMetrics {
  total: number;
  em_negociacao: number;
  ganhas: number;
  perdidas: number;
  valor_total_ganhas: number;
  taxa_conversao: number;
}

// Payload para criar/atualizar venda
export interface VendaPayload {
  client_id: string;
  proposta_id?: string;
  valor_total: number;
  plano_meses: number;
  cupom_id?: string;
  status_venda?: StatusVenda;
  responsavel_id?: string;
}
