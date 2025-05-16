
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Initialize MercadoPago
  const { isSDKLoaded, createCheckout, isError } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Log MercadoPago SDK status for diagnostics
  useEffect(() => {
    console.log("[MercadoPago] SDK status:", {
      isSDKLoaded,
      isError,
      publicKey: MP_PUBLIC_KEY ? MP_PUBLIC_KEY.substring(0, 10) + '...' : 'missing'
    });
  }, [isSDKLoaded, isError]);

  // Handle redirection to MercadoPago checkout with explicit payment method handling
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
      throw new Error('Preference ID is required for MercadoPago redirect');
    }
    
    // Mostrar toast antes do redirecionamento
    sonnerToast.success('Redirecionando para o Mercado Pago...', {
      duration: 5000 // Toast mais longo para garantir visibilidade
    });
    
    // Log do evento para rastreamento
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando redirecionamento para o Mercado Pago com método ${paymentMethod}`,
      { preferenceId, paymentMethod }
    );
    
    try {
      // SOLUÇÃO: Usar a implementação de redirecionamento melhorada
      handleMercadoPagoRedirect(preferenceId, paymentMethod);
      
      // Defina um temporizador para verificar se ainda estamos na mesma página após alguns segundos
      setTimeout(() => {
        if (document.location.pathname.includes('checkout')) {
          console.warn('[MercadoPago] Possível falha no redirecionamento. Tentando novamente...');
          handleMercadoPagoRedirect(preferenceId, paymentMethod);
        }
      }, 3000);
    } catch (error) {
      console.error('[MercadoPago] Erro ao redirecionar:', error);
      setIsCreatingPayment(false);
      sonnerToast.error("Erro ao redirecionar para o Mercado Pago");
    }
  };

  return {
    isCreatingPayment,
    setIsCreatingPayment,
    redirectToMercadoPago,
    isMercadoPagoReady: isSDKLoaded && !isError,
    isSDKLoaded,
    isSDKError: isError
  };
};
