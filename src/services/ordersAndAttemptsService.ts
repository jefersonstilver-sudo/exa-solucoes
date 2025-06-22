
import { supabase } from '@/integrations/supabase/client';
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';

export const fetchOrdersData = async () => {
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
  
  return pedidos || [];
};

export const fetchAttemptsData = async () => {
  // 3. Buscar tentativas de compra
  const { data: tentativas, error: tentativasError } = await supabase
    .from('tentativas_compra')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (tentativasError) {
    console.log('⚠️ Nenhuma tentativa encontrada ou erro:', tentativasError);
    return [];
  }
  
  console.log('✅ Tentativas encontradas:', tentativas?.length || 0);
  return tentativas || [];
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
    client_email: emailMap.get(pedido.client_id) || 'Email não encontrado',
    client_name: emailMap.get(pedido.client_id) || 'Nome não disponível'
  }));
};

export const enrichAttemptsWithEmails = async (tentativas: any[]) => {
  if (!tentativas || tentativas.length === 0) return [];
  
  const userIds = [...new Set(tentativas.map(t => t.id_user))];
  
  const { data: usuarios, error: usuariosError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds);
    
  const emailMap = new Map();
  if (!usuariosError && usuarios) {
    usuarios.forEach(user => emailMap.set(user.id, user.email));
  }
  
  return tentativas.map(tentativa => ({
    ...tentativa,
    user_email: emailMap.get(tentativa.id_user) || 'Email não encontrado'
  }));
};
