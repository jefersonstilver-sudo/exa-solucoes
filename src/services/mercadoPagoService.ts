
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
    sonnerToast.loading("Preparando pagamento PIX...");
  } else {
    console.log('[MercadoPago] Redirecting to credit card payment:', url);
    
    // Show credit card toast
    sonnerToast.dismiss();
    sonnerToast.loading("Redirecionando para pagamento com cartão...");
  }
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecting to MercadoPago: ${url}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod }
  );
  
  // Simplified and robust redirection implementation
  try {
    // Primary method - direct navigation
    setTimeout(() => {
      window.location.href = url;
      
      // Start fallback timer
      setTimeout(() => {
        // Check if we're still on the same page after 2 seconds
        if (document.location.href.indexOf('checkout') > -1) {
          console.log('[MercadoPago] Primary redirection failed, trying alternatives');
          
          // Alternative 1: Open in new tab/window
          const newWindow = window.open(url, '_blank');
          
          // Alternative 2: If new window failed, create a visual element for the user to click
          if (!newWindow || newWindow.closed) {
            console.log('[MercadoPago] Alternative redirection failed, creating manual link');
            sonnerToast.dismiss();
            sonnerToast.error("Não foi possível redirecionar automaticamente");
            
            // Create an overlay with clickable link
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            overlay.style.zIndex = '10000';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            
            const container = document.createElement('div');
            container.style.backgroundColor = 'white';
            container.style.padding = '30px';
            container.style.borderRadius = '10px';
            container.style.maxWidth = '500px';
            container.style.textAlign = 'center';
            
            const heading = document.createElement('h2');
            heading.innerText = 'Redirecionamento bloqueado';
            heading.style.marginBottom = '15px';
            heading.style.color = '#333';
            
            const message = document.createElement('p');
            message.innerText = 'Não foi possível redirecionar automaticamente para o Mercado Pago. Por favor, clique no botão abaixo para continuar com o pagamento.';
            message.style.marginBottom = '20px';
            message.style.color = '#555';
            
            const button = document.createElement('a');
            button.href = url;
            button.target = '_blank';
            button.innerText = normalizedPaymentMethod === 'pix' ? 'Continuar para o pagamento PIX' : 'Continuar para o pagamento';
            button.style.display = 'inline-block';
            button.style.padding = '12px 24px';
            button.style.backgroundColor = '#009ee3';
            button.style.color = 'white';
            button.style.borderRadius = '5px';
            button.style.textDecoration = 'none';
            button.style.fontWeight = 'bold';
            button.style.cursor = 'pointer';
            
            container.appendChild(heading);
            container.appendChild(message);
            container.appendChild(button);
            overlay.appendChild(container);
            document.body.appendChild(overlay);
            
            // Add click event to remove overlay after redirection
            button.addEventListener('click', () => {
              document.body.removeChild(overlay);
            });
          }
        }
      }, 2000);
    }, 500); // Short delay to ensure toast is visible
    
  } catch (error) {
    console.error('[MercadoPago] Critical error during redirection:', error);
    sonnerToast.dismiss();
    sonnerToast.error("Erro ao processar pagamento");
    
    // Detailed error report
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      `Critical error during redirection: ${error}`,
      { error: String(error), preferenceId, paymentMethod, userAgent: navigator.userAgent }
    );
    
    // Last resort - create a link for the user to click
    alert(`Erro ao processar pagamento. Por favor, tente novamente ou use o link manual que aparecerá na tela.`);
    
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.innerText = normalizedPaymentMethod === 'pix' ? 'Clique aqui para pagar com PIX' : 'Clique aqui para abrir o Mercado Pago';
    linkElement.style.display = 'block';
    linkElement.style.margin = '20px auto';
    linkElement.style.padding = '15px 30px';
    linkElement.style.backgroundColor = '#009ee3';
    linkElement.style.color = 'white';
    linkElement.style.borderRadius = '5px';
    linkElement.style.textAlign = 'center';
    linkElement.style.textDecoration = 'none';
    linkElement.style.fontWeight = 'bold';
    linkElement.style.width = '300px';
    
    const container = document.querySelector('.container') || document.body;
    container.appendChild(linkElement);
  }
};

/**
 * Validates if a preferenceId is valid
 */
export const isValidPreferenceId = (preferenceId: string | null): boolean => {
  return !!preferenceId && typeof preferenceId === 'string' && preferenceId.length > 5;
};
