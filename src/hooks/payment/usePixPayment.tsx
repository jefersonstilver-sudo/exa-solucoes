
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
  const [isVerifying, setIsVerifying] = useState(false);

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

      console.log("🔄 [usePixPayment] Carregando dados PIX:", pedidoId);

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

      // Verificar se já tem dados de PIX com múltiplos formatos
      const logPagamento = pedido.log_pagamento as any;
      
      if (logPagamento?.pixData || logPagamento?.pix_data) {
        const pixData = logPagamento.pixData || logPagamento.pix_data;
        
        console.log("✅ [usePixPayment] Dados PIX encontrados:", {
          hasQrCodeBase64: !!(pixData.qrCodeBase64 || pixData.pix_base64),
          hasQrCode: !!(pixData.qrCode || pixData.qrCodeText || pixData.pix_url),
          status: pixData.status,
          paymentId: pixData.paymentId || pixData.id
        });
        
        // Mapear corretamente com fallbacks para múltiplos formatos
        setPaymentData({
          qrCodeBase64: pixData.qrCodeBase64 || pixData.pix_base64,
          qrCode: pixData.qrCode || pixData.qrCodeText || pixData.pix_url,
          paymentId: pixData.paymentId || pixData.id,
          status: pixData.status || pedido.status,
          createdAt: pedido.created_at,
          pedidoId: pedido.id,
          valorTotal: pedido.valor_total
        });
        
        console.log("✅ [usePixPayment] Dados PIX mapeados para o frontend");
      } else {
        // Se não tem dados PIX, processar com a função REAL
        console.log("🔄 [usePixPayment] Processando PIX com função real...");
        
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
    
    setIsVerifying(true);
    
    try {
      console.log("🔍 [usePixPayment] VERIFICAÇÃO MANUAL - Consultando MercadoPago...");
      
      // Chamar função edge para verificar no MercadoPago
      const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-pix-payment', {
        body: { pedido_id: pedidoId }
      });

      if (verifyError) {
        console.error("❌ [usePixPayment] Erro na verificação:", verifyError);
        throw new Error(`Erro na verificação: ${verifyError.message}`);
      }

      console.log("📋 [usePixPayment] Resultado da verificação:", verificationResult);

      if (verificationResult.success) {
        if (verificationResult.payment_approved) {
          // Pagamento foi aprovado!
          toast.success("🎉 Pagamento confirmado! Redirecionando...");
          
          // Atualizar dados locais
          setPaymentData(prev => ({
            ...prev,
            status: 'approved'
          }));

          // Aguardar um pouco para o usuário ver a mensagem
          setTimeout(() => {
            window.location.href = '/anunciante/pedidos';
          }, 2000);

        } else if (verificationResult.payment_found) {
          // Pagamento existe mas ainda não foi aprovado
          toast.info(`💳 Pagamento encontrado mas ainda ${verificationResult.payment_status}. Tente novamente em alguns minutos.`);
          
          // Atualizar status local se mudou
          if (verificationResult.payment_status !== paymentData?.status) {
            setPaymentData(prev => ({
              ...prev,
              status: verificationResult.payment_status
            }));
          }
        } else {
          // Pagamento não encontrado
          toast.warning("⏳ Pagamento ainda não identificado no MercadoPago. Aguarde alguns minutos após realizar o pagamento.");
        }
      } else {
        // Erro na verificação
        console.error("❌ [usePixPayment] Verificação falhou:", verificationResult.error);
        toast.error(`Erro na verificação: ${verificationResult.error}`);
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro ao verificar status:", error);
      toast.error(`Erro ao verificar pagamento: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus,
    isVerifying // Novo estado para o botão de verificação
  };
};
