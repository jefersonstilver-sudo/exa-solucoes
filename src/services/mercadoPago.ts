import { NextApiRequest } from 'next';

// MercadoPago configuration - REAL DATA ONLY
const MP_ACCESS_TOKEN = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = import.meta.env.VITE_MERCADO_PAGO_WEBHOOK_SECRET || '';
const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '';

// Common MercadoPago types
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

/**
 * Creates a payment preference in MercadoPago - REAL IMPLEMENTATION ONLY
 */
export const createPaymentPreference = async (
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
    description?: string;
    picture_url?: string;
  }>,
  backUrl: {
    success: string;
    failure: string;
    pending: string;
  },
  metadata: Record<string, any> = {}
): Promise<{ preferenceId: string; initPoint: string }> => {
  
  // CRITICAL: Force real MercadoPago configuration
  if (!MP_ACCESS_TOKEN) {
    throw new Error('CONFIGURATION_ERROR: MP_ACCESS_TOKEN not configured. Real MercadoPago integration required.');
  }

  if (!MP_PUBLIC_KEY) {
    throw new Error('CONFIGURATION_ERROR: MP_PUBLIC_KEY not configured. Real MercadoPago integration required.');
  }

  try {
    // This requires actual MercadoPago SDK implementation
    console.error('🚨 REAL MERCADOPAGO INTEGRATION REQUIRED');
    console.error('📋 Required: npm install mercadopago');
    console.error('🔑 Token Status:', MP_ACCESS_TOKEN ? 'CONFIGURED' : 'MISSING');
    
    throw new Error('IMPLEMENTATION_REQUIRED: Real MercadoPago SDK integration needed. No mock data allowed.');
    
  } catch (error) {
    console.error('❌ MercadoPago Error:', error);
    throw new Error('Failed to create payment preference - Real integration required');
  }
};

/**
 * Initializes MercadoPago checkout - REAL IMPLEMENTATION ONLY
 */
export const initMercadoPagoCheckout = (preferenceId: string, redirectMode: boolean = false): void => {
  if (!preferenceId || preferenceId.startsWith('TEST-')) {
    throw new Error('INVALID_PREFERENCE: Real MercadoPago preference ID required');
  }
  
  // Real MercadoPago checkout redirect
  window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
};

// Only export if properly configured
export { MP_PUBLIC_KEY };

// Data integrity check
export const checkMercadoPagoIntegrity = (): { 
  configured: boolean; 
  errors: string[]; 
  warnings: string[] 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!MP_ACCESS_TOKEN) {
    errors.push('MP_ACCESS_TOKEN not configured');
  }
  
  if (!MP_PUBLIC_KEY) {
    errors.push('MP_PUBLIC_KEY not configured');
  }
  
  if (!MP_WEBHOOK_SECRET) {
    warnings.push('MP_WEBHOOK_SECRET not configured - webhooks will not work');
  }
  
  return {
    configured: errors.length === 0,
    errors,
    warnings
  };
};