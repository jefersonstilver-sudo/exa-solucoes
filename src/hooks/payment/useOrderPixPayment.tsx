import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';

interface Order {
  id: string;
  valor_total: number;
  status: string;
  client_id: string;
}

interface PixPaymentResult {
  success: boolean;
  qrCodeBase64?: string;
  qrCode?: string;
  paymentId?: string;
  error?: string;
}

export const useOrderPixPayment = () => {
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  const generatePixForOrder = useCallback(async (order: Order): Promise<PixPaymentResult> => {
    setIsGeneratingPix(true);

    try {
      console.log('🎯 [OrderPixPayment] Gerando PIX para pedido:', order.id);

      logSystemEvent('ORDER_PIX_GENERATION_START', {
        orderId: order.id,
        valorTotal: order.valor_total,
        status: order.status
      });

      // Chamar edge function para gerar PIX
      const { data, error } = await supabase.functions.invoke('process-pix-payment', {
        body: {
          pedidoId: order.id,
          valorTotal: order.valor_total,
          regenerate: true
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento PIX');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao gerar PIX');
      }

      console.log('✅ [OrderPixPayment] PIX gerado com sucesso');

      logSystemEvent('ORDER_PIX_GENERATION_SUCCESS', {
        orderId: order.id,
        paymentId: data.paymentId || data.payment_id
      });

      toast.success('QR Code PIX gerado com sucesso!');

      return {
        success: true,
        qrCodeBase64: data.qrCodeBase64 || data.qr_code_base64,
        qrCode: data.qrCode || data.qr_code,
        paymentId: data.paymentId || data.payment_id
      };

    } catch (error: any) {
      console.error('❌ [OrderPixPayment] Erro ao gerar PIX:', error);

      logSystemEvent('ORDER_PIX_GENERATION_ERROR', {
        orderId: order.id,
        error: error.message
      }, 'ERROR');

      toast.error(`Erro ao gerar PIX: ${error.message}`);

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGeneratingPix(false);
    }
  }, []);

  return {
    generatePixForOrder,
    isGeneratingPix
  };
};