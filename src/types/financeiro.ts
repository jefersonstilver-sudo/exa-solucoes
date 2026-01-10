// =====================================================
// FASE 3: Tipos para o Módulo Financeiro Executivo
// =====================================================

// Status de cobrança
export type StatusCobranca = 'pendente' | 'pago' | 'vencido' | 'cancelado';

// Métodos de pagamento
export type MetodoPagamento = 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'dinheiro';

// Origem do recebimento
export type OrigemRecebimento = 'manual' | 'mp' | 'asaas' | 'stripe';

// Periodicidade de despesa fixa
export type Periodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual';

// =====================================================
// ENTIDADES
// =====================================================

// Cobrança (receita esperada)
export interface Cobranca {
  id: string;
  assinatura_id?: string | null;
  client_id?: string | null;
  competencia: string; // YYYY-MM
  valor: number;
  data_vencimento: string;
  data_emissao?: string | null;
  status: StatusCobranca;
  dias_atraso: number;
  observacao?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  cliente_nome?: string;
  cliente_email?: string;
}

// Recebimento (receita realizada)
export interface Recebimento {
  id: string;
  cobranca_id?: string | null;
  client_id?: string | null;
  valor_pago: number;
  data_pagamento: string;
  metodo: MetodoPagamento;
  origem: OrigemRecebimento;
  comprovante_url?: string | null;
  observacao?: string | null;
  registrado_por?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  cliente_nome?: string;
}

// Despesa Fixa
export interface DespesaFixa {
  id: string;
  descricao: string;
  valor: number;
  periodicidade: Periodicidade;
  categoria: string;
  dia_vencimento: number;
  ativo: boolean;
  observacao?: string | null;
  created_at: string;
  updated_at: string;
}

// Despesa Variável
export interface DespesaVariavel {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  pago: boolean;
  data_pagamento?: string | null;
  comprovante_url?: string | null;
  observacao?: string | null;
  registrado_por?: string | null;
  created_at: string;
  updated_at: string;
}

// Imposto
export interface Imposto {
  id: string;
  competencia: string; // YYYY-MM
  tipo: string;
  percentual: number;
  base_calculo: number;
  valor_estimado: number;
  valor_pago: number;
  data_vencimento?: string | null;
  pago: boolean;
  data_pagamento?: string | null;
  observacao?: string | null;
  created_at: string;
  updated_at: string;
}

// Categoria de Despesa
export interface CategoriaDespesa {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel' | 'ambos';
  cor: string;
  icone: string;
  ativo: boolean;
  created_at: string;
}

// =====================================================
// MÉTRICAS E DASHBOARD
// =====================================================

// Métricas do Dashboard Financeiro
export interface MetricasFinanceiras {
  // Receitas
  receita_esperada: number;
  receita_realizada: number;
  receita_pendente: number;
  
  // Inadimplência
  inadimplencia_total: number;
  inadimplencia_count: number;
  inadimplencia_percentual: number;
  
  // Despesas
  despesas_fixas_mes: number;
  despesas_variaveis_mes: number;
  despesas_total: number;
  
  // Impostos (calculados no backend)
  impostos_estimados: number;
  impostos_pagos: number;
  impostos_pendentes: number;
  impostos_mes: number; // Total de impostos do mês
  
  // Custos operacionais
  custos_operacionais_mes: number;
  
  // Resultado líquido (calculado no backend)
  resultado_liquido_mes: number;
  
  // Fluxo de Caixa
  saldo_atual: number;
  saldo_projetado_30d: number;
  
  // Indicadores
  margem_liquida: number;
  taxa_inadimplencia: number;
  
  // Mês anterior (para comparação)
  mes_anterior?: {
    receita: number;
    impostos: number;
    custos_operacionais: number;
    despesas_fixas: number;
    despesas_variaveis: number;
    resultado: number;
  };
}

// Cliente Inadimplente
export interface ClienteInadimplente {
  client_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string;
  total_devido: number;
  dias_atraso_max: number;
  cobrancas_vencidas: number;
  ultima_cobranca: string;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acao_recomendada: string;
}

// Fluxo de Caixa Projetado
export interface FluxoCaixaItem {
  data: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  status: 'realizado' | 'projetado';
}

// =====================================================
// FILTROS
// =====================================================

export interface FiltrosFinanceiros {
  competencia?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: StatusCobranca;
  categoria?: string;
}

// =====================================================
// PAYLOADS
// =====================================================

export interface CobrancaPayload {
  assinatura_id?: string;
  client_id: string;
  competencia: string;
  valor: number;
  data_vencimento: string;
  observacao?: string;
}

export interface RecebimentoPayload {
  cobranca_id?: string;
  client_id?: string;
  valor_pago: number;
  data_pagamento: string;
  metodo: MetodoPagamento;
  origem?: OrigemRecebimento;
  observacao?: string;
}

export interface DespesaFixaPayload {
  descricao: string;
  valor: number;
  periodicidade: Periodicidade;
  categoria: string;
  dia_vencimento?: number;
  observacao?: string;
}

export interface DespesaVariavelPayload {
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  pago?: boolean;
  observacao?: string;
}

export interface ImpostoPayload {
  competencia: string;
  tipo: string;
  percentual: number;
  base_calculo: number;
  valor_estimado: number;
  data_vencimento?: string;
  observacao?: string;
}
