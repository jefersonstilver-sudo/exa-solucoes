
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Initialize MercadoPago
  const { isSDKLoaded, isError } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Log MercadoPago SDK status for diagnostics
  useEffect(() => {
    console.log("[MercadoPago] SDK status:", {
      isSDKLoaded,
      isError,
      publicKey: MP_PUBLIC_KEY ? MP_PUBLIC_KEY.substring(0, 10) + '...' : 'missing'
    });
    
    if (isSDKLoaded) {
      console.log("[MercadoPago] SDK carregado com sucesso!");
    }
  }, [isSDKLoaded, isError]);

  // Safety timeout to reset payment state if stuck
  useEffect(() => {
    if (isCreatingPayment) {
      const timeout = setTimeout(() => {
        console.log("[MercadoPago] Safety timeout triggered - resetting payment state");
        setIsCreatingPayment(false);
      }, 15000); // 15 seconds safety timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isCreatingPayment]);

  // Direct redirection function with simplified approach
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
      console.error("[MercadoPago] Missing preference ID for redirect");
      setIsCreatingPayment(false);
      return;
    }
    
    try {
      console.log(`[MercadoPago] Iniciando redirecionamento direto com método: ${paymentMethod}, preferenceId: ${preferenceId.substring(0, 10)}...`);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Iniciando redirecionamento para Mercado Pago com método ${paymentMethod}`,
        { preferenceId, paymentMethod }
      );
      
      // CRITICAL FIX: Direct redirection using mercadoPagoService
      handleMercadoPagoRedirect(preferenceId, paymentMethod);
    } catch (error) {
      console.error("[MercadoPago] Critical error during redirect:", error);
      sonnerToast.error("Erro ao redirecionar para pagamento");
      setIsCreatingPayment(false);
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
