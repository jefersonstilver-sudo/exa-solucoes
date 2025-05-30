
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderAttempt {
  id: string;
  created_at: string;
  id_user: string;
  valor_total: number;
  predios_selecionados: number[];
  credencial?: string;
  predio?: string;
  type: 'attempt';
  status: 'tentativa';
  client_email?: string;
  client_name?: string;
}

export interface CompleteOrder {
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
  type: 'order';
}

export type OrderOrAttempt = OrderAttempt | CompleteOrder;

interface OrdersWithAttemptsStats {
  total_orders: number;
  total_attempts: number;
  total_revenue: number;
  conversion_rate: number;
  abandoned_value: number;
}

export const useOrdersWithAttempts = () => {
  const [ordersAndAttempts, setOrdersAndAttempts] = useState<OrderOrAttempt[]>([]);
  const [stats, setStats] = useState<OrdersWithAttemptsStats>({
    total_orders: 0,
    total_attempts: 0,
    total_revenue: 0,
    conversion_rate: 0,
    abandoned_value: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchOrdersAndAttempts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando pedidos e tentativas...');

      // Buscar pedidos completos primeiro (prioridade para fazer aparecer)
      const { data: orders, error: ordersError } = await supabase.rpc('get_pedidos_com_clientes');
      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos encontrados:', orders?.length || 0);

      // Processar pedidos completos
      const processedOrders: CompleteOrder[] = (orders || []).map(order => ({
        ...order,
        type: 'order' as const
      }));

      // Buscar tentativas de compra (sem foreign key problemática)
      let processedAttempts: OrderAttempt[] = [];
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('tentativas_compra')
          .select('*')
          .order('created_at', { ascending: false });

        if (attemptsError) {
          console.error('Erro ao buscar tentativas (não crítico):', attemptsError);
        } else {
          console.log('✅ Tentativas encontradas:', attempts?.length || 0);
          
          // Para cada tentativa, buscar o email do usuário separadamente
          if (attempts && attempts.length > 0) {
            for (const attempt of attempts) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('email')
                  .eq('id', attempt.id_user)
                  .single();

                processedAttempts.push({
                  id: attempt.id,
                  created_at: attempt.created_at,
                  id_user: attempt.id_user,
                  valor_total: attempt.valor_total || 0,
                  predios_selecionados: attempt.predios_selecionados || [],
                  credencial: attempt.credencial,
                  predio: attempt.predio,
                  type: 'attempt' as const,
                  status: 'tentativa' as const,
                  client_email: userData?.email || 'Email não encontrado',
                  client_name: userData?.email || 'Nome não disponível'
                });
              } catch (error) {
                console.warn('Erro ao buscar dados do usuário para tentativa:', attempt.id);
                // Ainda assim adicionar a tentativa mesmo sem email
                processedAttempts.push({
                  id: attempt.id,
                  created_at: attempt.created_at,
                  id_user: attempt.id_user,
                  valor_total: attempt.valor_total || 0,
                  predios_selecionados: attempt.predios_selecionados || [],
                  credencial: attempt.credencial,
                  predio: attempt.predio,
                  type: 'attempt' as const,
                  status: 'tentativa' as const,
                  client_email: 'Email não encontrado',
                  client_name: 'Nome não disponível'
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn('Erro não crítico ao buscar tentativas:', error);
        // Continuar sem tentativas se houver erro
      }

      // Combinar e ordenar por data
      const combined = [...processedOrders, ...processedAttempts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrdersAndAttempts(combined);

      // Calcular estatísticas
      const totalOrders = processedOrders.length;
      const totalAttempts = processedAttempts.length;
      const totalRevenue = processedOrders
        .filter(order => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(order.status))
        .reduce((sum, order) => sum + (order.valor_total || 0), 0);
      const abandonedValue = processedAttempts.reduce((sum, attempt) => sum + (attempt.valor_total || 0), 0);
      const conversionRate = totalAttempts > 0 ? (totalOrders / (totalOrders + totalAttempts)) * 100 : 0;

      setStats({
        total_orders: totalOrders,
        total_attempts: totalAttempts,
        total_revenue: totalRevenue,
        conversion_rate: conversionRate,
        abandoned_value: abandonedValue
      });

    } catch (error: any) {
      console.error('💥 Erro ao carregar pedidos e tentativas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndAttempts();

    // Configurar escuta em tempo real apenas para pedidos (que funcionam)
    const channel = supabase
      .channel('orders-and-attempts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada em pedidos:', payload);
          fetchOrdersAndAttempts();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Limpando inscrições de tempo real');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ordersAndAttempts,
    stats,
    loading,
    refetch: fetchOrdersAndAttempts
  };
};
