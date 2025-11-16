import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FixAuditResult {
  success: boolean;
  updated?: number;
  failed?: number;
  errors?: string[];
  message?: string;
}

export const useFixAuditData = () => {
  const [isFixing, setIsFixing] = useState(false);

  const fixOrderAuditData = async (orderId: string): Promise<FixAuditResult> => {
    setIsFixing(true);
    
    try {
      console.log('🔧 [FIX-AUDIT] Iniciando correção de dados de auditoria para pedido:', orderId);

      // Buscar dados do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();

      if (pedidoError || !pedido) {
        throw new Error('Pedido não encontrado');
      }

      const paymentId = (pedido.log_pagamento as any)?.pixData?.paymentId;

      if (!paymentId) {
        throw new Error('PaymentID não encontrado no pedido');
      }

      console.log('🔍 [FIX-AUDIT] PaymentID encontrado:', paymentId);

      // Buscar dados atualizados do Mercado Pago via edge function
      const { data, error } = await supabase.functions.invoke('fix-audit-data', {
        body: { orderId }
      });

      if (error) {
        console.error('❌ [FIX-AUDIT] Erro ao chamar função:', error);
        throw error;
      }

      console.log('✅ [FIX-AUDIT] Dados atualizados:', data);

      if (data.success) {
        toast.success('✅ Dados de auditoria atualizados com sucesso!');
        
        // Recarregar a página para mostrar os dados atualizados
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        return data;
      } else {
        toast.error(`❌ Erro ao atualizar: ${data.error || 'Erro desconhecido'}`);
        return data;
      }

    } catch (error: any) {
      console.error('❌ [FIX-AUDIT] Erro:', error);
      const errorMessage = error.message || 'Erro ao atualizar dados de auditoria';
      toast.error(`Erro: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsFixing(false);
    }
  };

  const fixAllOrders = async (): Promise<FixAuditResult> => {
    setIsFixing(true);
    
    try {
      console.log('🔧 [FIX-AUDIT] Iniciando correção de todos os pedidos');

      const { data, error } = await supabase.functions.invoke('fix-audit-data');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ ${data.updated} pedidos atualizados com sucesso!`);
        return data;
      } else {
        toast.error(`❌ Erro ao atualizar pedidos`);
        return data;
      }

    } catch (error: any) {
      console.error('❌ [FIX-AUDIT] Erro:', error);
      const errorMessage = error.message || 'Erro ao atualizar pedidos';
      toast.error(`Erro: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsFixing(false);
    }
  };

  return {
    fixOrderAuditData,
    fixAllOrders,
    isFixing
  };
};
