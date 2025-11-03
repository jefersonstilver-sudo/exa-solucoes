
export interface Coupon {
  id: string;
  codigo: string;
  desconto_percentual: number;
  ativo: boolean;
  max_usos: number;
  min_meses: number;
  usos_atuais: number;
  created_at: string;
  created_by?: string;
  expira_em?: string;
  descricao?: string;
  tipo_desconto: 'percentual' | 'valor_fixo';
  valor_minimo_pedido?: number;
  uso_por_usuario?: number;
  data_inicio?: string;
  categoria: string;
}

export interface CouponStats {
  total_cupons: number;
  cupons_ativos: number;
  cupons_expirados: number;
  total_usos: number;
  receita_com_desconto: number;
}

export interface CouponUsageDetail {
  user_email: string;
  user_telefone: string;
  pedido_id: string;
  valor_pedido: number;
  valor_desconto: number;
  plano_meses: number;
  lista_predios: string[];
  data_uso: string;
}

export interface CreateCouponData {
  codigo: string; // Mudou de opcional para obrigatório
  desconto_percentual: number;
  max_usos: number;
  min_meses: number;
  expira_em?: string;
  descricao?: string;
  tipo_desconto: 'percentual' | 'valor_fixo';
  valor_minimo_pedido?: number;
  uso_por_usuario?: number;
  categoria: string;
  ativo: boolean;
}

export interface CouponFilters {
  status: 'all' | 'active' | 'inactive' | 'expired';
  categoria: string;
  searchTerm: string;
}
