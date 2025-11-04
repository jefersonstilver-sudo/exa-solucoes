
export interface OrderOrAttempt {
  id: string;
  type: 'order' | 'attempt';
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis?: string[];
  plano_meses?: number;
  data_inicio?: string;
  data_fim?: string;
  client_id?: string;
  client_email?: string;
  client_name?: string;
  client_phone?: string;
  client_cpf?: string;
  video_status?: string;
  correct_status?: string;
  predios_selecionados?: number[];
  selected_buildings?: Array<{
    nome: string;
    endereco: string;
    bairro: string;
  }>;
  cupom_id?: string;
  coupon_code?: string;
}

export interface OrdersStats {
  total_orders: number;
  total_attempts: number;
  total_revenue: number;
  conversion_rate: number;
  abandoned_value: number;
}
