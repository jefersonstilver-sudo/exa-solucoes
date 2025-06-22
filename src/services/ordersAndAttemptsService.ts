
import { supabase } from '@/integrations/supabase/client';
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';

export const fetchOrdersData = async () => {
  console.log('🔄 Buscando todos os pedidos (incluindo tentativas)...');
  
  // Buscar TODOS os pedidos da tabela pedidos
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (pedidosError) {
    console.error('❌ Erro ao buscar pedidos:', pedidosError);
    throw pedidosError;
  }
  
  console.log('✅ Pedidos encontrados:', pedidos?.length || 0);
  
  return pedidos || [];
};

export const enrichOrdersWithEmails = async (pedidos: any[]) => {
  if (!pedidos || pedidos.length === 0) return [];
  
  const clientIds = [...new Set(pedidos.map(p => p.client_id))];
  
  const { data: authUsers, error: authError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', clientIds);
    
  const emailMap = new Map();
  if (!authError && authUsers) {
    authUsers.forEach(user => emailMap.set(user.id, user.email));
  }
  
  return pedidos.map(pedido => ({
    ...pedido,
    client_email: pedido.email || emailMap.get(pedido.client_id) || 'Email não encontrado',
    client_name: emailMap.get(pedido.client_id) || 'Nome não disponível'
  }));
};
