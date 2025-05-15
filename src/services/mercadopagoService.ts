
import { MP_PUBLIC_KEY } from './mercadoPago';

// Função para inicializar o MercadoPago Checkout
export const initMercadoPagoCheckout = (preferenceId: string): void => {
  // Redirecionamento para a URL de checkout do MercadoPago
  window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
};

// Função para obter o status do pagamento
export const getPaymentStatus = async (paymentId: string): Promise<string> => {
  try {
    // Em um ambiente real, você faria uma chamada à API
    // Para fins de demonstração, simulamos status aprovado
    return 'approved';
  } catch (error) {
    console.error('Erro ao obter status do pagamento:', error);
    return 'error';
  }
};

// Verificar se o pagamento foi processado
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

// Marcar pagamento como processado
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
    }
  } catch (error) {
    console.error('Erro ao marcar pagamento como processado:', error);
  }
};
