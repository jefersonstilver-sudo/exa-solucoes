
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderOrAttempt {
  id: string;
  type: 'order' | 'attempt';
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis?: string[];
  plano_meses?: number;
  data_inicio?: string;
  data_fim?: string;
  client_id?: string;
  client_email?: string;
  client_name?: string;
  video_status?: string;
  predios_selecionados?: number[];
}

interface OrdersStats {
  total_orders: number;
  total_attempts: number;
  total_revenue: number;
  conversion_rate: number;
  abandoned_value: number;
}

export const useOrdersWithAttempts = () => {
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
      console.log('🔄 Buscando pedidos e tentativas com queries diretas...');
      
      // 1. Buscar pedidos diretamente da tabela pedidos
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (pedidosError) {
        console.error('❌ Erro ao buscar pedidos:', pedidosError);
        throw pedidosError;
      }
      
      console.log('✅ Pedidos encontrados:', pedidos?.length || 0);
      
      // 2. Buscar emails dos clientes dos pedidos
      let pedidosComEmails: any[] = [];
      if (pedidos && pedidos.length > 0) {
        const clientIds = [...new Set(pedidos.map(p => p.client_id))];
        
        const { data: authUsers, error: authError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', clientIds);
          
        const emailMap = new Map();
        if (!authError && authUsers) {
          authUsers.forEach(user => emailMap.set(user.id, user.email));
        }
        
        pedidosComEmails = pedidos.map(pedido => ({
          ...pedido,
          client_email: emailMap.get(pedido.client_id) || 'Email não encontrado',
          client_name: emailMap.get(pedido.client_id) || 'Nome não disponível'
        }));
      }
      
      // 3. Buscar tentativas de compra
      const { data: tentativas, error: tentativasError } = await supabase
        .from('tentativas_compra')
        .select('*')
        .order('created_at', { ascending: false });
      
      let tentativasComEmails: any[] = [];
      if (!tentativasError && tentativas && tentativas.length > 0) {
        console.log('✅ Tentativas encontradas:', tentativas.length);
        
        const userIds = [...new Set(tentativas.map(t => t.id_user))];
        
        const { data: usuarios, error: usuariosError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
          
        const emailMap = new Map();
        if (!usuariosError && usuarios) {
          usuarios.forEach(user => emailMap.set(user.id, user.email));
        }
        
        tentativasComEmails = tentativas.map(tentativa => ({
          ...tentativa,
          user_email: emailMap.get(tentativa.id_user) || 'Email não encontrado'
        }));
      } else {
        console.log('⚠️ Nenhuma tentativa encontrada ou erro:', tentativasError);
      }
      
      // 4. Converter pedidos para formato unificado
      const pedidosFormatados: OrderOrAttempt[] = pedidosComEmails.map(pedido => ({
        id: pedido.id,
        type: 'order' as const,
        created_at: pedido.created_at,
        status: pedido.status,
        valor_total: pedido.valor_total || 0,
        lista_paineis: pedido.lista_paineis || [],
        plano_meses: pedido.plano_meses,
        data_inicio: pedido.data_inicio,
        data_fim: pedido.data_fim,
        client_id: pedido.client_id,
        client_email: pedido.client_email,
        client_name: pedido.client_name,
        video_status: pedido.video_status
      }));
      
      // 5. Converter tentativas para formato unificado
      const tentativasFormatadas: OrderOrAttempt[] = tentativasComEmails.map(tentativa => ({
        id: tentativa.id,
        type: 'attempt' as const,
        created_at: tentativa.created_at,
        status: 'tentativa',
        valor_total: tentativa.valor_total || 0,
        predios_selecionados: tentativa.predios_selecionados || [],
        client_email: tentativa.user_email,
        client_id: tentativa.id_user
      }));
      
      // 6. Combinar e ordenar por data
      const todosDados = [...pedidosFormatados, ...tentativasFormatadas]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setOrdersAndAttempts(todosDados);
      
      // 7. Calcular estatísticas
      const totalOrders = pedidosFormatados.length;
      const totalAttempts = tentativasFormatadas.length;
      const totalRevenue = pedidosFormatados
        .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
        .reduce((sum, p) => sum + p.valor_total, 0);
      const abandonedValue = tentativasFormatadas.reduce((sum, t) => sum + t.valor_total, 0);
      const conversionRate = totalAttempts > 0 ? (totalOrders / (totalOrders + totalAttempts)) * 100 : 0;
      
      const statsCalculadas = {
        total_orders: totalOrders,
        total_attempts: totalAttempts,
        total_revenue: totalRevenue,
        conversion_rate: conversionRate,
        abandoned_value: abandonedValue
      };
      
      console.log('📊 Estatísticas finais:', statsCalculadas);
      console.log('📋 Total de itens carregados:', todosDados.length);
      
      setStats(statsCalculadas);
      
      toast.success(`${totalOrders} pedidos e ${totalAttempts} tentativas carregados com sucesso`);
      
    } catch (error: any) {
      console.error('💥 Erro ao carregar dados:', error);
      toast.error('Erro ao carregar pedidos e tentativas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Configurar escuta em tempo real para mudanças
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
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tentativas_compra' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada em tentativas:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
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
