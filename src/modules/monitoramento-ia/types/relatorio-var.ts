/**
 * Tipos para o Relatório VAR - EXA
 * Todas as 40+ variáveis mapeadas do template HTML
 */

export interface RelatorioVARData {
  // ========== KPIs Principais ==========
  total_conversas: number;
  total_mensagens: number;
  conversas_ativas: number;
  conversas_resolvidas: number;
  conversas_pendentes: number;
  taxa_resolucao: number; // percentual
  
  // ========== Tempo Médio de Atendimento ==========
  tma_geral: string; // formato "2h 35m"
  tma_primeiro_contato: string;
  tma_resolucao: string;
  
  // ========== Distribuição de Sentimento ==========
  sentimento_positivo: number;
  sentimento_neutro: number;
  sentimento_negativo: number;
  
  // ========== Distribuição por Tipo de Contato ==========
  tipo_novo: number;
  tipo_retorno: number;
  tipo_vip: number;
  tipo_problema: number;
  
  // ========== Evolução 30 Dias ==========
  evolucao_30d: {
    data: string; // formato "DD/MM"
    conversas: number;
    mensagens: number;
    tma_segundos: number;
  }[];
  
  // ========== Heatmap de Dias da Semana ==========
  heatmap_weekday: {
    dia: string; // "Segunda", "Terça", etc.
    horario: string; // "00:00", "01:00", etc.
    intensidade: number; // 0-100
    conversas: number;
  }[];
  
  // ========== Hot Leads ==========
  hot_leads: {
    id: string;
    nome: string;
    telefone: string;
    score: number;
    ultima_interacao: string;
    motivo: string;
    tags: string[];
  }[];
  
  // ========== Lista de Conversas Recentes ==========
  conversas_recentes: {
    id: string;
    contato_nome: string;
    telefone: string;
    status: 'ativa' | 'resolvida' | 'pendente';
    sentimento: 'positivo' | 'neutro' | 'negativo';
    ultima_msg: string;
    timestamp: string;
    total_msgs: number;
  }[];
  
  // ========== Comparativo Período Anterior ==========
  comparativo: {
    conversas_variacao: number; // percentual
    mensagens_variacao: number;
    tma_variacao: number;
    resolucao_variacao: number;
  };
  
  // ========== Análise IA ==========
  ia_insights: {
    resumo_executivo: string;
    padroes_detectados: string[];
    anomalias: string[];
    recomendacoes: string[];
    sentimento_geral: 'positivo' | 'neutro' | 'negativo';
    score_qualidade: number; // 0-100
  };
  
  // ========== Metadata ==========
  periodo: {
    inicio: string;
    fim: string;
    dias_uteis: number;
    total_dias: number;
  };
  
  gerado_em: string;
  gerado_por: string;
}

export interface RelatorioVARConfig {
  id?: string;
  frequencia: 'diario' | 'semanal' | 'mensal';
  horario: string; // formato "HH:00"
  dias_semana: string[]; // ['seg', 'ter', 'qua', 'qui', 'sex']
  template_tipo: 'texto' | 'html';
  template_conteudo: string;
  diretores_ids: string[];
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RelatorioVARRequest {
  periodo_tipo?: 'hoje' | 'ontem' | 'ultimos-7' | 'ultimos-15' | 'ultimos-30' | 'mes-atual' | 'mes-anterior' | 'personalizado';
  data_inicio?: string;
  data_fim?: string;
  formato_envio?: 'whatsapp' | 'email';
  diretores_ids: string[];
  agent_key?: string;
}

export interface RelatorioVARResponse {
  success: boolean;
  data?: RelatorioVARData;
  report_id?: string;
  sent_to?: string[];
  error?: string;
}
