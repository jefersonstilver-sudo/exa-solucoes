
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
      console.log('🔄 Buscando pedidos e tentativas...');
      
      // Buscar pedidos usando a função RPC corrigida
      const { data: pedidos, error: pedidosError } = await supabase.rpc('get_pedidos_com_clientes');
      
      if (pedidosError) {
        console.error('❌ Erro ao buscar pedidos:', pedidosError);
        throw pedidosError;
      }
      
      // Buscar tentativas de compra (sem join problemático)
      const { data: tentativas, error: tentativasError } = await supabase
        .from('tentativas_compra')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tentativasError) {
        console.error('❌ Erro ao buscar tentativas:', tentativasError);
        // Não falhar se tentativas der erro, apenas logar
      }
      
      // Buscar emails dos usuários das tentativas separadamente
      let tentativasComEmails: any[] = [];
      if (tentativas && tentativas.length > 0) {
        const userIds = [...new Set(tentativas.map(t => t.id_user))];
        
        const { data: usuarios, error: usuariosError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
          
        if (!usuariosError && usuarios) {
          // Criar mapa de user_id -> email
          const emailMap = new Map(usuarios.map(u => [u.id, u.email]));
          
          tentativasComEmails = tentativas.map(tentativa => ({
            ...tentativa,
            user_email: emailMap.get(tentativa.id_user) || 'Email não encontrado'
          }));
        } else {
          tentativasComEmails = tentativas.map(tentativa => ({
            ...tentativa,
            user_email: 'Email não encontrado'
          }));
        }
      }
      
      console.log('✅ Pedidos carregados:', pedidos?.length || 0);
      console.log('✅ Tentativas carregadas:', tentativasComEmails.length);
      
      // Converter pedidos para formato unificado
      const pedidosFormatados: OrderOrAttempt[] = (pedidos || []).map(pedido => ({
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
      
      // Converter tentativas para formato unificado
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
      
      // Combinar e ordenar por data
      const todosDados = [...pedidosFormatados, ...tentativasFormatadas]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setOrdersAndAttempts(todosDados);
      
      // Calcular estatísticas
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
      
      console.log('📊 Estatísticas calculadas:', statsCalculadas);
      setStats(statsCalculadas);
      
      toast.success(`${totalOrders} pedidos e ${totalAttempts} tentativas carregados`);
      
    } catch (error: any) {
      console.error('💥 Erro ao carregar dados:', error);
      toast.error('Erro ao carregar pedidos e tentativas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Configurar escuta em tempo real
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
