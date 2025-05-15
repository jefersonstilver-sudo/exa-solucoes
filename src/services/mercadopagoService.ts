
import { MP_PUBLIC_KEY, PaymentStatus, getReturnUrls } from '@/constants/mercadoPagoConstants';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Initialize MercadoPago checkout with a preference ID
 */
export const initMercadoPagoCheckout = (preferenceId: string): void => {
  try {
    // Save the preference ID for verification
    localStorage.setItem('last_mercadopago_preference', preferenceId);
    
    // Log the checkout initialization
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      "Iniciando checkout do Mercado Pago",
      { preferenceId }
    );
    
    // Redirect to MercadoPago checkout URL
    window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
  } catch (error) {
    console.error('Erro ao iniciar checkout do Mercado Pago:', error);
    toast.error('Erro ao iniciar o pagamento. Tente novamente.');
  }
};

/**
 * Get payment status from MercadoPago
 */
export const getPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
  try {
    // In production, you would make an API call to get payment status
    // For now, we'll simulate an approved status
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_STATUS_CHECK,
      LogLevel.INFO,
      "Verificando status do pagamento",
      { paymentId }
    );
    
    return PaymentStatus.APPROVED;
  } catch (error) {
    console.error('Erro ao obter status do pagamento:', error);
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      "Erro ao verificar status do pagamento",
      { paymentId, error }
    );
    return PaymentStatus.PENDING;
  }
};

/**
 * Check if payment has been processed
 */
export const checkPaymentProcessed = (orderId: string): boolean => {
  try {
    const processedPayments = localStorage.getItem('processedPayments');
    if (processedPayments) {
      const payments = JSON.parse(processedPayments);
      return payments.includes(orderId);
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar pagamento processado:', error);
    return false;
  }
};

/**
 * Mark payment as processed
 */
export const markPaymentAsProcessed = (orderId: string): void => {
  try {
    let processedPayments = [];
    const savedPayments = localStorage.getItem('processedPayments');
    
    if (savedPayments) {
      processedPayments = JSON.parse(savedPayments);
    }
    
    if (!processedPayments.includes(orderId)) {
      processedPayments.push(orderId);
      localStorage.setItem('processedPayments', JSON.stringify(processedPayments));
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_SUCCESS,
        LogLevel.SUCCESS,
        "Pagamento marcado como processado",
        { orderId }
      );
    }
  } catch (error) {
    console.error('Erro ao marcar pagamento como processado:', error);
  }
};

// Generate test payment info for development
export const generateTestPaymentInfo = (orderId: string, status: PaymentStatus = PaymentStatus.APPROVED) => {
  return {
    id: `test_payment_${Date.now()}`,
    status,
    external_reference: orderId,
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: 100,
    captured: true,
    date_created: new Date().toISOString(),
    date_approved: new Date().toISOString(),
  };
};

// Export public key
export { MP_PUBLIC_KEY };
