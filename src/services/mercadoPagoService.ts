
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
  
  try {
    // Normalize payment method to valid values only
    const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Log payment attempt for diagnostics
    console.log(`[MercadoPago] Iniciando redirecionamento com método: ${normalizedPaymentMethod}, preferenceId: ${preferenceId.substring(0, 10)}...`);
    
    // Store validation state in local storage for potential recovery
    localStorage.setItem('payment_attempt_timestamp', Date.now().toString());
    localStorage.setItem('payment_method_selected', normalizedPaymentMethod);
    localStorage.setItem('payment_preference_id', preferenceId);
    
    // CRITICAL FIX: Build proper MercadoPago URL using their official documentation format
    // Using preference_id with underscore, not hyphen
    const url = new URL('https://www.mercadopago.com.br/checkout/v1/redirect');
    
    // IMPORTANT: Using preference_id (with underscore) as per MercadoPago documentation
    url.searchParams.append('preference_id', preferenceId);
    
    // Add payment method if needed
    if (normalizedPaymentMethod === 'pix') {
      url.searchParams.append('payment_method_id', normalizedPaymentMethod);
    }
    
    // Add success and failure URLs for proper redirection after payment
    const returnBaseUrl = window.location.origin;
    url.searchParams.append('success', `${returnBaseUrl}/pedido-confirmado`);
    url.searchParams.append('failure', `${returnBaseUrl}/checkout?error=payment_failed`);
    
    const finalUrl = url.toString();
    
    // Log the URL for debugging
    console.log('[MercadoPago] URL final de redirecionamento:', finalUrl);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING, 
      LogLevel.INFO,
      `Redirecionando para MercadoPago: ${finalUrl}`,
      { preferenceId, paymentMethod: normalizedPaymentMethod }
    );
    
    // Show toast before redirect
    sonnerToast.success("Redirecionando para pagamento...");
    
    // Primary redirect method
    console.log("[MercadoPago] Executando redirecionamento direto");
    window.location.href = finalUrl;
    
    // Fallback: If still here after 1 second, try alternative approach
    setTimeout(() => {
      console.log("[MercadoPago] Aplicando método de redirecionamento de fallback");
      
      // Try opening in new tab as fallback
      const newTab = window.open(finalUrl, '_blank');
      
      // If new tab also fails, refresh page with redirect parameter
      if (!newTab) {
        console.log("[MercadoPago] Aplicando método de redirecionamento de emergência");
        window.location.href = `${window.location.origin}/checkout?redirect=${encodeURIComponent(finalUrl)}`;
      }
    }, 1000);
  } catch (error) {
    // Capture any error in the redirection process
    console.error("[MercadoPago] Erro crítico durante redirecionamento:", error);
    sonnerToast.error("Erro ao redirecionar para pagamento. Tente novamente.");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      `Erro ao redirecionar para MercadoPago: ${error}`,
      { error: String(error) }
    );
  }
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
