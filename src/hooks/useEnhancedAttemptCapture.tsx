
// Sistema Aprimorado de Captura de Tentativas com Transação Única

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    calculatedPrice: number
  ): Promise<CaptureAttemptResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsCapturing(true);

    try {
      console.log("📝 [EnhancedAttemptCapture] Capturando tentativa com transação única:", {
        transactionId,
        calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      // Verificar se já existe tentativa para esta transação
      const { data: existingAttempt } = await supabase
        .from('tentativas_compra')
        .select('id')
        .eq('transaction_id', transactionId)
        .single();

      if (existingAttempt) {
        console.log("✅ [EnhancedAttemptCapture] Tentativa já existe:", existingAttempt.id);
        return { success: true, tentativaId: existingAttempt.id };
      }

      // Preparar dados dos prédios selecionados
      const prediosSelecionados = cartItems.map(item => item.panel.buildings?.id).filter(Boolean);

      // Criar tentativa com preço bloqueado
      const { data: tentativa, error } = await supabase
        .from('tentativas_compra')
        .insert({
          id_user: user.id,
          transaction_id: transactionId,
          predios_selecionados: prediosSelecionados,
          valor_total: calculatedPrice,
          price_locked: true,
          price_calculation_log: {
            calculated_at: new Date().toISOString(),
            cart_items: cartItems.map(item => ({
              panel_id: item.panel.id,
              building_name: item.panel.buildings?.nome,
              preco_base: item.panel.buildings?.preco_base,
              duration: item.duration
            })),
            selected_plan: selectedPlan,
            final_price: calculatedPrice,
            calculation_method: 'enhanced_unified_system'
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("✅ [EnhancedAttemptCapture] Tentativa capturada com sucesso:", {
        tentativaId: tentativa.id,
        transactionId,
        valorTotal: tentativa.valor_total,
        priceLocked: tentativa.price_locked
      });

      // Log para auditoria
      logSystemEvent('ENHANCED_ATTEMPT_CAPTURED', {
        tentativaId: tentativa.id,
        transactionId,
        userId: user.id,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        priceLocked: true
      });

      return { success: true, tentativaId: tentativa.id };

    } catch (error: any) {
      console.error("❌ [EnhancedAttemptCapture] Erro na captura:", error);
      
      logSystemEvent('ATTEMPT_CAPTURE_ERROR', {
        transactionId,
        error: error.message,
        userId: user.id
      }, 'ERROR');

      return { success: false, error: error.message };
    } finally {
      setIsCapturing(false);
    }
  };

  // Buscar tentativa por transaction_id
  const getAttemptByTransactionId = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.warn("⚠️ [EnhancedAttemptCapture] Tentativa não encontrada:", transactionId);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ [EnhancedAttemptCapture] Erro ao buscar tentativa:", error);
      return null;
    }
  };

  // Verificar duplicações por usuário
  const checkForDuplicates = async (userId: string, valorTotal: number): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('id_user', userId)
        .eq('valor_total', valorTotal)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Últimas 1 hora
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 1) {
        console.warn("⚠️ [EnhancedAttemptCapture] Possíveis duplicatas detectadas:", {
          userId,
          valorTotal,
          count: data.length
        });

        logSystemEvent('POTENTIAL_DUPLICATES_DETECTED', {
          userId,
          valorTotal,
          duplicateCount: data.length,
          attempts: data.map(d => ({ id: d.id, created_at: d.created_at }))
        }, 'WARNING');
      }

      return data || [];
    } catch (error) {
      console.error("❌ [EnhancedAttemptCapture] Erro ao verificar duplicatas:", error);
      return [];
    }
  };

  // Limpar tentativas antigas órfãs
  const cleanupOrphanedAttempts = async (): Promise<number> => {
    try {
      // Remover tentativas com mais de 2 horas sem pedido correspondente
      const { data: orphaned, error: selectError } = await supabase
        .from('tentativas_compra')
        .select('id')
        .lt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .is('transaction_id', null); // Tentativas antigas sem transaction_id

      if (selectError) {
        throw selectError;
      }

      if (!orphaned || orphaned.length === 0) {
        return 0;
      }

      const { error: deleteError } = await supabase
        .from('tentativas_compra')
        .delete()
        .in('id', orphaned.map(o => o.id));

      if (deleteError) {
        throw deleteError;
      }

      console.log("🧹 [EnhancedAttemptCapture] Limpeza concluída:", orphaned.length);
      return orphaned.length;

    } catch (error) {
      console.error("❌ [EnhancedAttemptCapture] Erro na limpeza:", error);
      return 0;
    }
  };

  return {
    isCapturing,
    captureAttempt,
    getAttemptByTransactionId,
    checkForDuplicates,
    cleanupOrphanedAttempts
  };
};
