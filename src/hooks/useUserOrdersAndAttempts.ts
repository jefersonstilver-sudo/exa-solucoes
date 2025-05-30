
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserOrderAttempt {
  id: string;
  created_at: string;
  valor_total: number;
  predios_selecionados: number[];
  credencial?: string;
  predio?: string;
  type: 'attempt';
  status: 'tentativa';
}

export interface UserCompleteOrder {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  type: 'order';
}

export type UserOrderOrAttempt = UserOrderAttempt | UserCompleteOrder;

export const useUserOrdersAndAttempts = (userId?: string) => {
  const [userOrdersAndAttempts, setUserOrdersAndAttempts] = useState<UserOrderOrAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrdersAndAttempts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando pedidos e tentativas do usuário:', userId);

      // Buscar pedidos completos do usuário primeiro (prioridade)
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao buscar pedidos do usuário:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos do usuário encontrados:', orders?.length || 0);

      // Processar pedidos completos
      const processedOrders: UserCompleteOrder[] = (orders || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        valor_total: order.valor_total || 0,
        lista_paineis: order.lista_paineis || [],
        plano_meses: order.plano_meses,
        data_inicio: order.data_inicio,
        data_fim: order.data_fim,
        type: 'order' as const
      }));

      // Buscar tentativas de compra do usuário (sem foreign key problemática)
      let processedAttempts: UserOrderAttempt[] = [];
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('tentativas_compra')
          .select('*')
          .eq('id_user', userId)
          .order('created_at', { ascending: false });

        if (attemptsError) {
          console.warn('Erro ao buscar tentativas do usuário (não crítico):', attemptsError);
        } else {
          console.log('✅ Tentativas do usuário encontradas:', attempts?.length || 0);

          processedAttempts = (attempts || []).map(attempt => ({
            id: attempt.id,
            created_at: attempt.created_at,
            valor_total: attempt.valor_total || 0,
            predios_selecionados: attempt.predios_selecionados || [],
            credencial: attempt.credencial,
            predio: attempt.predio,
            type: 'attempt' as const,
            status: 'tentativa' as const
          }));
        }
      } catch (error) {
        console.warn('Erro não crítico ao buscar tentativas do usuário:', error);
        // Continuar sem tentativas se houver erro
      }

      // Combinar e ordenar por data
      const combined = [...processedOrders, ...processedAttempts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUserOrdersAndAttempts(combined);

    } catch (error: any) {
      console.error('💥 Erro ao carregar pedidos e tentativas do usuário:', error);
      toast.error('Erro ao carregar seus pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrdersAndAttempts();

    if (userId) {
      // Configurar escuta em tempo real apenas para pedidos (que funcionam)
      const channel = supabase
        .channel(`user-orders-${userId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'pedidos',
            filter: `client_id=eq.${userId}`
          }, 
          (payload) => {
            console.log('🔄 Mudança detectada em pedidos do usuário:', payload);
            fetchUserOrdersAndAttempts();
          }
        )
        .subscribe();

      return () => {
        console.log('🧹 Limpando inscrições de tempo real do usuário');
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  return {
    userOrdersAndAttempts,
    loading,
    refetch: fetchUserOrdersAndAttempts
  };
};
