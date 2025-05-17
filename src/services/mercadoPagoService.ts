
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';

/**
 * Handles direct redirection to MercadoPago with robust fallback strategies
 * @param preferenceId MercadoPago preference ID
 * @param paymentMethod Payment method (credit_card or pix)
 */
export const handleMercadoPagoRedirect = (preferenceId: string, paymentMethod = 'credit_card'): void => {
  // CRITICAL DEBUG: Add extended logging to trace redirection issues
  console.log("[MercadoPago] REDIRECT TRACE - Iniciando redirecionamento", { 
    preferenceId: preferenceId ? preferenceId.substring(0, 10) + '...' : 'undefined', 
    paymentMethod,
    timestamp: new Date().toISOString()
  });

  if (!preferenceId) {
    console.error('CRITICAL ERROR: Preference ID is required for MercadoPago redirect');
    sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      "Tentativa de redirecionamento sem preference_id",
      { timestamp: new Date().toISOString() }
    );
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
    console.log(`[MercadoPago] REDIRECT TRACE - URL building: método=${normalizedPaymentMethod}, preferenceId=${preferenceId.substring(0, 10)}...`);
    
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
    
    // CRITICAL FIX: Force test parameter to ensure it works in any environment
    url.searchParams.append('test', 'true');
    
    // Add success and failure URLs for proper redirection after payment
    const returnBaseUrl = window.location.origin;
    url.searchParams.append('success', `${returnBaseUrl}/pedido-confirmado`);
    url.searchParams.append('failure', `${returnBaseUrl}/checkout?error=payment_failed`);
    
    const finalUrl = url.toString();
    
    // ENHANCED DEBUG: Show more visible redirection indication
    sonnerToast.loading("Redirecionando para o portal de pagamento...", {
      duration: 5000
    });
    
    // Log the URL for debugging
    console.log('[MercadoPago] REDIRECT TRACE - URL final de redirecionamento:', finalUrl);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING, 
      LogLevel.INFO,
      `Redirecionando para MercadoPago: ${finalUrl}`,
      { preferenceId, paymentMethod: normalizedPaymentMethod }
    );
    
    // ULTRA-FORCE APPROACH: Combine multiple methods to ensure at least one works
    console.log("[MercadoPago] REDIRECT TRACE - Executando redirecionamento agora");
    
    // Method 1: Use location.replace for most reliable redirect
    window.location.replace(finalUrl);
    
    // ENHANCED: Create a visible backup link for manual redirection
    const backupLink = document.createElement('a');
    backupLink.href = finalUrl;
    backupLink.target = '_blank';
    backupLink.style.position = 'fixed';
    backupLink.style.bottom = '20px';
    backupLink.style.right = '20px';
    backupLink.style.padding = '10px 15px';
    backupLink.style.backgroundColor = '#00FFAB';
    backupLink.style.color = '#1E1B4B';
    backupLink.style.fontWeight = 'bold';
    backupLink.style.borderRadius = '4px';
    backupLink.style.zIndex = '9999';
    backupLink.style.boxShadow = '0 2px 8px rgba(0, 255, 171, 0.5)';
    backupLink.style.display = 'none'; // Hidden initially
    backupLink.textContent = 'Clique para ir para o pagamento';
    document.body.appendChild(backupLink);
    
    // Method 2: Fall back to location.href after a small delay
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        console.log('[MercadoPago] REDIRECT TRACE - Fallback 1: usando window.location.href');
        window.location.href = finalUrl;
        
        // Show backup link after first fallback
        backupLink.style.display = 'block';
      }
    }, 1000);
    
    // Method 3: Open in new window as final fallback
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        console.log('[MercadoPago] REDIRECT TRACE - Fallback 2: abrindo em nova janela');
        
        // Attempt to open in new window
        const newWindow = window.open(finalUrl, '_blank');
        
        // If popup blocked, make the backup link more visible
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('[MercadoPago] REDIRECT TRACE - Popup bloqueado, destacando link de backup');
          backupLink.style.backgroundColor = '#FF0000';
          backupLink.style.color = 'white';
          backupLink.style.animation = 'pulse 1s infinite';
          backupLink.style.padding = '15px 20px';
          backupLink.textContent = '⚠️ CLIQUE AQUI PARA PAGAR ⚠️';
          
          // Add pulse animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 2000);
    
    // Reset the redirection flag after a generous timeout
    setTimeout(() => {
      window.sessionStorage.removeItem(hasRedirectedKey);
      
      // Remove backup link if still present
      if (document.body.contains(backupLink)) {
        document.body.removeChild(backupLink);
      }
    }, 30000);
    
  } catch (error) {
    // Capture any error in the redirection process
    console.error("[MercadoPago] REDIRECT TRACE - Erro crítico durante redirecionamento:", error);
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
