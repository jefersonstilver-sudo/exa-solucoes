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
      
      const transactionId = uuidv4();
      
      // Criar tentativa na tabela tentativas_compra
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: userId,
          transaction_id: transactionId,
          valor_total: totalPrice,
          predios_selecionados: prediosSelecionados,
          price_locked: true,
          price_calculation_log: {
            plan_months: selectedPlan,
            panel_count: cartItems.length,
            building_count: prediosSelecionados.length,
            final_price: totalPrice,
            calculated_at: new Date().toISOString()
          }
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