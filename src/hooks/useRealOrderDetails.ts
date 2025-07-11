
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderWithClient {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email: string;
  client_name: string;
  video_status: string;
  log_pagamento?: any;
  compliance_data?: any;
  cupom_id?: string;
  termos_aceitos?: boolean;
}

interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  created_at: string;
  approved_at?: string;
  rejection_reason?: string;
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}

interface PanelData {
  id: string;
  code: string;
  building_name: string;
  building_address: string;
  building_neighborhood: string;
}

export const useRealOrderDetails = (orderId: string) => {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderWithClient | null>(null);
  const [orderVideos, setOrderVideos] = useState<OrderVideo[]>([]);
  const [panelData, setPanelData] = useState<PanelData[]>([]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        setLoading(true);

        // Buscar pedido diretamente da tabela pedidos com dados do cliente
        const { data: order, error: ordersError } = await supabase
          .from('pedidos')
          .select(`
            id,
            created_at,
            status,
            valor_total,
            lista_paineis,
            plano_meses,
            data_inicio,
            data_fim,
            client_id,
            compliance_data,
            log_pagamento,
            cupom_id,
            termos_aceitos,
            users!pedidos_client_id_fkey (
              email
            )
          `)
          .eq('id', orderId)
          .single();
        
        if (ordersError) throw ordersError;
        
        if (!order) {
          toast.error('Pedido não encontrado');
          return;
        }

        // Montar objeto completo do pedido
        const orderWithClient: OrderWithClient = {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          valor_total: order.valor_total,
          lista_paineis: order.lista_paineis || [],
          plano_meses: order.plano_meses,
          data_inicio: order.data_inicio,
          data_fim: order.data_fim,
          client_id: order.client_id,
          client_email: order.users?.email || 'Email não disponível',
          client_name: order.users?.email?.split('@')[0] || 'Cliente',
          video_status: order.status,
          log_pagamento: order.log_pagamento,
          compliance_data: order.compliance_data,
          cupom_id: order.cupom_id,
          termos_aceitos: order.termos_aceitos
        };

        setOrderDetails(orderWithClient);

        // Buscar vídeos do pedido
        const { data: videos, error: videosError } = await supabase
          .from('pedido_videos')
          .select(`
            id,
            slot_position,
            approval_status,
            is_active,
            selected_for_display,
            created_at,
            approved_at,
            rejection_reason,
            videos (
              id,
              nome,
              url,
              duracao,
              orientacao
            )
          `)
          .eq('pedido_id', orderId);

        if (videosError) throw videosError;

        const formattedVideos: OrderVideo[] = videos?.map(v => ({
          id: v.id,
          slot_position: v.slot_position,
          approval_status: v.approval_status as 'pending' | 'approved' | 'rejected',
          is_active: v.is_active,
          selected_for_display: v.selected_for_display,
          created_at: v.created_at,
          approved_at: v.approved_at,
          rejection_reason: v.rejection_reason,
          video_data: v.videos ? {
            id: v.videos.id,
            nome: v.videos.nome,
            url: v.videos.url,
            duracao: v.videos.duracao,
            orientacao: v.videos.orientacao
          } : undefined
        })) || [];

        setOrderVideos(formattedVideos);

        // Buscar dados dos painéis
        if (order.lista_paineis && order.lista_paineis.length > 0) {
          const { data: panels, error: panelsError } = await supabase
            .from('painels')
            .select(`
              id,
              code,
              buildings (
                nome,
                endereco,
                bairro
              )
            `)
            .in('id', order.lista_paineis);

          if (panelsError) throw panelsError;

          const formattedPanels: PanelData[] = panels?.map(p => ({
            id: p.id,
            code: p.code,
            building_name: p.buildings?.nome || 'N/A',
            building_address: p.buildings?.endereco || 'N/A',
            building_neighborhood: p.buildings?.bairro || 'N/A'
          })) || [];

          setPanelData(formattedPanels);
        }

      } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return {
    loading,
    orderDetails,
    orderVideos,
    panelData
  };
};
