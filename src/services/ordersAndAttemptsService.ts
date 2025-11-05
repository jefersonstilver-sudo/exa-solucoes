
import { supabase } from '@/integrations/supabase/client';
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';

export const fetchOrdersData = async () => {
  if (import.meta.env.DEV) {
    console.log('🔄 Buscando pedidos e tentativas com queries diretas...');
  }
  
  // 1. Buscar pedidos diretamente da tabela pedidos
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (pedidosError) {
    console.error('❌ Erro ao buscar pedidos:', pedidosError);
    throw pedidosError;
  }
  
  if (import.meta.env.DEV) {
    console.log('✅ Pedidos encontrados:', pedidos?.length || 0);
  }
  
  return pedidos || [];
};

export const fetchAttemptsData = async () => {
  // 3. Buscar tentativas de compra
  const { data: tentativas, error: tentativasError } = await supabase
    .from('tentativas_compra')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (tentativasError) {
    if (import.meta.env.DEV) {
      console.log('⚠️ Nenhuma tentativa encontrada ou erro:', tentativasError);
    }
    return [];
  }
  
  if (import.meta.env.DEV) {
    console.log('✅ Tentativas encontradas:', tentativas?.length || 0);
  }
  return tentativas || [];
};

export const enrichOrdersWithEmails = async (pedidos: any[]) => {
  if (!pedidos || pedidos.length === 0) return [];
  
  const clientIds = [...new Set(pedidos.map(p => p.client_id))];
  
  // Buscar dados completos dos usuários incluindo metadados
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', clientIds);

  const userMap = new Map();
  if (!usersError && users) {
    // Call edge function to get extended user data (server-side admin API calls)
    const { data: extendedData, error: extendedError } = await supabase.functions.invoke('get-users-extended', {
      body: { userIds: users.map(u => u.id) }
    });
    
    if (!extendedError && extendedData?.users) {
      extendedData.users.forEach((userData: any) => {
        userMap.set(userData.id, {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          phone: userData.phone || null,
          cpf: userData.cpf || null
        });
      });
    } else {
      // Fallback if edge function fails
      users.forEach(user => {
        userMap.set(user.id, {
          email: user.email,
          name: user.email.split('@')[0],
          phone: null,
          cpf: null
        });
      });
    }
  }
  
  return pedidos.map(pedido => {
    const userData = userMap.get(pedido.client_id) || {};
    return {
      ...pedido,
      client_email: userData.email || 'Email não encontrado',
      client_name: userData.name || 'Nome não disponível',
      client_phone: userData.phone || null,
      client_cpf: userData.cpf || null
    };
  });
};

export const enrichAttemptsWithEmails = async (tentativas: any[]) => {
  if (!tentativas || tentativas.length === 0) return [];
  
  const userIds = [...new Set(tentativas.map(t => t.id_user))];
  
  // Buscar dados completos dos usuários incluindo metadados
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds);

  const userMap = new Map();
  if (!usersError && users) {
    // Call edge function to get extended user data (server-side admin API calls)
    const { data: extendedData, error: extendedError } = await supabase.functions.invoke('get-users-extended', {
      body: { userIds: users.map(u => u.id) }
    });
    
    if (!extendedError && extendedData?.users) {
      extendedData.users.forEach((userData: any) => {
        userMap.set(userData.id, {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          phone: userData.phone || null,
          cpf: userData.cpf || null
        });
      });
    } else {
      // Fallback if edge function fails
      users.forEach(user => {
        userMap.set(user.id, {
          email: user.email,
          name: user.email.split('@')[0],
          phone: null,
          cpf: null
        });
      });
    }
  }

  // Buscar nomes dos prédios selecionados
  const allBuildingIds = [...new Set(tentativas.flatMap(t => t.predios_selecionados || []))];
  let buildingsMap = new Map();
  
  if (allBuildingIds.length > 0) {
    const { data: buildings } = await supabase
      .from('buildings')
      .select('id, nome, endereco, bairro')
      .in('id', allBuildingIds);
    
    if (buildings) {
      buildings.forEach(building => {
        buildingsMap.set(building.id, {
          nome: building.nome,
          endereco: building.endereco,
          bairro: building.bairro
        });
      });
    }
  }
  
  return tentativas.map(tentativa => {
    const userData = userMap.get(tentativa.id_user) || {};
    const selectedBuildings = (tentativa.predios_selecionados || []).map(buildingId => 
      buildingsMap.get(buildingId) || { nome: 'Prédio não encontrado', endereco: '', bairro: '' }
    );
    
    return {
      ...tentativa,
      client_email: userData.email || 'Email não encontrado',
      client_name: userData.name || 'Nome não disponível',
      client_phone: userData.phone || null,
      client_cpf: userData.cpf || null,
      selected_buildings: selectedBuildings,
      user_email: userData.email || 'Email não encontrado' // Manter compatibilidade
    };
  });
};
