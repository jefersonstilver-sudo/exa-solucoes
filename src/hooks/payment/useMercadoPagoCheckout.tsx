
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

  // Handle redirection to MercadoPago checkout
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      throw new Error('Preference ID is required for MercadoPago redirect');
    }
    
    // Registra evento de redirecionamento
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando redirecionamento para Mercado Pago com método ${paymentMethod}`,
      { preferenceId, paymentMethod }
    );
    
    console.log(`[MercadoPago] Redirecionando para pagamento com método: ${paymentMethod}`);
    
    // Mostra toast de confirmação antes do redirecionamento
    sonnerToast.dismiss();
    sonnerToast.success("Redirecionando para pagamento...");
    
    // Timeout pequeno para garantir que o toast seja exibido antes do redirecionamento
    setTimeout(() => {
      // Usa o serviço de redirecionamento unificado
      handleMercadoPagoRedirect(preferenceId, paymentMethod);
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
