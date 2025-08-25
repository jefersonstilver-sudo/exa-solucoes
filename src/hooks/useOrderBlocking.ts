import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOrderBlocking = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const blockOrder = async (pedidoId: string, reason: string) => {
    try {
      setIsBlocking(true);
      
      const { data, error } = await supabase.rpc('block_order_secure', {
        p_pedido_id: pedidoId,
        p_reason: reason,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Erro ao bloquear pedido:', error);
        throw error;
      }

      if ((data as any)?.success) {
        toast.success('Pedido bloqueado com sucesso');
      } else {
        throw new Error((data as any)?.error || 'Erro desconhecido ao bloquear pedido');
      }
    } catch (error: any) {
      console.error('Erro ao bloquear pedido:', error);
      toast.error(error.message || 'Erro ao bloquear pedido');
      throw error;
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockOrder = async (pedidoId: string, reason: string = 'Desbloqueado pelo administrador') => {
    try {
      setIsUnblocking(true);
      
      const { data, error } = await supabase.rpc('unblock_order_secure', {
        p_pedido_id: pedidoId,
        p_reason: reason
      });

      if (error) {
        console.error('Erro ao desbloquear pedido:', error);
        throw error;
      }

      if ((data as any)?.success) {
        toast.success('Pedido desbloqueado com sucesso');
      } else {
        throw new Error((data as any)?.error || 'Erro desconhecido ao desbloquear pedido');
      }
    } catch (error: any) {
      console.error('Erro ao desbloquear pedido:', error);
      toast.error(error.message || 'Erro ao desbloquear pedido');
      throw error;
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