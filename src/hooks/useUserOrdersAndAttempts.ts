
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserOrderItem {
  id: string;
  created_at: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  status: string;
  transaction_id?: string;
  log_pagamento?: any;
  email: string;
}

export const useUserOrdersAndAttempts = (userId?: string) => {
  const [userOrdersAndAttempts, setUserOrdersAndAttempts] = useState<UserOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrdersAndAttempts = async () => {
    if (!userId) {
      console.log('❌ useUserOrdersAndAttempts: Nenhum usuário fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 useUserOrdersAndAttempts: Buscando pedidos para usuário:', userId);

      // Buscar TODOS os pedidos do usuário (incluindo tentativas)
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ useUserOrdersAndAttempts: Erro ao buscar pedidos:', ordersError);
        throw ordersError;
      }

      console.log('✅ useUserOrdersAndAttempts: Pedidos encontrados:', orders?.length || 0);
      console.log('📊 useUserOrdersAndAttempts: Detalhes dos pedidos:', orders);

      // Processar todos os pedidos (incluindo tentativas)
      const processedOrders: UserOrderItem[] = (orders || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        valor_total: order.valor_total || 0,
        lista_paineis: order.lista_paineis || [],
        plano_meses: order.plano_meses,
        data_inicio: order.data_inicio,
        data_fim: order.data_fim,
        transaction_id: order.transaction_id,
        log_pagamento: order.log_pagamento,
        email: order.email
      }));

      console.log('📋 useUserOrdersAndAttempts: Total de itens processados:', processedOrders.length);
      console.log('🎯 useUserOrdersAndAttempts: Dados finais:', processedOrders);

      setUserOrdersAndAttempts(processedOrders);

    } catch (error: any) {
      console.error('💥 useUserOrdersAndAttempts: Erro crítico:', error);
      toast.error('Erro ao carregar seus pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useUserOrdersAndAttempts: Effect acionado com userId:', userId);
    fetchUserOrdersAndAttempts();

    if (userId) {
      // Configurar escuta em tempo real apenas para pedidos
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
            console.log('🔄 useUserOrdersAndAttempts: Mudança detectada em tempo real:', payload);
            fetchUserOrdersAndAttempts();
          }
        )
        .subscribe();

      return () => {
        console.log('🧹 useUserOrdersAndAttempts: Limpando inscrições');
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
