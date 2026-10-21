/**
 * mensal_fixo: desconto_percentual guarda o VALOR EM REAIS cobrado por mês
 * durante todo o contrato (ex.: EXA5MES = R$ 5,00/mês).
 */
export type CouponDiscountType = 'percentual' | 'valor_fixo' | 'preco_final' | 'mensal_fixo';

export const formatCouponDiscount = (c: { tipo_desconto?: string | null; desconto_percentual: number }): string => {
  const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
  switch (c.tipo_desconto) {
    case 'valor_fixo': return `${brl(c.desconto_percentual)} OFF`;
    case 'preco_final': return `Preço final ${brl(c.desconto_percentual)}`;
    case 'mensal_fixo': return `${brl(c.desconto_percentual)} por mês`;
    default: return `${c.desconto_percentual}% OFF`;
  }
};

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
  tipo_desconto: CouponDiscountType;
  valor_minimo_pedido?: number;
  uso_por_usuario?: number;
  data_inicio?: string;
  categoria: 'geral' | 'especial' | 'primeiro_pedido' | 'fidelidade' | 'promocional' | 'parceiro' | 'cortesia';
  min_predios?: number;
  max_predios?: number;
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
  pedido_id: string | null;
  valor_pedido: number;
  valor_desconto: number;
  plano_meses: number | null;
  lista_predios: string[] | null;
  data_uso: string;
  status_compra: string;
}

export interface CreateCouponData {
  codigo: string; // Mudou de opcional para obrigatório
  desconto_percentual: number;
  max_usos: number;
  min_meses: number;
  expira_em?: string;
  descricao?: string;
  tipo_desconto: CouponDiscountType;
  valor_minimo_pedido?: number;
  uso_por_usuario?: number;
  categoria: 'geral' | 'especial' | 'primeiro_pedido' | 'fidelidade' | 'promocional' | 'parceiro' | 'cortesia';
  ativo: boolean;
  min_predios?: number;
  max_predios?: number;
}

export interface CouponFilters {
  status: 'all' | 'active' | 'inactive' | 'expired';
  categoria: string;
  searchTerm: string;
}
