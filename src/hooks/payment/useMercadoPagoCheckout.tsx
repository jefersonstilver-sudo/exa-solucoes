
import { useState, useEffect, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const paymentInProgressRef = useRef(false);
  
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
        paymentInProgressRef.current = false;
      }, 15000); // 15 seconds safety timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isCreatingPayment]);

  // Check URL for redirect parameter (for handling redirect failures)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const redirectParam = url.searchParams.get('redirect');
      
      if (redirectParam) {
        console.log("[MercadoPago] Detected redirect parameter, executing redirect");
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_PROCESSING,
          LogLevel.INFO,
          "Executando redirecionamento via parâmetro de URL",
          { url: redirectParam }
        );
        
        // Clean URL
        url.searchParams.delete('redirect');
        window.history.replaceState({}, document.title, url.toString());
        
        // Execute redirect
        window.location.href = redirectParam;
      }
    } catch (e) {
      console.error("[MercadoPago] Error checking for redirect parameter:", e);
    }
  }, []);

  // Direct redirection function with simplified approach
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
      console.error("[MercadoPago] Missing preference ID for redirect");
      setIsCreatingPayment(false);
      paymentInProgressRef.current = false;
      return;
    }
    
    // Prevent double redirects
    if (paymentInProgressRef.current) {
      console.log("[MercadoPago] Redirect already in progress, skipping");
      return;
    }
    
    paymentInProgressRef.current = true;
    
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
      paymentInProgressRef.current = false;
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
