
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCheckoutDataPersistence = () => {
  const [debugMode, setDebugMode] = useState(false);

  // Debug: Verificar integridade dos dados do carrinho
  const verifyCartDataIntegrity = async (cartItems: any[], userId: string) => {
    if (!debugMode) return;

    console.log('🔍 [CHECKOUT_DEBUG] Verificando integridade dos dados do carrinho...');
    console.log('📊 [CHECKOUT_DEBUG] Cart items:', cartItems);
    
    if (!cartItems || cartItems.length === 0) {
      console.warn('⚠️ [CHECKOUT_DEBUG] Carrinho vazio!');
      return;
    }

    // Verificar se os painéis existem no banco
    const panelIds = cartItems.map(item => item.panel?.id || item.id).filter(Boolean);
    console.log('🔍 [CHECKOUT_DEBUG] Panel IDs extraídos:', panelIds);

    if (panelIds.length > 0) {
      const { data: existingPanels, error } = await supabase
        .from('painels')
        .select('id, building_id')
        .in('id', panelIds);

      if (error) {
        console.error('❌ [CHECKOUT_DEBUG] Erro ao verificar painéis:', error);
      } else {
        console.log('✅ [CHECKOUT_DEBUG] Painéis encontrados:', existingPanels);
        
        const buildingIds = [...new Set(existingPanels?.map(p => p.building_id).filter(Boolean) || [])];
        console.log('🏢 [CHECKOUT_DEBUG] Building IDs correspondentes:', buildingIds);
      }
    }

    // CORREÇÃO: Verificar tentativas na tabela pedidos (status='tentativa')
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('client_id', userId)
      .eq('status', 'tentativa')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!attemptsError && recentAttempts) {
      console.log('📝 [CHECKOUT_DEBUG] Tentativas recentes:', recentAttempts);
    }
  };

  // Salvar tentativa de compra com dados completos
  const saveCompletePurchaseAttempt = async (
    userId: string, 
    cartItems: any[], 
    totalPrice: number
  ) => {
    try {
      console.log('💾 [CHECKOUT_PERSISTENCE] Salvando tentativa de compra...');
      
      // Extrair dados dos items do carrinho
      const panelIds = cartItems.map(item => {
        const panelId = item.panel?.id || item.id;
        console.log('🔍 [CHECKOUT_PERSISTENCE] Extraindo panel ID:', panelId, 'do item:', item);
        return panelId;
      }).filter(Boolean);

      console.log('📊 [CHECKOUT_PERSISTENCE] Panel IDs finais:', panelIds);

      // Buscar building IDs correspondentes
      const { data: panelData, error: panelError } = await supabase
        .from('painels')
        .select('id, building_id')
        .in('id', panelIds);

      if (panelError) {
        console.error('❌ [CHECKOUT_PERSISTENCE] Erro ao buscar painéis:', panelError);
      }

      const buildingIds = [...new Set(
        (panelData || []).map(p => p.building_id).filter(Boolean)
      )];

      console.log('🏢 [CHECKOUT_PERSISTENCE] Building IDs extraídos:', buildingIds);

      // CORREÇÃO: Salvar tentativa na tabela pedidos com status='tentativa'
      const attemptData = {
        client_id: userId,
        valor_total: totalPrice,
        lista_paineis: panelIds,
        lista_predios: buildingIds,
        status: 'tentativa',
        plano_meses: 1,
        termos_aceitos: false,
        log_pagamento: {
          panel_ids: panelIds,
          building_ids: buildingIds,
          cart_items_backup: cartItems.map(item => ({
            panel_id: item.panel?.id || item.id,
            building_id: item.panel?.building_id,
            panel_name: item.panel?.buildings?.nome || 'Nome não disponível',
            duration: item.duration || 30,
            price: item.price || 0
          })),
          timestamp: new Date().toISOString(),
          attempt_type: 'checkout_persistence'
        }
      };

      console.log('💾 [CHECKOUT_PERSISTENCE] Dados da tentativa:', attemptData);

      const { data: savedAttempt, error: saveError } = await supabase
        .from('pedidos')
        .insert(attemptData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ [CHECKOUT_PERSISTENCE] Erro ao salvar tentativa:', saveError);
        throw saveError;
      }

      console.log('✅ [CHECKOUT_PERSISTENCE] Tentativa salva:', savedAttempt);
      return savedAttempt;

    } catch (error: any) {
      console.error('💥 [CHECKOUT_PERSISTENCE] Erro geral:', error);
      throw error;
    }
  };

  // Recuperar dados de uma tentativa
  const recoverAttemptData = async (userId: string, totalPrice?: number) => {
    try {
      console.log('🔄 [CHECKOUT_PERSISTENCE] Tentando recuperar dados da tentativa...');

      let query = supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'tentativa')
        .order('created_at', { ascending: false });

      if (totalPrice) {
        query = query.eq('valor_total', totalPrice);
      }

      const { data: attempts, error } = await query.limit(1);

      if (error) {
        console.error('❌ [CHECKOUT_PERSISTENCE] Erro ao buscar tentativa:', error);
        return null;
      }

      if (!attempts || attempts.length === 0) {
        console.log('⚠️ [CHECKOUT_PERSISTENCE] Nenhuma tentativa encontrada');
        return null;
      }

      const attempt = attempts[0];
      console.log('📋 [CHECKOUT_PERSISTENCE] Tentativa encontrada:', attempt);

      // Tentar extrair dados do log_pagamento
      let recoveredData = null;
      if (attempt.log_pagamento) {
        try {
          const logData = attempt.log_pagamento;
          recoveredData = {
            panelIds: logData.panel_ids || attempt.lista_paineis || [],
            buildingIds: logData.building_ids || attempt.lista_predios || [],
            cartItemsBackup: logData.cart_items_backup || []
          };
        } catch (parseError) {
          console.error('❌ [CHECKOUT_PERSISTENCE] Erro ao extrair dados do log:', parseError);
        }
      }

      return {
        attempt,
        recoveredData,
        buildingIds: attempt.lista_predios || [],
        panelIds: attempt.lista_paineis || [],
        totalValue: attempt.valor_total
      };

    } catch (error: any) {
      console.error('💥 [CHECKOUT_PERSISTENCE] Erro ao recuperar tentativa:', error);
      return null;
    }
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(prev => {
      const newMode = !prev;
      console.log(`🐛 [CHECKOUT_DEBUG] Debug mode ${newMode ? 'ATIVADO' : 'DESATIVADO'}`);
      if (newMode) {
        toast.info('Debug mode ativado - verificando integridade dos dados');
      }
      return newMode;
    });
  };

  return {
    verifyCartDataIntegrity,
    saveCompletePurchaseAttempt,
    recoverAttemptData,
    debugMode,
    toggleDebugMode
  };
};
