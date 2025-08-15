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

      // Buscar dados do usuário para email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !userData?.email) {
        throw new Error('Não foi possível obter dados do usuário');
      }

      // Buscar nome do primeiro prédio selecionado
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('nome')
        .eq('id', prediosSelecionados[0])
        .single();

      if (buildingError || !buildingData?.nome) {
        throw new Error('Não foi possível obter dados do prédio');
      }

      // Gerar número único do cliente usando timestamp
      const clienteNumero = Date.now().toString().slice(-4);
      
      // Criar credencial no formato histórico
      const credencial = `CLIENTE${clienteNumero}/${userData.email}/Plano ${selectedPlan} mês${selectedPlan > 1 ? 'es' : ''}/Edificio ${buildingData.nome}/${totalPrice}`;
      
      const transactionId = uuidv4();
      
      // Criar tentativa na tabela tentativas_compra com formato histórico
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: userId,
          transaction_id: transactionId,
          valor_total: totalPrice,
          credencial: credencial,
          predio: buildingData.nome,
          predios_selecionados: [], // Array vazio para manter formato histórico
          price_locked: false, // false para manter formato histórico
          price_calculation_log: {} // Objeto vazio para manter formato histórico
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