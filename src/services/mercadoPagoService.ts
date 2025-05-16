
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
  
  // Prevent multiple redirections with a static flag
  const hasRedirectedKey = 'mp_redirect_in_progress';
  if (window.sessionStorage.getItem(hasRedirectedKey)) {
    console.log('[MercadoPago] Redirection already in progress, preventing duplicate');
    return;
  }
  window.sessionStorage.setItem(hasRedirectedKey, 'true');
  
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
    
    // 3-LAYER FALLBACK STRATEGY:
    
    // Layer 1: Direct window.location.href redirect
    console.log("[MercadoPago] Tentativa 1: Redirecionamento direto via location.href");
    window.location.href = finalUrl;
    
    // Layer 2: After short delay, try opening in new tab if still here
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        console.log("[MercadoPago] Tentativa 2: Redirecionamento via window.open");
        const newTab = window.open(finalUrl, '_blank');
        
        // Layer 3: If new tab fails, try location.replace as final resort
        if (!newTab) {
          console.log("[MercadoPago] Tentativa 3: Redirecionamento via location.replace");
          window.location.replace(finalUrl);
          
          // Final emergency approach - reload with redirect parameter
          setTimeout(() => {
            console.log("[MercadoPago] Tentativa 4 (emergência): Recarregar página com parâmetro de redirecionamento");
            window.location.href = `${window.location.origin}/checkout?redirect=${encodeURIComponent(finalUrl)}`;
          }, 500);
        }
      } else {
        console.log("[MercadoPago] Redirecionamento parece ter sido bem-sucedido");
      }
    }, 800);
    
    // Reset the redirection flag after a generous timeout
    setTimeout(() => {
      window.sessionStorage.removeItem(hasRedirectedKey);
    }, 10000);
    
  } catch (error) {
    // Capture any error in the redirection process
    console.error("[MercadoPago] Erro crítico durante redirecionamento:", error);
    window.sessionStorage.removeItem('mp_redirect_in_progress');
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
