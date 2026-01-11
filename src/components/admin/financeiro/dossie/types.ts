/**
 * Types for Financial Dossier Module
 */

export interface LancamentoDossie {
  // Dados imutáveis
  id: string;
  origem_id?: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  valor_liquido?: number;
  data: string;
  descricao: string;
  origem: 'asaas' | 'asaas_saida' | 'despesa' | 'assinatura' | 'manual';
  status: string;
  status_original?: string;
  cliente?: string;
  metodo_pagamento?: string;
  
  // Metadados editáveis
  categoria_id?: string;
  categoria_nome?: string;
  subcategoria_id?: string;
  centro_custo_id?: string;
  responsavel_financeiro_id?: string;
  responsavel_operacional_id?: string;
  tags?: string[];
  projeto_cliente?: string;
  
  // Status de conciliação
  conciliado?: boolean;
  conciliado_at?: string;
  conciliado_by?: string;
  
  // Classificações específicas ASAAS
  tipo_receita?: 'fixa' | 'variavel';
  recorrente?: boolean;
}

export interface Comprovante {
  id: string;
  lancamento_id: string;
  lancamento_tipo: 'asaas' | 'asaas_saida' | 'despesa';
  tipo_comprovante: 'nota_fiscal' | 'recibo' | 'comprovante_pix' | 'boleto' | 'contrato' | 'outro';
  arquivo_url: string;
  arquivo_nome?: string;
  arquivo_tamanho_kb?: number;
  observacao?: string;
  uploaded_by?: string;
  uploaded_by_nome?: string;
  created_at: string;
}

export interface Observacao {
  id: string;
  lancamento_id: string;
  lancamento_tipo: 'asaas' | 'asaas_saida' | 'despesa';
  conteudo: string;
  autor_id?: string;
  autor_nome?: string;
  created_at: string;
}

export interface AudioRecord {
  id: string;
  lancamento_id: string;
  lancamento_tipo: 'asaas' | 'asaas_saida' | 'despesa';
  audio_url: string;
  duracao_segundos?: number;
  transcricao?: string;
  transcricao_editada?: string;
  gravado_por?: string;
  gravado_por_nome?: string;
  created_at: string;
}

export interface HistoricoEntry {
  id: string;
  lancamento_id: string;
  lancamento_tipo: 'asaas' | 'asaas_saida' | 'despesa';
  acao: string;
  campo_alterado?: string;
  valor_anterior?: any;
  valor_novo?: any;
  usuario_id?: string;
  usuario_nome?: string;
  ip_address?: string;
  created_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

export interface Subcategoria {
  id: string;
  nome: string;
  categoria_id: string;
}

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo?: string;
}

export type LancamentoTipo = 'asaas' | 'asaas_saida' | 'despesa';
