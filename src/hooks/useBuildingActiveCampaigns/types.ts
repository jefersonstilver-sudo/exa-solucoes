
export interface ActiveCampaign {
  id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  plano_meses: number;
  videos: {
    id: string;
    nome: string;
    url: string;
    approval_status: string;
    is_active: boolean;
    selected_for_display: boolean;
    slot_position: number;
    rejection_reason?: string;
  }[];
}

export interface VideoData {
  id: string;
  nome: string;
  url: string;
}

export interface PedidoVideoQueryResult {
  id: string;
  pedido_id: string;
  video_id: string;
  approval_status: string;
  is_active: boolean;
  selected_for_display: boolean;
  slot_position: number;
  rejection_reason?: string;
  videos: VideoData | null;
}

export interface Pedido {
  id: string;
  client_id: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  plano_meses: number;
  lista_predios: string[];
}
