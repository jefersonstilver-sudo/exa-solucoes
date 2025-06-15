
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Export the interface PixPaymentData with all required properties
export interface PixPaymentData {
  qrCodeBase64?: string;
  qrCode?: string;
  paymentId?: string;
  status?: string;
  createdAt?: string;
  pedidoId?: string;
  valorTotal?: number;
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

      // CORREÇÃO: Buscar por transaction_id em vez de ID direto
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('transaction_id', pedidoId)
        .single();

      if (pedidoError || !pedido) {
        // Se não encontrou por transaction_id, tentar por ID direto
        const { data: pedidoById, error: errorById } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (errorById || !pedidoById) {
          throw new Error(`Pedido não encontrado: ${pedidoError?.message || errorById?.message}`);
        }

        // Usar o pedido encontrado por ID
        console.log("✅ [usePixPayment] Pedido encontrado por ID:", pedidoById.id);
        
        const pixData = await processPixPayment(pedidoById);
        setPaymentData(pixData);
      } else {
        console.log("✅ [usePixPayment] Pedido encontrado por transaction_id:", pedido.id);
        
        // Verificar se já tem dados de PIX
        const logPagamento = pedido.log_pagamento as any;
        const existingPixData = logPagamento?.pix_data;
        
        if (existingPixData && existingPixData.qrCodeBase64) {
          console.log("✅ [usePixPayment] Dados PIX já existentes");
          setPaymentData({
            qrCodeBase64: existingPixData.qrCodeBase64,
            qrCode: existingPixData.qrCode,
            paymentId: existingPixData.paymentId,
            status: existingPixData.status || 'pending',
            createdAt: pedido.created_at,
            pedidoId: pedido.id,
            valorTotal: pedido.valor_total
          });
        } else {
          // Processar novo pagamento PIX
          const pixData = await processPixPayment(pedido);
          setPaymentData(pixData);
        }
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro:", error);
      setError(error.message || 'Erro ao carregar pagamento');
      toast.error(`Erro no pagamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processPixPayment = async (pedido: any): Promise<PixPaymentData> => {
    console.log("🔄 [usePixPayment] Processando pagamento PIX para pedido:", pedido.id);
    
    const { data, error } = await supabase.functions.invoke('process-pix-payment', {
      body: {
        transactionId: pedido.transaction_id || pedido.id,
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

    const pixPaymentData: PixPaymentData = {
      qrCodeBase64: data.pixData.qrCodeBase64,
      qrCode: data.pixData.qrCode,
      paymentId: data.pixData.paymentId,
      status: data.pixData.status,
      createdAt: new Date().toISOString(),
      pedidoId: pedido.id,
      valorTotal: data.amount || pedido.valor_total
    };

    toast.success("QR Code PIX gerado com sucesso!");
    return pixPaymentData;
  };

  const refreshPaymentStatus = async () => {
    if (!pedidoId) return;
    
    try {
      console.log("🔄 [usePixPayment] Atualizando status do pagamento");
      
      // Buscar por transaction_id primeiro
      let pedido;
      const { data: pedidoByTx } = await supabase
        .from('pedidos')
        .select('*')
        .eq('transaction_id', pedidoId)
        .single();

      if (pedidoByTx) {
        pedido = pedidoByTx;
      } else {
        const { data: pedidoById } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();
        pedido = pedidoById;
      }

      if (!pedido) {
        throw new Error('Pedido não encontrado para atualização');
      }

      // Atualizar status se mudou
      if (pedido.status === 'pago' && paymentData) {
        setPaymentData(prev => ({
          ...prev,
          status: 'approved',
          valorTotal: pedido.valor_total
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
