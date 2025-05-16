
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
  
  // Store validation state in local storage
  localStorage.setItem('payment_attempt_timestamp', Date.now().toString());
  localStorage.setItem('payment_method_selected', normalizedPaymentMethod);
  localStorage.setItem('payment_preference_id', preferenceId);
  
  // CORREÇÃO CRÍTICA: URL direta para produção do Mercado Pago sem parâmetros extras
  // Isso é uma solução para os problemas de redirecionamento
  const mercadoPagoUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecionando para o MercadoPago: ${mercadoPagoUrl}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod }
  );
  
  // SOLUÇÃO: Usar window.location.href diretamente com um atraso mínimo
  try {
    console.log('[MercadoPago] Redirecionando para:', mercadoPagoUrl);
    
    // Mostrar toast antes do redirecionamento
    sonnerToast.success('Redirecionando para o Mercado Pago...', {
      duration: 3000
    });
    
    // Solução de contorno: Usar setTimeout com window.location.href diretamente
    setTimeout(() => {
      window.location.href = mercadoPagoUrl;
      
      // Verificação de backup para garantir que o redirecionamento aconteça
      setTimeout(() => {
        if (document.location.href.includes('checkout')) {
          console.log('[MercadoPago] Redirecionamento falhou, tentando via location.replace');
          window.location.replace(mercadoPagoUrl);
        }
      }, 1500);
      
    }, 800);
  } catch (error) {
    console.error('[MercadoPago] Erro ao redirecionar:', error);
    sonnerToast.error("Erro ao redirecionar para o Mercado Pago. Tente novamente.");
    
    // Último recurso: redirecionamento direto
    window.open(mercadoPagoUrl, '_self');
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
