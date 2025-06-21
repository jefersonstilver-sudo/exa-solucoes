
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrderSecurity } from '@/hooks/useOrderSecurity';

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
  const { isAuthorized, isLoading: securityLoading } = useOrderSecurity(pedidoId);

  useEffect(() => {
    if (!pedidoId) {
      setError("ID do pedido não fornecido");
      setIsLoading(false);
      return;
    }

    // Aguardar verificação de segurança antes de carregar dados
    if (!securityLoading) {
      if (isAuthorized) {
        loadPaymentData();
      } else {
        setError("Acesso negado ou pedido expirado");
        setIsLoading(false);
      }
    }
  }, [pedidoId, isAuthorized, securityLoading]);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 [usePixPayment] Carregando dados do pagamento (com segurança):", pedidoId);

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
        transaction_id: pedido.transaction_id,
        valor_total: pedido.valor_total
      });

      // Verificar se pedido não foi cancelado automaticamente
      if (pedido.status === 'cancelado_automaticamente') {
        throw new Error("Este pedido foi cancelado automaticamente por expiração (24h)");
      }

      // Verificar se já tem dados de PIX
      const logPagamento = pedido.log_pagamento as any;
      const pixData = logPagamento?.pix_data;
      
      if (pixData && pixData.qrCodeBase64) {
        console.log("✅ [usePixPayment] Dados PIX encontrados no pedido");
        setPaymentData({
          qrCodeBase64: pixData.qrCodeBase64,
          qrCode: pixData.qrCode,
          paymentId: pixData.paymentId,
          status: pixData.status || 'pending',
          createdAt: pedido.created_at,
          pedidoId: pedido.id,
          valorTotal: pedido.valor_total
        });
      } else {
        // Se não tem dados PIX, processar pagamento
        console.log("🔄 [usePixPayment] Processando pagamento PIX...");
        
        const { data, error } = await supabase.functions.invoke('process-pix-payment', {
          body: {
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
          createdAt: new Date().toISOString(),
          pedidoId: pedido.id,
          valorTotal: pedido.valor_total
        });

        toast.success("QR Code PIX gerado com sucesso!");
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro:", error);
      setError(error.message || 'Erro ao carregar pagamento');
      
      // Se erro de acesso, não mostrar toast para não poluir
      if (!error.message.includes('expirado') && !error.message.includes('cancelado')) {
        toast.error(`Erro no pagamento: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!pedidoId ||!isAuthorized) return;
    
    try {
      console.log("🔄 [usePixPayment] Atualizando status do pagamento");
      
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento, valor_total')
        .eq('id', pedidoId)
        .single();

      if (error) throw error;

      // Verificar se pedido foi cancelado
      if (pedido.status === 'cancelado_automaticamente') {
        setError("Pedido foi cancelado automaticamente por expiração");
        toast.error("Seu pedido expirou após 24 horas. Faça um novo pedido.");
        return;
      }

      // Atualizar status se mudou
      if (pedido.status === 'pago_pendente_video' && paymentData) {
        setPaymentData(prev => ({
          ...prev,
          status: 'approved',
          valorTotal: pedido.valor_total
        }));
        toast.success("🎉 Pagamento confirmado! Agora você pode enviar seu vídeo.");
        
        // Redirecionar após confirmação
        setTimeout(() => {
          window.location.href = '/anunciante/pedidos';
        }, 2000);
      }

    } catch (error: any) {
      console.error("❌ [usePixPayment] Erro ao atualizar status:", error);
    }
  };

  // Se não autorizado, retornar dados vazios para que o componente mostre a tela de acesso negado
  if (!securityLoading && !isAuthorized) {
    return {
      isLoading: false,
      error: "Acesso negado ou pedido expirado",
      paymentData: null,
      refreshPaymentStatus: () => Promise.resolve()
    };
  }

  return {
    isLoading: isLoading || securityLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};
