
// Deprecated file - MercadoPago integration removed
// This file is kept for backward compatibility with existing imports
// All payment logic now handled by Stripe

export interface PaymentInfo {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'refunded';
  description: string;
  amount: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  metadata: Record<string, any>;
}

export const createPaymentPreference = async () => {
  throw new Error('MercadoPago deprecated - Use Stripe integration instead');
};

export const initMercadoPagoCheckout = () => {
  throw new Error('MercadoPago deprecated - Use Stripe integration instead');
};

export const checkMercadoPagoIntegrity = (): { 
  configured: boolean; 
  errors: string[]; 
  warnings: string[] 
} => {
  return {
    configured: false,
    errors: ['MercadoPago integration has been removed - Using Stripe instead'],
    warnings: []
  };
};

export const MP_PUBLIC_KEY = '';
