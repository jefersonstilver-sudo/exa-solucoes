import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BlockOrderResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export const useOrderBlocking = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const blockOrder = async (pedidoId: string, reason: string) => {
    setIsBlocking(true);
    try {
      console.log('🚫 [ORDER_BLOCKING] Bloqueando pedido:', pedidoId, 'Motivo:', reason);

      const { data, error } = await supabase.rpc('block_order_secure', {
        p_pedido_id: pedidoId,
        p_reason: reason,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('❌ [ORDER_BLOCKING] Erro ao bloquear pedido:', error);
        throw error;
      }

      const response = data as unknown as BlockOrderResponse;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha ao bloquear pedido');
      }

      console.log('✅ [ORDER_BLOCKING] Pedido bloqueado:', response?.message);
      
      toast({
        title: "Pedido Bloqueado",
        description: `Pedido bloqueado com sucesso por: ${reason}`,
        variant: "destructive"
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [ORDER_BLOCKING] Erro:', error);
      
      toast({
        title: "Erro ao Bloquear",
        description: error.message || 'Erro desconhecido ao bloquear pedido',
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockOrder = async (pedidoId: string, reason?: string) => {
    setIsUnblocking(true);
    try {
      console.log('🔓 [ORDER_BLOCKING] Desbloqueando pedido:', pedidoId);

      const { data, error } = await supabase.rpc('unblock_order_secure', {
        p_pedido_id: pedidoId,
        p_reason: reason || 'Pedido desbloqueado pelo administrador'
      });

      if (error) {
        console.error('❌ [ORDER_BLOCKING] Erro ao desbloquear pedido:', error);
        throw error;
      }

      const response = data as unknown as BlockOrderResponse;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha ao desbloquear pedido');
      }

      console.log('✅ [ORDER_BLOCKING] Pedido desbloqueado:', response?.message);
      
      toast({
        title: "Pedido Desbloqueado",
        description: response?.message,
        variant: "default"
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [ORDER_BLOCKING] Erro:', error);
      
      toast({
        title: "Erro ao Desbloquear",
        description: error.message || 'Erro desconhecido ao desbloquear pedido',
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setIsUnblocking(false);
    }
  };

  return {
    blockOrder,
    unblockOrder,
    isBlocking,
    isUnblocking
  };
};