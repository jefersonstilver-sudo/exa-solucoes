
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
    
    // Validate and log the payment method for debugging
    console.log(`[MercadoPago] Redirecting with payment method: ${paymentMethod}`);
    
    // Log event with payment method for tracking
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Starting redirection to Mercado Pago with method ${paymentMethod}`,
      { preferenceId, paymentMethod }
    );
    
    // Simplistic direct redirect - more reliable than using the SDK
    handleMercadoPagoRedirect(preferenceId, paymentMethod);
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
