
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
    
    // Normalize payment method to valid values only
    const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Register redirection event with normalized payment method
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Starting redirection to Mercado Pago with method ${normalizedPaymentMethod}`,
      { preferenceId, paymentMethod: normalizedPaymentMethod }
    );
    
    console.log(`[MercadoPago] Redirecting to payment with method: ${normalizedPaymentMethod}`);
    
    // Show confirmation toast before redirection
    sonnerToast.dismiss();
    sonnerToast.success(normalizedPaymentMethod === 'pix' 
      ? "Redirecionando para pagamento PIX..." 
      : "Redirecionando para pagamento...");
    
    // Small timeout to ensure the toast is displayed before redirection
    setTimeout(() => {
      // Use the unified redirection service with normalized payment method
      handleMercadoPagoRedirect(preferenceId, normalizedPaymentMethod);
    }, 800);
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
