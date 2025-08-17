
// Sistema Aprimorado de Captura de Tentativas

import { useState } from 'react';
import { useUserSession } from './useUserSession';
import { CartItem } from '@/types/payment';
import { logSystemEvent } from '@/utils/auditLogger';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      console.log("📝 [EnhancedAttemptCapture] Criando tentativa real no banco de dados...");

      // CORREÇÃO RLS: Extrair dados dos items do carrinho (sem SELECT em painels)
      const panelIds = cartItems.map(item => {
        const panelId = item.panel?.id;
        console.log('🔍 [EnhancedAttemptCapture] Extraindo panel ID:', panelId, 'do item:', item);
        return panelId;
      }).filter(Boolean);

      console.log('📊 [EnhancedAttemptCapture] Panel IDs finais:', panelIds);

      // CORREÇÃO RLS: Extrair building IDs diretamente do cartItems (sem consulta ao banco)
      const buildingIds = [...new Set(
        cartItems.map(item => item.panel.buildings?.id).filter(Boolean)
      )];

      console.log('🏢 [EnhancedAttemptCapture] Building IDs extraídos (RLS-safe):', buildingIds);

      // Criar dados da tentativa
      const attemptData = {
        id_user: user.id,
        valor_total: calculatedPrice,
        transaction_id: transactionId,
        predios_selecionados: buildingIds.map(id => String(id)),
        price_locked: true,
        price_calculation_log: {
          selectedPlan,
          cartItemsCount: cartItems.length,
          calculatedAt: new Date().toISOString(),
          panelIds,
          buildingIds
        },
        credencial: JSON.stringify({
          panel_ids: panelIds,
          building_ids: buildingIds,
          cart_items_backup: cartItems.map(item => ({
            panel_id: item.panel?.id,
            building_id: item.panel.buildings?.id,
            building_name: item.panel?.buildings?.nome || 'Nome não disponível',
            duration: selectedPlan, // Usar selectedPlan em vez de item.duration
            preco_base: item.panel?.buildings?.preco_base || 0,
            panel_code: item.panel?.code,
            panel_location: item.panel?.localizacao
          })),
          capture_method: 'enhanced_rls_safe',
          version: '2.1',
          snapshot_complete: true,
          timestamp: new Date().toISOString()
        })
      };

      console.log('💾 [EnhancedAttemptCapture] Dados da tentativa:', attemptData);

      // Salvar tentativa no banco
      const { data: savedAttempt, error: saveError } = await supabase
        .from('tentativas_compra')
        .insert(attemptData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ [EnhancedAttemptCapture] Erro ao salvar tentativa:', saveError);
        throw saveError;
      }

      console.log("✅ [EnhancedAttemptCapture] Tentativa criada com sucesso:", {
        tentativaId: savedAttempt.id,
        transactionId,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      // Log para auditoria
      logSystemEvent('ENHANCED_ATTEMPT_CAPTURED', {
        tentativaId: savedAttempt.id,
        transactionId,
        userId: user.id,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        priceLocked: true,
        buildingIds
      });

      return { success: true, tentativaId: savedAttempt.id };

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
        console.error('❌ [EnhancedAttemptCapture] Erro ao buscar tentativa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ [EnhancedAttemptCapture] Erro ao buscar tentativa:', error);
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
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h

      if (error) {
        console.error('❌ [EnhancedAttemptCapture] Erro ao verificar duplicatas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [EnhancedAttemptCapture] Erro ao verificar duplicatas:', error);
      return [];
    }
  };

  // Limpar tentativas antigas órfãs
  const cleanupOrphanedAttempts = async (): Promise<number> => {
    try {
      console.log("🧹 [EnhancedAttemptCapture] Iniciando limpeza de tentativas órfãs...");
      
      // Buscar tentativas antigas sem pedidos correspondentes
      const { data: orphanedAttempts, error } = await supabase
        .from('tentativas_compra')
        .select('id')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Mais de 7 dias
        .limit(100);

      if (error) {
        console.error('❌ [EnhancedAttemptCapture] Erro ao buscar tentativas órfãs:', error);
        return 0;
      }

      if (!orphanedAttempts || orphanedAttempts.length === 0) {
        console.log("✅ [EnhancedAttemptCapture] Nenhuma tentativa órfã encontrada");
        return 0;
      }

      // Note: For now, just count - actual cleanup would need admin approval
      console.log(`🧹 [EnhancedAttemptCapture] Encontradas ${orphanedAttempts.length} tentativas órfãs`);
      return orphanedAttempts.length;

    } catch (error) {
      console.error('❌ [EnhancedAttemptCapture] Erro na limpeza:', error);
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
