
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
  video_count: number;
  correct_status: string;
}

interface EnhancedOrderStats {
  total: number;
  revenue: number;
  awaiting_video: number;
  video_sent: number;
  video_approved: number;
  video_rejected: number;
  active: number;
}

export const useEnhancedOrdersData = () => {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [stats, setStats] = useState<EnhancedOrderStats>({
    total: 0,
    revenue: 0,
    awaiting_video: 0,
    video_sent: 0,
    video_approved: 0,
    video_rejected: 0,
    active: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando pedidos com dados corrigidos...');
      
      const { data, error } = await supabase.rpc('get_pedidos_com_status_correto' as any) as { data: any[] | null; error: any };
      
      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        throw error;
      }
      
      console.log('✅ Pedidos carregados:', Array.isArray(data) ? data.length : 0);
      
      if (Array.isArray(data)) {
        setOrders(data as any);
        
        // Calcular estatísticas detalhadas
        const total = data.length;
        const revenue = data
          .filter(order => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(order.correct_status))
          .reduce((sum, order) => sum + (order.valor_total || 0), 0);
        
        const awaiting_video = data.filter(order => order.correct_status === 'pago_pendente_video').length;
        const video_sent = data.filter(order => order.status === 'video_enviado').length;
        const video_approved = data.filter(order => order.status === 'video_aprovado').length;
        const video_rejected = data.filter(order => order.status === 'video_rejeitado').length;
        const active = data.filter(order => order.status === 'video_aprovado').length;
        
        setStats({ 
          total, 
          revenue, 
          awaiting_video, 
          video_sent, 
          video_approved, 
          video_rejected, 
          active 
        });

        // Log detalhado para debug
        console.log('📈 Estatísticas calculadas:', {
          total,
          revenue,
          awaiting_video,
          video_sent,
          video_approved,
          video_rejected,
          active
        });
      }
    } catch (error: any) {
      console.error('💥 Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    console.log('🔄 Atualizando dados dos pedidos...');
    await fetchOrders();
  };

  useEffect(() => {
    fetchOrders();

    // Configurar escuta em tempo real para mudanças
    const channel = supabase
      .channel('enhanced-orders-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada em pedidos:', payload);
          fetchOrders();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedido_videos' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada em vídeos:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Limpando inscrições de tempo real');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    stats,
    loading,
    refetch: refreshData
  };
};
