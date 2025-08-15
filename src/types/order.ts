
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
  mercadopago_transaction_id?: string; // CRÍTICO: Adicionar campo para transaction_id
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
