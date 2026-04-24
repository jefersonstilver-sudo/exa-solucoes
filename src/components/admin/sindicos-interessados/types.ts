
export interface SindicoInteressado {
  id: string;
  nome_completo: string;
  nome_predio: string;
  endereco: string;
  numero_andares: number;
  numero_unidades: number;
  elevadores_sociais?: number;
  elevadores_servico?: number;
  email: string;
  celular: string;
  observacoes?: string;
  status: string;
  data_contato?: string;
  created_at: string;
  updated_at: string;
  tipo_predio?: 'residencial' | 'comercial' | null;
  permite_airbnb?: 'sim' | 'nao' | null;
  whatsapp_verificado?: boolean | null;
  whatsapp_verificado_em?: string | null;
  whatsapp_verification_session_id?: string | null;
}

export interface SindicosStats {
  total: number;
  novos: number;
  contatados: number;
  interessados: number;
  instalados: number;
}
