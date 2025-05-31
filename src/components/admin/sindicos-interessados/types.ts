
export interface SindicoInteressado {
  id: string;
  nome_completo: string;
  nome_predio: string;
  endereco: string;
  numero_andares: number;
  numero_unidades: number;
  email: string;
  celular: string;
  observacoes?: string;
  status: string;
  data_contato?: string;
  created_at: string;
  updated_at: string;
}

export interface SindicosStats {
  total: number;
  novos: number;
  contatados: number;
  interessados: number;
  instalados: number;
}
