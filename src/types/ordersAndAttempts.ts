
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
  video_status?: string;
  correct_status?: string;
  predios_selecionados?: number[];
}

export interface OrdersStats {
  total_orders: number;
  total_attempts: number;
  total_revenue: number;
  conversion_rate: number;
  abandoned_value: number;
}
