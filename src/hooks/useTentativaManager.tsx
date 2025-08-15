import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateTentativaParams {
  userId: string;
  cartItems: any[];
  selectedPlan: number;
  valorTotal: number;
}

interface TentativaResult {
  success: boolean;
  tentativaId?: string;
  error?: string;
}

export const useTentativaManager = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTentativa = async (params: CreateTentativaParams): Promise<TentativaResult> => {
    const { userId, cartItems, selectedPlan, valorTotal } = params;
    
    setIsCreating(true);
    
    try {
      // Extrair IDs dos prédios selecionados
      const prediosSelecionados = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicados

      // Gerar transaction_id único
      const transactionId = uuidv4();

      // Criar tentativa na tabela tentativas_compra
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: userId,
          valor_total: valorTotal,
          predios_selecionados: prediosSelecionados,
          transaction_id: transactionId,
          price_locked: true,
          price_calculation_log: {
            selectedPlan,
            cartItemsCount: cartItems.length,
            valorTotal,
            prediosSelecionados,
            createdAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar tentativa: ${error.message}`);
      }

      console.log('✅ [useTentativaManager] Tentativa criada:', {
        tentativaId: tentativa.id,
        transactionId: tentativa.transaction_id,
        valorTotal,
        prediosCount: prediosSelecionados.length
      });

      return {
        success: true,
        tentativaId: tentativa.id
      };

    } catch (error: any) {
      console.error('❌ [useTentativaManager] Erro ao criar tentativa:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao criar tentativa'
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTentativa,
    isCreating
  };
};