
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
      console.log('🛒 Buscando pedidos com novas políticas RLS...');
      
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Acesso negado. Faça login como administrador.');
        return;
      }

      console.log('✅ Usuário autenticado:', user.email);

      // Tentar buscar pedidos com a nova política RLS + LIMIT
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Limitar a 500 pedidos mais recentes

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Detalhes:', error.details);
        
        // Fallback: tentar busca mais simples
        console.log('🔄 Tentando busca simplificada...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pedidos')
          .select('id, created_at, status, valor_total, client_id, lista_paineis, plano_meses, data_inicio, data_fim')
          .limit(10);
          
        if (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
          toast.error(`Erro ao carregar pedidos: ${error.message}`);
          return;
        }
        
        console.log('⚠️ Usando dados de fallback:', fallbackData);
        toast.warning('Pedidos carregados em modo simplificado');
        
        // Garantir que os dados de fallback tenham todas as propriedades obrigatórias
        const processedFallbackData = (fallbackData || []).map(order => ({
          id: order.id,
          created_at: order.created_at || new Date().toISOString(),
          status: order.status,
          valor_total: order.valor_total || 0,
          lista_paineis: order.lista_paineis || [],
          plano_meses: order.plano_meses || 1,
          data_inicio: order.data_inicio || new Date().toISOString(),
          data_fim: order.data_fim || new Date().toISOString(),
          client_id: order.client_id
        }));
        
        setOrders(processedFallbackData);
      } else {
        console.log('✅ Pedidos carregados com sucesso:', data);
        console.log('✅ Total de pedidos:', data?.length || 0);
        
        if (!data || data.length === 0) {
          console.log('⚠️ Nenhum pedido encontrado');
          toast.info('Nenhum pedido encontrado na base de dados');
        } else {
          console.log('🎉 Pedidos carregados:', data.map(p => `${p.id.substring(0, 8)} (${p.status})`));
          toast.success(`${data.length} pedidos carregados com sucesso`);
        }

        setOrders(data || []);
      }
      
      // Calcular estatísticas
      const ordersList = data || [];
      const total = ordersList.length;
      const pending = ordersList.filter(o => o.status === 'pendente').length;
      const completed = ordersList.filter(o => o.status === 'pago').length;
      const cancelled = ordersList.filter(o => o.status === 'cancelado').length;
      const revenue = ordersList.filter(o => o.status === 'pago')
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);

      setStats({ total, pending, completed, cancelled, revenue });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar pedidos:', error);
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
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
