
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderWithClient {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  lista_predios: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email: string;
  client_name: string;
  video_status: string;
  nome_pedido?: string;
  log_pagamento?: any;
  compliance_data?: any;
  cupom_id?: string;
  termos_aceitos?: boolean;
  transaction_id?: string;
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

interface BuildingData {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  imagem_principal?: string;
  imagem_2?: string;
  imagem_3?: string;
  imagem_4?: string;
  imageurl?: string;
  image_urls?: string[];
}

export const useRealOrderDetails = (orderId: string) => {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderWithClient | null>(null);
  const [orderVideos, setOrderVideos] = useState<OrderVideo[]>([]);
  const [buildingData, setBuildingData] = useState<BuildingData[]>([]);

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
            lista_predios,
            plano_meses,
            data_inicio,
            data_fim,
            client_id,
            nome_pedido,
            compliance_data,
            log_pagamento,
            cupom_id,
            termos_aceitos,
            transaction_id,
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
          lista_predios: order.lista_predios || [],
          plano_meses: order.plano_meses,
          data_inicio: order.data_inicio,
          data_fim: order.data_fim,
          client_id: order.client_id,
          client_email: order.users?.email || 'Email não disponível',
          client_name: order.users?.email?.split('@')[0] || 'Cliente',
          video_status: order.status,
          nome_pedido: order.nome_pedido,
          log_pagamento: order.log_pagamento,
          compliance_data: order.compliance_data,
          cupom_id: order.cupom_id,
          termos_aceitos: order.termos_aceitos,
          transaction_id: order.transaction_id
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

        // Buscar dados dos prédios
        if (order.lista_predios && order.lista_predios.length > 0) {
          const { data: buildings, error: buildingsError } = await supabase
            .from('buildings')
            .select(`
              id,
              nome,
              endereco,
              bairro,
              imagem_principal,
              imagem_2,
              imagem_3,
              imagem_4,
              imageurl,
              image_urls
            `)
            .in('id', order.lista_predios);

          if (buildingsError) throw buildingsError;

          const formattedBuildings: BuildingData[] = buildings?.map(b => ({
            id: b.id,
            nome: b.nome || 'N/A',
            endereco: b.endereco || 'N/A',
            bairro: b.bairro || 'N/A',
            imagem_principal: b.imagem_principal,
            imagem_2: b.imagem_2,
            imagem_3: b.imagem_3,
            imagem_4: b.imagem_4,
            imageurl: b.imageurl,
            image_urls: b.image_urls
          })) || [];

          setBuildingData(formattedBuildings);
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
    panelData: buildingData
  };
};
