
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      console.log("🔄 [usePixPayment] Carregando dados PIX para pedido:", pedidoId);

      // Buscar pedido diretamente por ID
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError || !pedido) {
        throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
      }

      console.log("✅ [usePixPayment] Pedido encontrado:", {
        id: pedido.id,
        status: pedido.status,
        valor_total: pedido.valor_total,
        hasLogPagamento: !!pedido.log_pagamento
      });

      // Verificar se já tem dados PIX
      const logPagamento = pedido.log_pagamento as any;
      
      if (logPagamento?.pixData || logPagamento?.pix_data) {
        const pixData = logPagamento.pixData || logPagamento.pix_data;
        
        console.log("✅ [usePixPayment] Dados PIX encontrados:", {
          hasQrCodeBase64: !!pixData.qrCodeBase64,
          hasQrCode: !!pixData.qrCode,
          status: pixData.status
        });
        
        setPaymentData({
          qrCodeBase64: pixData.qrCodeBase64 || pixData.pix_base64,
          qrCode: pixData.qrCode || pixData.qrCodeText || pixData.pix_url,
          paymentId: pixData.paymentId || pixData.id,
          status: pixData.status || pedido.status,
          createdAt: pedido.created_at,
          pedidoId: pedido.id,
          valorTotal: pedido.valor_total
        });
      } else {
        // Gerar PIX via edge function
        console.log("🔄 [usePixPayment] Gerando PIX via edge function...");
        
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            pedido_id: pedido.id,
            payment_method: 'pix',
            total_amount: pedido.valor_total,
            user_email: 'cliente@exemplo.com'
          }
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Falha ao processar pagamento PIX');
        }

        console.log("✅ [usePixPayment] PIX gerado com sucesso:", data);

        // Buscar pedido atualizado
        const { data: updatedPedido, error: updateError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (!updateError && updatedPedido) {
          const updatedLogPagamento = updatedPedido.log_pagamento as any;
          const pixData = updatedLogPagamento?.pixData || updatedLogPagamento?.pix_data;
          
          if (pixData) {
            setPaymentData({
              qrCodeBase64: pixData.qrCodeBase64 || pixData.pix_base64,
              qrCode: pixData.qrCode || pixData.qrCodeText || pixData.pix_url,
              paymentId: pixData.paymentId || pixData.id,
              status: pixData.status || 'pending',
              createdAt: updatedPedido.created_at,
              pedidoId: updatedPedido.id,
              valorTotal: updatedPedido.valor_total
            });
            
            toast.success("QR Code PIX gerado com sucesso!");
          } else {
            throw new Error("Falha ao gerar dados PIX");
          }
        } else {
          throw new Error("Erro ao buscar pedido atualizado");
        }
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro:", error);
      setError(error.message || 'Erro ao carregar pagamento PIX');
      toast.error(`Erro no pagamento PIX: ${error.message}`);
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
        .select('status, log_pagamento, valor_total')
        .eq('id', pedidoId)
        .single();

      if (error) throw error;

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
