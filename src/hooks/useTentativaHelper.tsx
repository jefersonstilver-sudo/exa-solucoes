import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateTentativaParams {
  userId: string;
  cartItems: any[];
  selectedPlan: number;
  totalPrice: number;
}

interface TentativaResult {
  success: boolean;
  tentativaId?: string;
  error?: string;
}

export const useTentativaHelper = () => {
  const createTentativa = async (params: CreateTentativaParams): Promise<TentativaResult> => {
    const { userId, cartItems, selectedPlan, totalPrice } = params;
    
    try {
      // Validações básicas
      if (!userId) {
        throw new Error('ID do usuário é obrigatório');
      }
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Carrinho vazio');
      }
      
      // Extrair prédios selecionados
      const prediosSelecionados = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicados
        .map(id => String(id)); // Garantir que são strings
      
      if (prediosSelecionados.length === 0) {
        throw new Error('Não foi possível extrair prédios do carrinho');
      }

      console.log('🔍 [TentativaHelper] Predios selecionados:', prediosSelecionados);

      // Buscar dados do usuário para construir credencial
      let userEmail = '';
      
      // Primeiro tentar na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (userData?.email) {
        userEmail = userData.email;
        console.log('✅ [TentativaHelper] Email encontrado na tabela users:', userEmail);
      } else {
        console.log('⚠️ [TentativaHelper] Usuário não encontrado na tabela users, buscando no auth.users');
        
        // Se não encontrar na tabela users, buscar no auth.users
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser.user?.email) {
          console.error('❌ [TentativaHelper] Erro ao buscar dados do auth.users:', authError);
          throw new Error('Erro ao buscar dados do usuário autenticado');
        }
        
        userEmail = authUser.user.email;
        console.log('✅ [TentativaHelper] Email encontrado no auth.users:', userEmail);
      }

      // Buscar nome do primeiro prédio
      const firstBuildingId = prediosSelecionados[0];
      console.log('🔍 [TentativaHelper] Buscando prédio com ID:', firstBuildingId);
      
      // Verificar se é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(firstBuildingId)) {
        console.error('❌ [TentativaHelper] ID do prédio não é um UUID válido:', firstBuildingId);
        throw new Error(`ID do prédio inválido: ${firstBuildingId}`);
      }

      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('nome')
        .eq('id', firstBuildingId)
        .maybeSingle();

      if (buildingError) {
        console.error('❌ [TentativaHelper] Erro ao buscar prédio:', buildingError);
        throw new Error(`Erro ao buscar dados do prédio: ${buildingError.message}`);
      }

      if (!buildingData) {
        console.error('❌ [TentativaHelper] Prédio não encontrado:', firstBuildingId);
        throw new Error(`Prédio não encontrado com ID: ${firstBuildingId}`);
      }

      console.log('✅ [TentativaHelper] Prédio encontrado:', buildingData.nome);

      const transactionId = uuidv4();
      
      // Gerar número único do cliente (usando timestamp)
      const clientNumber = Date.now().toString().slice(-4);
      
      // Construir credencial no formato histórico
      const credencial = `CLIENTE${clientNumber}/${userEmail}/Plano ${selectedPlan} mês/Edificio ${buildingData.nome}/${totalPrice}`;
      
      // Criar tentativa na tabela tentativas_compra seguindo formato histórico
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: userId,
          transaction_id: transactionId,
          valor_total: totalPrice,
          credencial: credencial,
          predio: buildingData.nome,
          predios_selecionados: [], // Array vazio conforme formato histórico
          price_locked: false, // false conforme formato histórico
          price_calculation_log: {} // Objeto vazio conforme formato histórico
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar tentativa: ${error.message}`);
      }
      
      console.log('✅ [TentativaHelper] Tentativa criada:', {
        tentativaId: tentativa.id,
        transactionId: tentativa.transaction_id,
        prediosSelecionados,
        valorTotal: totalPrice
      });
      
      return {
        success: true,
        tentativaId: tentativa.id
      };
      
    } catch (error: any) {
      console.error('❌ [TentativaHelper] Erro ao criar tentativa:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao criar tentativa'
      };
    }
  };
  
  return {
    createTentativa
  };
};