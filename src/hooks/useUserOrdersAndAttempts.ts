
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserOrderItem {
  id: string;
  type: 'order' | 'attempt';
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
  email?: string;
}

export const useUserOrdersAndAttempts = (userId: string | undefined) => {
  const [userOrdersAndAttempts, setUserOrdersAndAttempts] = useState<UserOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserOrdersAndAttempts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Buscando pedidos e tentativas para usuário:', userId);
        
        // Buscar todos os pedidos do usuário (incluindo tentativas)
        const { data: pedidos, error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });
        
        if (pedidosError) {
          console.error('❌ Erro ao buscar pedidos:', pedidosError);
          throw pedidosError;
        }
        
        console.log('✅ Pedidos encontrados:', pedidos?.length || 0);
        
        // Mapear para o formato correto
        const mappedItems: UserOrderItem[] = (pedidos || []).map(pedido => ({
          id: pedido.id,
          type: pedido.status === 'tentativa' ? 'attempt' : 'order',
          created_at: pedido.created_at,
          status: pedido.status,
          valor_total: pedido.valor_total || 0,
          lista_paineis: pedido.lista_paineis || [],
          plano_meses: pedido.plano_meses || 1,
          data_inicio: pedido.data_inicio,
          data_fim: pedido.data_fim,
          client_id: pedido.client_id,
          email: pedido.email
        }));
        
        setUserOrdersAndAttempts(mappedItems);
        
      } catch (error: any) {
        console.error('💥 Erro ao buscar dados do usuário:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrdersAndAttempts();
  }, [userId]);

  return { userOrdersAndAttempts, loading, error };
};
