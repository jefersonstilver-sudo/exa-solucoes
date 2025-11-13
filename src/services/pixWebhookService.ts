
import { PixWebhookData, PixWebhookResponse } from '@/types/pixWebhook';

/**
 * DEPRECATED: n8n webhook dependency removed
 * PIX payments now handled natively by Mercado Pago SDK via process-payment edge function
 */
export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  console.log('[PixWebhookService] DEPRECATED - PIX now uses native Mercado Pago SDK via process-payment edge function');
  
  return {
    success: false,
    error: 'PIX webhook deprecated - use Mercado Pago SDK via process-payment edge function',
    qrCodeBase64: '',
    qrCodeText: '',
    message: 'Serviço descontinuado'
  };
};
