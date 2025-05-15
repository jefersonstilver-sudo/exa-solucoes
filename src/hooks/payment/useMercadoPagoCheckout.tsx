
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
    console.log("MercadoPago SDK status:", {
      isSDKLoaded,
      isError,
      publicKey: MP_PUBLIC_KEY
    });
  }, [isSDKLoaded, isError]);

  // Handle redirection to MercadoPago checkout
  const redirectToMercadoPago = (preferenceId: string) => {
    if (!preferenceId) {
      throw new Error('Preference ID is required for MercadoPago redirect');
    }
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      "Redirecionando para Mercado Pago",
      { preferenceId }
    );
    
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento...");
    
    try {
      // Attempt to use SDK first
      console.log('Iniciando checkout com preferenceId:', preferenceId);
      setTimeout(() => {
        try {
          const checkoutResult = createCheckout({ 
            preferenceId: preferenceId,
            redirectMode: true
          });
          
          if (!checkoutResult.success) {
            // Fallback to direct redirection if SDK fails
            console.log('Fallback: redirecionamento direto para MercadoPago');
            handleMercadoPagoRedirect(preferenceId);
          }
        } catch (checkoutError) {
          console.error('Erro ao iniciar checkout:', checkoutError);
          // Fallback to direct redirection
          handleMercadoPagoRedirect(preferenceId);
        }
      }, 1000); // Delay for toast visibility
    } catch (error) {
      console.error('Erro ao redirecionar para MercadoPago:', error);
      // Ultimate fallback
      handleMercadoPagoRedirect(preferenceId);
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
