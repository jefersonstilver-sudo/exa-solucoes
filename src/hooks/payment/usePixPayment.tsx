
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

      console.log("🔄 [usePixPayment] MAPEAMENTO CORRIGIDO - Carregando dados PIX:", pedidoId);

      // Buscar pedido diretamente por ID
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
        valor_total: pedido.valor_total,
        hasLogPagamento: !!pedido.log_pagamento
      });

      // CORREÇÃO: Verificar se já tem dados de PIX com múltiplos formatos
      const logPagamento = pedido.log_pagamento as any;
      
      if (logPagamento?.pixData || logPagamento?.pix_data) {
        const pixData = logPagamento.pixData || logPagamento.pix_data;
        
        console.log("✅ [usePixPayment] MAPEAMENTO CORRIGIDO - Dados PIX encontrados:", {
          hasQrCodeBase64: !!(pixData.qrCodeBase64 || pixData.pix_base64),
          hasQrCode: !!(pixData.qrCode || pixData.qrCodeText || pixData.pix_url),
          status: pixData.status,
          rawPixData: pixData
        });
        
        // CORREÇÃO: Mapear corretamente com fallbacks para múltiplos formatos
        setPaymentData({
          qrCodeBase64: pixData.qrCodeBase64 || pixData.pix_base64,
          qrCode: pixData.qrCode || pixData.qrCodeText || pixData.pix_url,
          paymentId: pixData.paymentId || pixData.id,
          status: pixData.status || pedido.status,
          createdAt: pedido.created_at,
          pedidoId: pedido.id,
          valorTotal: pedido.valor_total
        });
        
        console.log("✅ [usePixPayment] Dados PIX mapeados corretamente para o frontend");
      } else {
        // Se não tem dados PIX, processar com a função REAL
        console.log("🔄 [usePixPayment] CORREÇÃO - Processando PIX com função real...");
        
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            pedido_id: pedido.id,
            payment_method: 'pix',
            total_amount: pedido.valor_total,
            cart_items: [],
            user_id: pedido.client_id,
            return_url: window.location.origin,
            payment_key: `pix_${pedido.id}_${Date.now()}`
          }
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Falha ao processar pagamento PIX');
        }

        console.log("✅ [usePixPayment] PIX processado com função real:", data);

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
            // CORREÇÃO: Mesmo mapeamento com fallbacks
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
      console.error("❌ [usePixPayment] MAPEAMENTO CORRIGIDO - Erro:", error);
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
