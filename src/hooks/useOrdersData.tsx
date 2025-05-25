
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
}

export const useOrdersData = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🛒 Buscando pedidos...');
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        toast.error('Erro ao carregar pedidos');
        return;
      }

      console.log('✅ Pedidos carregados:', data?.length);
      setOrders(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const pending = data?.filter(o => o.status === 'pendente').length || 0;
      const completed = data?.filter(o => o.status === 'pago').length || 0;
      const cancelled = data?.filter(o => o.status === 'cancelado').length || 0;
      const revenue = data?.filter(o => o.status === 'pago')
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0) || 0;

      setStats({ total, pending, completed, cancelled, revenue });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar pedidos:', error);
      toast.error('Erro crítico ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('orders-changes')
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
