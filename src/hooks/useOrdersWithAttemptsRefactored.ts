
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';
import { 
  fetchOrdersData, 
  fetchAttemptsData, 
  enrichOrdersWithEmails, 
  enrichAttemptsWithEmails 
} from '@/services/ordersAndAttemptsService';
import { 
  formatOrdersData, 
  formatAttemptsData, 
  combineAndSortData, 
  calculateStats 
} from '@/services/ordersAndAttemptsProcessor';

export const useOrdersWithAttemptsRefactored = () => {
  const [ordersAndAttempts, setOrdersAndAttempts] = useState<OrderOrAttempt[]>([]);
  const [stats, setStats] = useState<OrdersStats>({
    total_orders: 0,
    total_attempts: 0,
    total_revenue: 0,
    conversion_rate: 0,
    abandoned_value: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos usando a RPC get_pedidos_com_clientes
      const { data: pedidosComClientes, error: pedidosError } = await supabase.rpc('get_pedidos_com_clientes');
      
      if (pedidosError) {
        console.error('❌ Erro ao buscar pedidos:', pedidosError);
        throw pedidosError;
      }
      
      // Buscar tentativas normalmente
      const tentativas = await fetchAttemptsData();
      
      // Enriquecer tentativas com emails
      const tentativasComEmails = await enrichAttemptsWithEmails(tentativas);
      
      // Formatar dados dos pedidos com TODOS os campos necessários
      const pedidosFormatados = (pedidosComClientes || []).map((pedido: any) => ({
        id: pedido.id,
        type: 'order' as const,
        created_at: pedido.created_at,
        status: pedido.status,
        valor_total: pedido.valor_total,
        lista_paineis: pedido.lista_paineis,
        plano_meses: pedido.plano_meses,
        data_inicio: pedido.data_inicio,
        data_fim: pedido.data_fim,
        client_id: pedido.client_id,
        client_email: pedido.client_email,
        client_name: pedido.client_name,
        video_status: pedido.video_status,
        cupom_id: pedido.cupom_id,
        tipo_pagamento: pedido.tipo_pagamento,
        is_fidelidade: pedido.is_fidelidade,
        contrato_status: pedido.contrato_status,
        contrato_assinado_em: pedido.contrato_assinado_em
      }));
      
      const tentativasFormatadas = formatAttemptsData(tentativasComEmails);
      
      // Combinar e ordenar
      const todosDados = combineAndSortData(pedidosFormatados, tentativasFormatadas);
      setOrdersAndAttempts(todosDados);
      
      // Calcular estatísticas
      const statsCalculadas = calculateStats(pedidosFormatados, tentativasFormatadas);
      setStats(statsCalculadas);
      
      console.log('📊 Estatísticas finais:', statsCalculadas);
      console.log('📋 Total de itens carregados:', todosDados.length);
      
      toast.success(`${statsCalculadas.total_orders} pedidos e ${statsCalculadas.total_attempts} tentativas carregados com sucesso`);
      
    } catch (error: any) {
      console.error('💥 Erro ao carregar dados:', error);
      toast.error('Erro ao carregar pedidos e tentativas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔧 Setting up real-time listeners for orders and attempts...');
    fetchData();

    const channel = supabase
      .channel('orders-and-attempts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('🔄 Pedidos change detected:', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tentativas_compra' },
        (payload) => {
          console.log('🔄 Tentativas change detected:', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_videos' },
        (payload) => {
          console.log('🎥 Pedido videos change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ordersAndAttempts,
    stats,
    loading,
    refetch: fetchData
  };
};
