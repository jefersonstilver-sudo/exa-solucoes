
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// CORREÇÃO: Exportar a interface PixPaymentData
export interface PixPaymentData {
  qrCodeBase64?: string;
  qrCode?: string;
  paymentId?: string;
  status?: string;
  createdAt?: string;
}

export const usePixPayment = (pedidoId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);

  useEffect(() => {
    if (!pedidoId) {
      setError("ID do pedido não fornecido");
      setIsLoading(false);
      return;
    }

    loadPaymentData();
  }, [pedidoId]);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 [usePixPayment] Carregando dados do pagamento:", pedidoId);

      // CORREÇÃO: Buscar pedido diretamente por ID
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError || !pedido) {
        throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
      }

      console.log("✅ [usePixPayment] Pedido carregado:", {
        id: pedido.id,
        status: pedido.status,
        transaction_id: pedido.transaction_id,
        valor_total: pedido.valor_total
      });

      // CORREÇÃO: Verificar se já tem dados de PIX com type assertion
      const logPagamento = pedido.log_pagamento as any;
      const pixData = logPagamento?.pix_data;
      
      if (pixData) {
        console.log("✅ [usePixPayment] Dados PIX encontrados no pedido");
        setPaymentData({
          qrCodeBase64: pixData.qrCodeBase64,
          qrCode: pixData.qrCode,
          paymentId: pixData.paymentId,
          status: pixData.status || 'pending',
          createdAt: pedido.created_at
        });
      } else {
        // Se não tem dados PIX, processar pagamento
        console.log("🔄 [usePixPayment] Processando pagamento PIX...");
        
        const { data, error } = await supabase.functions.invoke('process-pix-payment', {
          body: {
            transactionId: pedido.transaction_id,
            pedidoId: pedido.id
          }
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Falha ao processar pagamento PIX');
        }

        console.log("✅ [usePixPayment] Pagamento PIX processado:", data);

        setPaymentData({
          qrCodeBase64: data.pixData.qrCodeBase64,
          qrCode: data.pixData.qrCode,
          paymentId: data.pixData.paymentId,
          status: data.pixData.status,
          createdAt: new Date().toISOString()
        });

        toast.success("QR Code PIX gerado com sucesso!");
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro:", error);
      setError(error.message || 'Erro ao carregar pagamento');
      toast.error(`Erro no pagamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!pedidoId) return;
    
    try {
      console.log("🔄 [usePixPayment] Atualizando status do pagamento");
      
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento')
        .eq('id', pedidoId)
        .single();

      if (error) throw error;

      // Atualizar status se mudou
      if (pedido.status === 'pago' && paymentData) {
        setPaymentData(prev => ({
          ...prev,
          status: 'approved'
        }));
        toast.success("Pagamento confirmado!");
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro ao atualizar status:", error);
    }
  };

  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};
