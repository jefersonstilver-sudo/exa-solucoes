
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
  transaction_id?: string;
  log_pagamento?: any;
}

export type UserOrderOrAttempt = UserOrderAttempt | UserCompleteOrder;

export const useUserOrdersAndAttempts = (userId?: string) => {
  const [userOrdersAndAttempts, setUserOrdersAndAttempts] = useState<UserOrderOrAttempt[]>([]);
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

      // Buscar pedidos completos do usuário (incluindo TODOS os status)
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
        type: 'order' as const,
        transaction_id: order.transaction_id,
        log_pagamento: order.log_pagamento
      }));

      // Buscar tentativas de compra do usuário
      let processedAttempts: UserOrderAttempt[] = [];
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('tentativas_compra')
          .select('*')
          .eq('id_user', userId)
          .order('created_at', { ascending: false });

        if (attemptsError) {
          console.warn('⚠️ useUserOrdersAndAttempts: Erro ao buscar tentativas (não crítico):', attemptsError);
        } else {
          console.log('✅ useUserOrdersAndAttempts: Tentativas encontradas:', attempts?.length || 0);

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
        console.warn('⚠️ useUserOrdersAndAttempts: Erro não crítico ao buscar tentativas:', error);
      }

      // Combinar e ordenar por data
      const combined = [...processedOrders, ...processedAttempts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('📋 useUserOrdersAndAttempts: Total combinado:', combined.length);
      console.log('🎯 useUserOrdersAndAttempts: Dados finais:', combined);

      setUserOrdersAndAttempts(combined);

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
