
import { Panel } from '@/types/panel';

// Re-export order types for backward compatibility
export type { CartItem, CreatePaymentOrderParams, ProcessPaymentParams, StoreCheckoutInfoParams } from '@/types/order';

export interface PaymentResponse {
  success: boolean;
  error?: string;
  message?: string;
  pedidoId?: string;
  preferenceId?: string;
  pixData?: {
    qrCodeBase64: string;
    qrCode: string;
    paymentId: string;
    status: string;
  };
}

export interface CampaignCreationResponse {
  success: boolean;
  message?: string;
  error?: string;
}
