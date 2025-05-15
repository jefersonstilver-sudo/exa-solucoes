
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
  
  // Construct base URL
  let url = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
  
  // Add payment method to URL if it's PIX 
  if (normalizedPaymentMethod === 'pix') {
    url += '&payment_method_id=pix';
    console.log('[MercadoPago] Redirecting to PIX payment:', url);
    
    // Show specific PIX toast
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento PIX...");
  } else {
    console.log('[MercadoPago] Redirecting to credit card payment:', url);
    
    // Show credit card toast
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento com cartão...");
  }
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecting to MercadoPago: ${url}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod }
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
