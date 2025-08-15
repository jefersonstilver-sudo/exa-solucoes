// Hook para corrigir sincronização de mercadopago_transaction_id

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFixMercadoPagoSync = () => {
  const [isFixing, setIsFixing] = useState(false);

  const fixMercadoPagoSync = async (paymentId: string, pedidoId: string) => {
    setIsFixing(true);
    
    try {
      console.log('🔧 Corrigindo sincronização MercadoPago:', { paymentId, pedidoId });

      // 1. Atualizar pedido com transaction_id correto
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({ mercadopago_transaction_id: paymentId })
        .eq('id', pedidoId);

      if (pedidoError) {
        throw new Error(`Erro ao atualizar pedido: ${pedidoError.message}`);
      }

      // 2. Buscar tentativas relacionadas e atualizar
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('client_id, valor_total')
        .eq('id', pedidoId)
        .single();

      if (pedido) {
        const { data: tentativas } = await supabase
          .from('tentativas_compra')
          .select('*')
          .eq('id_user', pedido.client_id)
          .eq('valor_total', pedido.valor_total)
          .order('created_at', { ascending: false })
          .limit(5);

        if (tentativas && tentativas.length > 0) {
          // Atualizar a tentativa mais recente
          const tentativaAtualizada = tentativas[0];
          await supabase
            .from('tentativas_compra')
            .update({ transaction_id: paymentId })
            .eq('id', tentativaAtualizada.id);

          console.log('✅ Tentativa atualizada:', tentativaAtualizada.id);
        }
      }

      toast.success('Sincronização MercadoPago corrigida com sucesso!');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Erro ao corrigir sincronização:', error);
      toast.error(`Erro: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsFixing(false);
    }
  };

  const checkSyncStatus = async (pedidoId: string) => {
    try {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('mercadopago_transaction_id, client_id, valor_total')
        .eq('id', pedidoId)
        .single();

      if (!pedido) {
        return { synced: false, message: 'Pedido não encontrado' };
      }

      if (!pedido.mercadopago_transaction_id) {
        return { synced: false, message: 'Transaction ID ausente no pedido' };
      }

      // Verificar se existe tentativa com mesmo transaction_id
      const { data: tentativa } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('transaction_id', pedido.mercadopago_transaction_id)
        .eq('id_user', pedido.client_id)
        .single();

      if (tentativa) {
        return { synced: true, message: 'Sincronização OK' };
      } else {
        return { synced: false, message: 'Transaction ID não encontrado nas tentativas' };
      }

    } catch (error: any) {
      return { synced: false, message: `Erro: ${error.message}` };
    }
  };

  return {
    isFixing,
    fixMercadoPagoSync,
    checkSyncStatus
  };
};