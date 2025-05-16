
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
    
    // Verificação extra quando o SDK estiver carregado
    if (isSDKLoaded) {
      console.log("[MercadoPago] SDK carregado com sucesso!");
    }
  }, [isSDKLoaded, isError]);

  // CRITICAL FIX: Handle redirection to MercadoPago checkout with explicit payment method
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
      throw new Error('Preference ID is required for MercadoPago redirect');
    }
    
    // Critical logging for payment method handling
    console.log(`[MercadoPago] Iniciando redirecionamento com método: ${paymentMethod}, preferenceId: ${preferenceId.substring(0, 10)}...`);
    
    // Store attempted payment info for debugging
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando redirecionamento para Mercado Pago com método ${paymentMethod}`,
      { preferenceId, paymentMethod }
    );
    
    // Display toast before redirect
    sonnerToast.success("Redirecionando para ambiente de pagamento...");
    
    // CRITICAL FIX: Use enhanced redirect implementation with explicit payment method
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
