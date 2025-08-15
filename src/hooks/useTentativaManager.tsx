import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateTentativaParams {
  userId: string;
  prediosSelecionados: string[];
  cartItems: any[];
  selectedPlan: number;
  valorTotal: number;
}

interface TentativaResult {
  success: boolean;
  tentativaId?: string;
  transactionId?: string;
  error?: string;
}

export const useTentativaManager = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTentativa = async (params: CreateTentativaParams): Promise<TentativaResult> => {
    const { userId, prediosSelecionados, cartItems, selectedPlan, valorTotal } = params;
    
    setIsCreating(true);
    
    try {
      // Gerar IDs únicos
      const tentativaId = uuidv4();
      const transactionId = uuidv4();

      // Extrair IDs dos painéis selecionados
      const paineisSelecionados = cartItems
        .map(item => item.panel?.id)
        .filter(Boolean);

      // Criar tentativa
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id: tentativaId,
          id_user: userId,
          transaction_id: transactionId,
          predios_selecionados: prediosSelecionados,
          valor_total: valorTotal,
          price_locked: true,
          price_calculation_log: {
            plan_months: selectedPlan,
            panel_count: cartItems.length,
            calculated_price: valorTotal,
            cart_snapshot: cartItems.map(item => ({
              panel_id: item.panel?.id,
              building_id: item.panel?.buildings?.id || item.panel?.building_id,
              building_name: item.panel?.buildings?.nome,
              duration: item.duration
            })),
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar tentativa: ${error.message}`);
      }

      console.log('✅ Tentativa criada:', {
        tentativaId,
        transactionId,
        valorTotal,
        paineisSelecionados: paineisSelecionados.length
      });

      return {
        success: true,
        tentativaId: tentativa.id,
        transactionId: tentativa.transaction_id
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar tentativa:', error);
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