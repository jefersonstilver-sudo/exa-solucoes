
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Handles direct redirection to MercadoPago with robust fallback strategies
 * @param preferenceId MercadoPago preference ID
 * @param paymentMethod Payment method (credit_card or pix)
 */
export const handleMercadoPagoRedirect = (preferenceId: string, paymentMethod = 'credit_card'): void => {
  if (!preferenceId) {
    console.error('Preference ID is required for MercadoPago redirect');
    return;
  }
  
  // Log payment attempt for diagnostics
  console.log(`[MercadoPago] Iniciando redirecionamento com método: ${paymentMethod}, preferenceId: ${preferenceId}`);
  
  // Construct base URL
  let url = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
  
  // Add payment method to URL if it's PIX 
  if (paymentMethod === 'pix') {
    url += '&payment_method_id=pix';
    console.log('[MercadoPago] Redirecionando para PIX:', url);
  } else {
    console.log('[MercadoPago] Redirecionando para cartão:', url);
  }
  
  logCheckoutEvent(
    CheckoutEvent.PAYMENT_PROCESSING, 
    LogLevel.INFO,
    `Redirecionando para MercadoPago: ${url}`,
    { preferenceId, paymentMethod }
  );
  
  // Implementação simplificada e robusta de redirecionamento
  try {
    // Método primário - navegação direta
    window.location.href = url;
    
    // Fallback em caso de bloqueio de popup ou outra falha
    setTimeout(() => {
      // Verificar se ainda estamos na mesma página após 2 segundos
      if (document.location.href.indexOf('checkout') > -1) {
        console.log('[MercadoPago] Redirecionamento primário falhou, tentando alternativas');
        
        // Alternativa 1: Abrir em nova aba/janela
        const newWindow = window.open(url, '_blank');
        
        // Alternativa 2: Se a nova janela falhou, criar um elemento visual para o usuário clicar
        if (!newWindow || newWindow.closed) {
          console.log('[MercadoPago] Redirecionamento alternativo falhou, criando link manual');
          
          // Criar um overlay com link clicável
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
          button.innerText = paymentMethod === 'pix' ? 'Continuar para o pagamento PIX' : 'Continuar para o pagamento';
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
          
          // Adicionar evento de clique para remover overlay após redirecionamento
          button.addEventListener('click', () => {
            document.body.removeChild(overlay);
          });
        }
      }
    }, 2000);
  } catch (error) {
    console.error('[MercadoPago] Erro crítico ao redirecionar:', error);
    
    // Relatório detalhado do erro
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      `Erro crítico no redirecionamento: ${error}`,
      { error: String(error), preferenceId, paymentMethod, userAgent: navigator.userAgent }
    );
    
    // Último recurso - criar um link para o usuário clicar
    alert(`Erro ao processar pagamento. Por favor, tente novamente ou use o link manual que aparecerá na tela.`);
    
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.innerText = paymentMethod === 'pix' ? 'Clique aqui para pagar com PIX' : 'Clique aqui para abrir o Mercado Pago';
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
