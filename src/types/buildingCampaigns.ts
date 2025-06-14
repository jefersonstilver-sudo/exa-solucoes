
import type { Database } from '@/integrations/supabase/types';

// Tipos base do Supabase
type PedidoVideoRow = Database['public']['Tables']['pedido_videos']['Row'];
type VideoRow = Database['public']['Tables']['videos']['Row'];

// Interface para o resultado da query com relação videos
export interface PedidoVideoWithVideos extends PedidoVideoRow {
  videos: Pick<VideoRow, 'id' | 'nome' | 'url'> | null;
}

// Interface para campanhas ativas
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
