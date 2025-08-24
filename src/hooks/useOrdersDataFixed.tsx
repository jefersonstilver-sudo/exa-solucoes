
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderComplete {
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
}

export const useOrdersDataFixed = () => {
  const [orders, setOrders] = useState<OrderComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    awaiting_video: 0,
    video_sent: 0,
    video_approved: 0,
    video_rejected: 0
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🛒 Buscando pedidos com políticas RLS corrigidas...');
      
      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Erro de autenticação:', authError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      console.log('✅ Usuário autenticado:', user.email);

      // Usar a função corrigida do banco com nova política RLS
      const { data, error } = await supabase.rpc('get_pedidos_com_clientes');

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        
        // Fallback: Buscar diretamente da tabela pedidos
        console.log('🔄 Tentando busca direta da tabela pedidos...');
        const { data: directData, error: directError } = await supabase
          .from('pedidos')
          .select(`
            *,
            users:client_id (
              email
            )
          `)
          .order('created_at', { ascending: false });
          
        if (directError) {
          console.error('❌ Erro na busca direta:', directError);
          toast.error(`Erro ao carregar pedidos: ${error.message}`);
          return;
        }
        
        console.log('📋 Dados obtidos por busca direta:', directData);
        
        // Processar dados da busca direta
        const processedData = (directData || []).map(order => ({
          id: order.id,
          created_at: order.created_at || new Date().toISOString(),
          status: order.status,
          valor_total: order.valor_total || 0,
          lista_paineis: order.lista_paineis || [],
          plano_meses: order.plano_meses || 1,
          data_inicio: order.data_inicio || new Date().toISOString().split('T')[0],
          data_fim: order.data_fim || new Date().toISOString().split('T')[0],
          client_id: order.client_id,
          client_email: order.users?.email || 'Email não encontrado',
          client_name: 'Nome não disponível',
          video_status: order.status === 'pago_pendente_video' ? 'Aguardando Vídeo' :
                       order.status === 'video_enviado' ? 'Vídeo Enviado' :
                       order.status === 'video_aprovado' ? 'EM EXIBIÇÃO' :
                       order.status === 'video_rejeitado' ? 'Vídeo Rejeitado' :
                       order.status === 'pago' ? 'Pago' :
                       order.status === 'pendente' ? 'Pendente' :
                       order.status === 'cancelado' ? 'Cancelado' : 'Status Desconhecido'
        }));
        
        setOrders(processedData);
        toast.warning('Pedidos carregados com busca direta (função RPC não funcionou)');
      } else {
        console.log('✅ Pedidos carregados via RPC com sucesso:', data);
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
      const completed = ordersList.filter(o => ['pago', 'video_aprovado'].includes(o.status)).length;
      const cancelled = ordersList.filter(o => o.status === 'cancelado').length;
      const revenue = ordersList
        .filter(o => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(o.status))
        .reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);
      
      // Estatísticas de vídeo
      const awaiting_video = ordersList.filter(o => o.status === 'pago_pendente_video').length;
      const video_sent = ordersList.filter(o => o.status === 'video_enviado').length;
      const video_approved = ordersList.filter(o => o.status === 'video_aprovado').length;
      const video_rejected = ordersList.filter(o => o.status === 'video_rejeitado').length;

      const statsCalculated = { 
        total, 
        pending, 
        completed, 
        cancelled, 
        revenue,
        awaiting_video,
        video_sent,
        video_approved,
        video_rejected
      };
      
      console.log('📈 Estatísticas calculadas:', statsCalculated);
      setStats(statsCalculated);
      
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
      .channel('orders-changes-fixed')
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
