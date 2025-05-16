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
  console.log(`[MercadoPago] Starting redirection with method: ${normalizedPaymentMethod}, preferenceId: ${preferenceId.substring(0, 10)}...`);
  
  // Store validation state in local storage for potential recovery
  localStorage.setItem('payment_attempt_timestamp', Date.now().toString());
  localStorage.setItem('payment_method_selected', normalizedPaymentMethod);
  localStorage.setItem('payment_preference_id', preferenceId);
  
  // CRITICAL FIX: Redirect URL construction with proper parameters
  const baseUrl = 'https://www.mercadopago.com.br/checkout/v1/redirect';
  
  // Build URL with parameters
  let url = new URL(baseUrl);
  url.searchParams.append('preference_id', preferenceId);
  url.searchParams.append('test', 'true'); // Always use test mode for now
  url.searchParams.append('sandbox', 'true');
  
  // CRITICAL FIX: Always add payment_method_id parameter
  url.searchParams.append('payment_method_id', normalizedPaymentMethod);
  
  // Add success and failure URLs for proper redirection after payment
  const returnBaseUrl = window.location.origin;
  url.searchParams.append('success', `${returnBaseUrl}/pedido-confirmado`);
  url.searchParams.append('failure', `${returnBaseUrl}/checkout?error=payment_failed`);
  
  const finalUrl = url.toString();
  
  // Log the URL for debugging
  console.log('[MercadoPago] Final redirect URL:', finalUrl);
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecting to MercadoPago: ${finalUrl}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod, testMode: true }
  );
  
  // CRITICAL FIX: Use a small timeout to ensure any UI updates are completed before redirect
  setTimeout(() => {
    // Direct window location change
    window.location.href = finalUrl;
  }, 300);
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
  const urlObj = new URL(url);
  
  urlObj.searchParams.set('test', 'true');
  urlObj.searchParams.set('sandbox', 'true');
  
  return urlObj.toString();
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
