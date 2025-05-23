
import { Panel } from '@/types/panel';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export interface CreatePaymentOrderParams {
  sessionUser: any;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  startDate: Date;
  endDate: Date;
}

export interface ProcessPaymentParams {
  pedidoId: string;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  sessionUser: any;
  paymentMethod: string;
}

export interface StoreCheckoutInfoParams {
  pedidoId: string;
  paymentMethod: string;
  preferenceId?: string;
}

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
