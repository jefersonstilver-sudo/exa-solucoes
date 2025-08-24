
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';

interface AttemptFinalizationResult {
  success: boolean;
  pedidoId?: string;
  error?: string;
  existingPedidoId?: string;
  redirectToExisting?: boolean;
}

export const useAttemptFinalizer = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUserSession();
  const navigate = useNavigate();

  const finalizeAttemptToOrder = useCallback(async (attemptId: string): Promise<AttemptFinalizationResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsProcessing(true);

    try {
      console.log('🎯 [AttemptFinalizer] Iniciando finalização da tentativa:', attemptId);

      // 1. Buscar tentativa
      const { data: tentativa, error: tentativaError } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('id', attemptId)
        .eq('id_user', user.id)
        .single();

      if (tentativaError || !tentativa) {
        throw new Error('Tentativa não encontrada ou não autorizada');
      }

      console.log('✅ [AttemptFinalizer] Tentativa encontrada:', tentativa);

      // 2. NOVO: Verificar se já existe pedido para esta tentativa
      const { data: existingOrderByAttempt, error: orderCheckError } = await supabase
        .from('pedidos')
        .select('id, status')
        .eq('source_tentativa_id', attemptId)
        .maybeSingle();

      if (existingOrderByAttempt && !orderCheckError) {
        console.log('🔄 [AttemptFinalizer] Pedido já existe para esta tentativa:', existingOrderByAttempt.id);
        
        logSystemEvent('ATTEMPT_REDIRECT_TO_EXISTING', {
          attemptId,
          existingPedidoId: existingOrderByAttempt.id,
          userId: user.id
        });

        // Redirecionar para o pedido existente
        navigate(`/payment?pedido=${existingOrderByAttempt.id}&method=pix`);
        
        return {
          success: true,
          existingPedidoId: existingOrderByAttempt.id,
          redirectToExisting: true
        };
      }

      // 3. NOVO: Verificar se já existe pedido pendente com mesmo valor e tempo próximo (fallback)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: existingPendingOrder, error: pendingCheckError } = await supabase
        .from('pedidos')
        .select('id, status, created_at')
        .eq('client_id', user.id)
        .eq('status', 'pendente')
        .eq('valor_total', tentativa.valor_total)
        .gte('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPendingOrder && !pendingCheckError) {
        console.log('🔄 [AttemptFinalizer] Pedido pendente similar encontrado:', existingPendingOrder.id);
        
        logSystemEvent('ATTEMPT_REDIRECT_TO_PENDING', {
          attemptId,
          existingPedidoId: existingPendingOrder.id,
          valorTotal: tentativa.valor_total,
          userId: user.id
        });

        // Redirecionar para o pedido pendente existente
        navigate(`/payment?pedido=${existingPendingOrder.id}&method=pix`);
        
        return {
          success: true,
          existingPedidoId: existingPendingOrder.id,
          redirectToExisting: true
        };
      }

      // 4. Extrair dados do backup se disponível
      let cartItemsBackup = [];
      let panelIds: string[] = [];
      let predioIds: string[] = [];
      let planoMeses = 1;

      try {
        if (tentativa.credencial && typeof tentativa.credencial === 'object') {
          const credencial = tentativa.credencial as any;
          
          if (credencial.cart_items_backup && Array.isArray(credencial.cart_items_backup)) {
            cartItemsBackup = credencial.cart_items_backup;
            panelIds = cartItemsBackup.map((item: any) => item.panel_id).filter(Boolean);
            predioIds = cartItemsBackup.map((item: any) => item.building_id).filter(Boolean);
            
            // Inferir plano a partir da duração
            const firstItem = cartItemsBackup[0];
            if (firstItem && firstItem.duration) {
              planoMeses = firstItem.duration;
            }
          }
        }

        // Fallback: usar predios_selecionados se backup não estiver disponível
        if (predioIds.length === 0 && tentativa.predios_selecionados) {
          predioIds = tentativa.predios_selecionados.map(String);
        }
      } catch (error) {
        console.warn('⚠️ [AttemptFinalizer] Erro ao extrair backup, usando fallback:', error);
      }

      if (predioIds.length === 0) {
        throw new Error('Dados da tentativa incompletos. Por favor, faça um novo pedido.');
      }

      console.log('📋 [AttemptFinalizer] Dados extraídos:', {
        panelIds: panelIds.length,
        predioIds: predioIds.length,
        planoMeses,
        valorTotal: tentativa.valor_total
      });

      // 5. Criar pedido pendente
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          client_id: user.id,
          source_tentativa_id: tentativa.id, // CRÍTICO: Vincular à tentativa
          valor_total: tentativa.valor_total,
          plano_meses: planoMeses,
          lista_paineis: panelIds,
          lista_predios: predioIds,
          status: 'pendente',
          termos_aceitos: true,
          price_sync_verified: true,
          transaction_id: `from_attempt_${attemptId}_${Date.now()}`
        })
        .select()
        .single();

      if (pedidoError) {
        // Se o erro for de duplicação, tentar buscar o pedido existente
        if (pedidoError.code === '23505') { // Unique constraint violation
          console.log('🔄 [AttemptFinalizer] Violação de constraint única, buscando pedido existente...');
          
          const { data: foundOrder } = await supabase
            .from('pedidos')
            .select('id')
            .eq('source_tentativa_id', attemptId)
            .single();

          if (foundOrder) {
            navigate(`/payment?pedido=${foundOrder.id}&method=pix`);
            
            return {
              success: true,
              existingPedidoId: foundOrder.id,
              redirectToExisting: true
            };
          }
        }
        
        throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
      }

      console.log('✅ [AttemptFinalizer] Pedido criado:', pedido.id);

      logSystemEvent('ATTEMPT_FINALIZED_TO_ORDER', {
        attemptId,
        pedidoId: pedido.id,
        valorTotal: tentativa.valor_total,
        planoMeses,
        prediosCount: predioIds.length,
        paineisCount: panelIds.length,
        userId: user.id
      });

      // 6. Redirecionar para pagamento
      navigate(`/payment?pedido=${pedido.id}&method=pix`);

      return {
        success: true,
        pedidoId: pedido.id
      };

    } catch (error: any) {
      console.error('❌ [AttemptFinalizer] Erro:', error);
      
      logSystemEvent('ATTEMPT_FINALIZATION_ERROR', {
        attemptId,
        error: error.message,
        userId: user.id
      }, 'ERROR');

      toast.error(error.message || 'Erro ao finalizar tentativa');
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user, navigate]);

  return {
    finalizeAttemptToOrder,
    isProcessing
  };
};
