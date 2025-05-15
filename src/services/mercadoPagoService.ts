
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Handles direct redirection to MercadoPago with fallback strategies
 */
export const handleMercadoPagoRedirect = (preferenceId: string): void => {
  if (!preferenceId) {
    console.error('Preference ID is required for MercadoPago redirect');
    return;
  }
  
  const url = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecionando para MercadoPago: ${url}`,
    { preferenceId }
  );
  
  try {
    // Método primário - navegação direta
    window.location.href = url;
    
    // Fallback caso a navegação direta falhe
    setTimeout(() => {
      if (document.location.href.indexOf('/checkout') > -1) {
        console.log('Tentando redirecionamento alternativo para MercadoPago');
        
        // Fallback 1: Open in new tab
        const newTab = window.open(url, '_blank');
        
        // Fallback 2: Se não conseguir abrir uma nova aba, tenta window.location novamente
        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          document.location.href = url;
        }
      }
    }, 3000);
  } catch (error) {
    console.error('Erro ao redirecionar para MercadoPago:', error);
    
    // Último fallback - criar um link para o usuário clicar
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.innerText = 'Clique aqui para abrir o Mercado Pago';
    linkElement.style.display = 'block';
    linkElement.style.margin = '20px auto';
    linkElement.style.padding = '10px 20px';
    linkElement.style.backgroundColor = '#009ee3';
    linkElement.style.color = 'white';
    linkElement.style.borderRadius = '5px';
    linkElement.style.textAlign = 'center';
    linkElement.style.textDecoration = 'none';
    linkElement.style.fontWeight = 'bold';
    
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
