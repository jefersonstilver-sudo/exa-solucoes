
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderWithClient {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: any;
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email: string;
  client_name: string;
  video_status: string;
}

interface OrderStats {
  total: number;
  revenue: number;
  awaiting_video: number;
  video_sent: number;
}

export const useRealOrdersData = () => {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    revenue: 0,
    awaiting_video: 0,
    video_sent: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Adicionar LIMIT para evitar queries pesadas
      const { data, error } = await supabase
        .rpc('get_pedidos_com_clientes')
        .limit(1000); // Limitar a 1000 pedidos mais recentes
      
      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        throw error;
      }
      
      if (data) {
        // Mapear video_status baseado no status do pedido
        const ordersWithVideoStatus = (data || []).map(order => ({
          ...order,
          video_status: order.status === 'pago_pendente_video' ? 'Aguardando Vídeo' :
                       order.status === 'video_enviado' ? 'Vídeo Enviado' :
                       order.status === 'video_aprovado' ? 'EM EXIBIÇÃO' :
                       order.status === 'video_rejeitado' ? 'Vídeo Rejeitado' :
                       order.status === 'pago' ? 'Pago' :
                       order.status === 'ativo' ? 'Ativo' :
                       order.status === 'pendente' ? 'Pendente' :
                       order.status === 'cancelado' ? 'Cancelado' : order.status
        }));
        
        setOrders(ordersWithVideoStatus);
        
        const total = data.length;
        const revenue = data
          .filter(order => order.status === 'pago' || order.status === 'pago_pendente_video')
          .reduce((sum, order) => sum + (order.valor_total || 0), 0);
        const awaiting_video = data.filter(order => order.status === 'pago_pendente_video').length;
        const video_sent = data.filter(order => order.status === 'video_enviado').length;
        
        setStats({ total, revenue, awaiting_video, video_sent });
      }
    } catch (error: any) {
      console.error('💥 Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    stats,
    loading,
    refetch: fetchOrders
  };
};
