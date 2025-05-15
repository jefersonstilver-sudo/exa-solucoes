
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';

/**
 * Handles direct redirection to MercadoPago with robust fallback strategies
 * @param preferenceId MercadoPago preference ID
 * @param paymentMethod Payment method (credit_card or pix)
 */
export const handleMercadoPagoRedirect = (preferenceId: string, paymentMethod = 'credit_card'): void => {
  if (!preferenceId) {
    console.error('Preference ID is required for MercadoPago redirect');
    sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
    return;
  }
  
  // Normalize payment method to valid values only
  const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
  
  // Log payment attempt for diagnostics
  console.log(`[MercadoPago] Starting redirection with method: ${normalizedPaymentMethod}, preferenceId: ${preferenceId}`);
  
  // Construct base URL - Garantindo que o ambiente de teste esteja explícito
  let url = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
  
  // Add payment method to URL if it's PIX 
  if (normalizedPaymentMethod === 'pix') {
    url += '&payment_method_id=pix';
    console.log('[MercadoPago] Redirecting to PIX payment:', url);
    
    // Show specific PIX toast
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento PIX...");
  } else {
    url += '&payment_method_id=credit_card';
    console.log('[MercadoPago] Redirecting to credit card payment:', url);
    
    // Show credit card toast
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento com cartão...");
  }
  
  // Adicionando parâmetros adicionais para ambiente de teste
  url += '&sandbox=true&test_mode=true';
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecting to MercadoPago Test Environment: ${url}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod, testMode: true }
  );
  
  // Direct window location change for reliability
  window.location.href = url;
};

/**
 * Validates if a preferenceId is valid
 */
export const isValidPreferenceId = (preferenceId: string | null): boolean => {
  return !!preferenceId && typeof preferenceId === 'string' && preferenceId.length > 5;
};

/**
 * Modifica URL para garantir que estamos sempre utilizando o ambiente de teste
 */
export const ensureTestEnvironment = (url: string): string => {
  let testUrl = url;
  
  if (!testUrl.includes('test=true')) {
    testUrl += testUrl.includes('?') ? '&test=true' : '?test=true';
  }
  
  if (!testUrl.includes('sandbox=true')) {
    testUrl += '&sandbox=true';
  }
  
  return testUrl;
};

/**
 * Obtém configurações de teste para o MercadoPago
 */
export const getTestCredentials = (): { cardNumber: string; cvv: string; expDate: string } => {
  return {
    cardNumber: '5031 4332 1540 6351', // Mastercard de teste
    cvv: '123',
    expDate: '11/25'
  };
};
