
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
  
  // CORREÇÃO: Construção da URL de forma mais direta e força o modo de teste
  let mercadoPagoUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
  
  // Adicionar parâmetro de método de pagamento
  if (normalizedPaymentMethod === 'pix') {
    mercadoPagoUrl += '&payment_method_id=pix';
  }
  
  // Adicionar parâmetros de teste obrigatórios
  mercadoPagoUrl += '&test=true';
  
  // Adicionar URLs de sucesso e falha
  const returnBaseUrl = window.location.origin;
  mercadoPagoUrl += `&success=${encodeURIComponent(`${returnBaseUrl}/pedido-confirmado`)}`;
  mercadoPagoUrl += `&failure=${encodeURIComponent(`${returnBaseUrl}/checkout?error=payment_failed`)}`;
  
  // Log da URL final para depuração
  console.log('[MercadoPago] Final redirect URL:', mercadoPagoUrl);
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecionando para o ambiente de testes do MercadoPago: ${mercadoPagoUrl}`,
    { preferenceId, paymentMethod: normalizedPaymentMethod, testMode: true }
  );
  
  // SOLUÇÃO DO PROBLEMA: Usar location.assign em vez de location.href para garantir o redirecionamento
  try {
    // Usar window.open em uma nova aba para facilitar a depuração
    // window.open(mercadoPagoUrl, '_blank');
    
    // Solução mais robusta: usar location.assign com intervalo para garantir que a UI seja atualizada primeiro
    setTimeout(() => {
      window.location.assign(mercadoPagoUrl);
      
      // Backup: se depois de 2 segundos ainda estivermos na mesma página, tentar outro método
      setTimeout(() => {
        if (document.location.pathname.includes('checkout')) {
          console.log('[MercadoPago] Redirecionamento falhou, tentando método alternativo...');
          window.location.href = mercadoPagoUrl;
        }
      }, 2000);
    }, 100);
  } catch (error) {
    console.error('[MercadoPago] Erro ao redirecionar:', error);
    sonnerToast.error("Erro ao redirecionar para o Mercado Pago. Tente novamente.");
    
    // Método de fallback direto em caso de erro
    window.location.replace(mercadoPagoUrl);
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
