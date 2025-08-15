
// Sistema Aprimorado de Captura de Tentativas - TEMPORARIAMENTE DESABILITADO

import { useState } from 'react';
import { useUserSession } from './useUserSession';
import { CartItem } from '@/types/payment';
import { logSystemEvent } from '@/utils/auditLogger';
import { toast } from 'sonner';

interface CaptureAttemptResult {
  success: boolean;
  tentativaId?: string;
  error?: string;
}

export const useEnhancedAttemptCapture = () => {
  const { user } = useUserSession();
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAttempt = async (
    transactionId: string,
    cartItems: CartItem[],
    selectedPlan: number,
    calculatedPrice: number,
    mercadopagoTransactionId?: string
  ): Promise<CaptureAttemptResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsCapturing(true);

    try {
      // Usar a função de persistência diretamente via import dinâmico
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log("📝 [EnhancedAttemptCapture] Salvando tentativa real com transaction_id:", mercadopagoTransactionId);

      // Extrair IDs dos prédios e painéis dos itens do carrinho
      const panelIds = cartItems.map(item => item.panel.id);
      const buildingIds = cartItems.map(item => item.panel.building_id);

      // Inserir tentativa na tabela
      const { data: savedAttempt, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: user.id,
          valor_total: calculatedPrice,
          predios_selecionados: Array.from(new Set(buildingIds)).map(id => String(id)),
          transaction_id: mercadopagoTransactionId, // CRÍTICO: Salvar o transaction_id do MercadoPago
          credencial: JSON.stringify({
            panel_ids: panelIds,
            building_ids: Array.from(new Set(buildingIds)),
            selected_plan: selectedPlan,
            cart_items: cartItems,
            calculated_price: calculatedPrice,
            transaction_id: transactionId
          })
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Falha ao salvar tentativa de compra: ${error.message}`);
      }

      if (!savedAttempt?.id) {
        throw new Error('Falha ao salvar tentativa de compra');
      }

      console.log("✅ [EnhancedAttemptCapture] Tentativa salva:", {
        tentativaId: savedAttempt.id,
        transactionId,
        mercadopagoTransactionId,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      // Log para auditoria
      logSystemEvent('ENHANCED_ATTEMPT_CAPTURED_REAL', {
        tentativaId: savedAttempt.id,
        transactionId,
        mercadopagoTransactionId,
        userId: user.id,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        priceLocked: true
      });

      return { success: true, tentativaId: savedAttempt.id };

    } catch (error: any) {
      console.error("❌ [EnhancedAttemptCapture] Erro na captura:", error);
      
      logSystemEvent('ATTEMPT_CAPTURE_ERROR', {
        transactionId,
        mercadopagoTransactionId,
        error: error.message,
        userId: user.id
      }, 'ERROR');

      return { success: false, error: error.message };
    } finally {
      setIsCapturing(false);
    }
  };

  // Buscar tentativa por transaction_id (simulado)
  const getAttemptByTransactionId = async (transactionId: string) => {
    console.log("⚠️ [EnhancedAttemptCapture] Função temporariamente desabilitada");
    return null;
  };

  // Verificar duplicações por usuário (simulado)
  const checkForDuplicates = async (userId: string, valorTotal: number): Promise<any[]> => {
    console.log("⚠️ [EnhancedAttemptCapture] Verificação de duplicatas temporariamente desabilitada");
    return [];
  };

  // Limpar tentativas antigas órfãs (simulado)
  const cleanupOrphanedAttempts = async (): Promise<number> => {
    console.log("⚠️ [EnhancedAttemptCapture] Limpeza temporariamente desabilitada");
    return 0;
  };

  return {
    isCapturing,
    captureAttempt,
    getAttemptByTransactionId,
    checkForDuplicates,
    cleanupOrphanedAttempts
  };
};
