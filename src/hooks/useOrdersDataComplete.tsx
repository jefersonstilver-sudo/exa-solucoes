
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderComplete {
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
}

export const useOrdersDataComplete = () => {
  const [orders, setOrders] = useState<OrderComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    awaiting_video: 0,
    video_sent: 0,
    video_approved: 0,
    video_rejected: 0
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🛒 Buscando pedidos completos com dados dos clientes...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Erro de autenticação:', authError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      console.log('✅ Usuário autenticado:', user.email);

      // Usar a função do banco para buscar pedidos com dados dos clientes
      const { data, error } = await supabase.rpc('get_pedidos_com_clientes');

      if (error) {
        console.error('❌ Erro ao buscar pedidos completos:', error);
        toast.error(`Erro ao carregar pedidos: ${error.message}`);
        return;
      }

      console.log('✅ Pedidos completos carregados:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum pedido encontrado');
        toast.info('Nenhum pedido encontrado na base de dados');
      } else {
        console.log('🎉 Pedidos com clientes:', data.map(p => `${p.client_name} (${p.video_status})`));
        toast.success(`${data.length} pedidos carregados com dados dos clientes`);
      }

      setOrders(data || []);
      
      // Calcular estatísticas detalhadas
      const ordersList = data || [];
      const total = ordersList.length;
      const pending = ordersList.filter(o => o.status === 'pendente').length;
      const completed = ordersList.filter(o => o.status === 'pago' || o.status === 'ativo').length;
      const cancelled = ordersList.filter(o => o.status === 'cancelado').length;
      const revenue = ordersList.filter(o => ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(o.status))
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);
      
      // Estatísticas de vídeo
      const awaiting_video = ordersList.filter(o => o.status === 'pago_pendente_video').length;
      const video_sent = ordersList.filter(o => o.status === 'video_enviado').length;
      const video_approved = ordersList.filter(o => o.status === 'video_aprovado').length;
      const video_rejected = ordersList.filter(o => o.status === 'video_rejeitado').length;

      setStats({ 
        total, 
        pending, 
        completed, 
        cancelled, 
        revenue,
        awaiting_video,
        video_sent,
        video_approved,
        video_rejected
      });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar pedidos completos:', error);
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('orders-changes-complete')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          console.log('📝 Mudança nos pedidos detectada:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders, stats, loading, refetch: fetchOrders };
};
