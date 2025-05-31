
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

        // Buscar dados do pedido com cliente - incluindo compliance_data
        const { data: orders, error: orderError } = await supabase
          .from('pedidos')
          .select(`
            *,
            compliance_data
          `)
          .eq('id', orderId);
        
        if (orderError) throw orderError;

        if (!orders || orders.length === 0) {
          toast.error('Pedido não encontrado');
          return;
        }

        const order = orders[0];

        // Buscar dados do cliente
        const { data: clientData, error: clientError } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', order.client_id)
          .single();

        if (clientError) {
          console.warn('Erro ao buscar dados do cliente:', clientError);
        }

        // Combinar dados do pedido com dados do cliente
        const orderWithClient: OrderWithClient = {
          ...order,
          client_email: clientData?.email || 'Email não encontrado',
          client_name: clientData?.raw_user_meta_data?.full_name || 
                      clientData?.raw_user_meta_data?.name || 
                      'Nome não disponível',
          video_status: order.status // Mapeamento simples do status
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
