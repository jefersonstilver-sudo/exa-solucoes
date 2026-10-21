
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { verifyAsaasOrder } from '@/services/asaasPaymentService';

interface PendingOrder {
  id: string;
  client_id: string;
  valor_total: number;
  status: string;
  created_at: string;
  client_email?: string;
}

interface ReconciliationResult {
  totalPending: number;
  totalValue: number;
  correctedOrders: number;
  errors: string[];
}

export const useOrderReconciliation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const reconcilePendingOrders = async (): Promise<ReconciliationResult> => {
    setIsProcessing(true);
    
    try {
      console.log('🔍 [RECONCILIATION] Iniciando auditoria de pedidos pendentes');

      // Buscar pedidos pendentes há mais de 15 minutos
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data: pendingOrders, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          client_id,
          valor_total,
          status,
          created_at,
          log_pagamento
        `)
        .eq('status', 'pendente')
        .lt('created_at', fifteenMinutesAgo.toISOString());

      if (error) {
        throw error;
      }

      console.log(`📊 [RECONCILIATION] Encontrados ${pendingOrders?.length || 0} pedidos suspeitos`);

      const reconciliationResult: ReconciliationResult = {
        totalPending: pendingOrders?.length || 0,
        totalValue: pendingOrders?.reduce((sum, order) => sum + (order.valor_total || 0), 0) || 0,
        correctedOrders: 0,
        errors: []
      };

      for (const order of pendingOrders || []) {
        try { await verifyAsaasOrder(order.id); }
        catch { reconciliationResult.errors.push(`Consulta Asaas indisponível: ${order.id}`); }
      }
      toast.info('Consulta concluída; nenhuma baixa automática');

      setResult(reconciliationResult);
      
      if (reconciliationResult.correctedOrders > 0) {
        toast.success(`${reconciliationResult.correctedOrders} pedidos corrigidos com sucesso!`);
      }
      
      if (reconciliationResult.errors.length > 0) {
        toast.warning(`${reconciliationResult.errors.length} erros encontrados durante a reconciliação`);
      }

      console.log('✅ [RECONCILIATION] Auditoria concluída:', reconciliationResult);
      
      return reconciliationResult;

    } catch (error: any) {
      console.error('❌ [RECONCILIATION] Erro na auditoria:', error);
      toast.error(`Erro na auditoria: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const getPendingOrdersAlert = async (): Promise<number> => {
    try {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { count, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .eq('status', 'pendente')
        .lt('created_at', fifteenMinutesAgo.toISOString());

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [RECONCILIATION] Erro ao verificar alertas:', error);
      return 0;
    }
  };

  return {
    reconcilePendingOrders,
    getPendingOrdersAlert,
    isProcessing,
    result
  };
};
