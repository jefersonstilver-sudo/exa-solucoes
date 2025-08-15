// Função de teste para verificar se o source_tentativa_id está sendo populado corretamente
import { supabase } from '@/integrations/supabase/client';

export const testOrderCreationWithTentativa = async () => {
  try {
    console.log('🧪 [Test] Testando criação de pedido com source_tentativa_id...');
    
    // Buscar pedidos recentes para verificar se source_tentativa_id está sendo populado
    const { data: recentOrders, error } = await supabase
      .from('pedidos')
      .select('id, source_tentativa_id, transaction_id, valor_total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ [Test] Erro ao buscar pedidos:', error);
      return;
    }

    console.log('📊 [Test] Pedidos recentes:', recentOrders);

    const ordersWithTentativa = recentOrders?.filter(order => order.source_tentativa_id) || [];
    const ordersWithoutTentativa = recentOrders?.filter(order => !order.source_tentativa_id) || [];

    console.log(`✅ [Test] Pedidos COM source_tentativa_id: ${ordersWithTentativa.length}/${recentOrders?.length || 0}`);
    console.log(`❌ [Test] Pedidos SEM source_tentativa_id: ${ordersWithoutTentativa.length}/${recentOrders?.length || 0}`);

    // Buscar tentativas recentes para verificar vinculação
    const { data: recentTentativas, error: tentativasError } = await supabase
      .from('tentativas_compra')
      .select('id, id_user, valor_total, transaction_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (tentativasError) {
      console.error('❌ [Test] Erro ao buscar tentativas:', tentativasError);
      return;
    }

    console.log('📊 [Test] Tentativas recentes:', recentTentativas);

    // Verificar vinculação entre pedidos e tentativas
    for (const order of ordersWithTentativa) {
      const linkedTentativa = recentTentativas?.find(t => t.id === order.source_tentativa_id);
      if (linkedTentativa) {
        console.log(`🔗 [Test] Pedido ${order.id} vinculado à tentativa ${linkedTentativa.id}`);
      } else {
        console.log(`⚠️ [Test] Pedido ${order.id} tem source_tentativa_id mas tentativa não encontrada`);
      }
    }

    return {
      totalOrders: recentOrders?.length || 0,
      ordersWithTentativa: ordersWithTentativa.length,
      ordersWithoutTentativa: ordersWithoutTentativa.length,
      recentOrders,
      recentTentativas
    };

  } catch (error) {
    console.error('❌ [Test] Erro no teste:', error);
    return null;
  }
};

// Função para verificar se um pedido pode ser atualizado via tentativa
export const testOrderStatusUpdate = async (tentativaId: string) => {
  try {
    console.log(`🧪 [Test] Testando atualização de status via tentativa ${tentativaId}...`);
    
    // Buscar pedido vinculado à tentativa
    const { data: linkedOrder, error } = await supabase
      .from('pedidos')
      .select('id, status, source_tentativa_id, transaction_id')
      .eq('source_tentativa_id', tentativaId)
      .single();

    if (error) {
      console.error('❌ [Test] Erro ao buscar pedido vinculado:', error);
      return null;
    }

    if (!linkedOrder) {
      console.log('❌ [Test] Nenhum pedido encontrado para esta tentativa');
      return null;
    }

    console.log('✅ [Test] Pedido encontrado via tentativa:', linkedOrder);
    
    return linkedOrder;

  } catch (error) {
    console.error('❌ [Test] Erro no teste de atualização:', error);
    return null;
  }
};