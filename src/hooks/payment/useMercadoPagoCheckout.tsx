
import { useState, useEffect, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect, isValidPreferenceId } from '@/services/mercadoPagoService';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
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
        processingPaymentRef.current = false;
        
        // Show error message to user
        sonnerToast.error("O processamento do pagamento está demorando muito. Tente novamente.");
      }, 30000); // Extended to 30 seconds for better reliability
      
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
        setTimeout(() => {
          window.location.href = redirectParam;
        }, 500);
      }
      
      // Also check for error parameter
      const errorParam = url.searchParams.get('error');
      if (errorParam === 'payment_failed') {
        console.log("[MercadoPago] Payment failed, showing error message");
        sonnerToast.error("O pagamento falhou. Por favor, tente novamente.");
        
        // Clean URL
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch (e) {
      console.error("[MercadoPago] Error checking for redirect parameter:", e);
    }
  }, []);

  // Direct redirection function with improved approach
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    // CRITICAL DEBUG: Add detailed tracing for redirect issues
    console.log("[MercadoPago] PAYMENT FLOW TRACE - redirectToMercadoPago chamado", {
      preferenceId: preferenceId ? preferenceId.substring(0, 10) + '...' : 'undefined',
      paymentMethod,
      isCreatingPayment,
      isProcessingRef: processingPaymentRef.current
    });

    // CRITICAL FIX: Validate preference ID
    if (!isValidPreferenceId(preferenceId)) {
      sonnerToast.error("Erro: ID de referência para pagamento inválido");
      console.error("[MercadoPago] Invalid preference ID:", preferenceId);
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Invalid preference ID for MercadoPago redirect",
        { preferenceId }
      );
      return;
    }
    
    // Prevent double redirects
    if (processingPaymentRef.current) {
      console.log("[MercadoPago] Redirect already in progress, skipping");
      return;
    }
    
    processingPaymentRef.current = true;
    
    try {
      // Log detailed information for debugging
      console.log(`[MercadoPago] PAYMENT FLOW TRACE - Redirecionando para checkout com preferenceId: ${preferenceId}`);
      console.log(`[MercadoPago] PAYMENT FLOW TRACE - Método de pagamento: ${paymentMethod}`);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Iniciando redirecionamento para Mercado Pago`,
        { 
          preferenceId,
          paymentMethod,
          timestamp: new Date().toISOString(),
          sdkLoaded: isSDKLoaded,
          sdkError: isError
        }
      );
      
      // CRITICAL FIX: Usando o método enhanced de redirecionamento
      handleMercadoPagoRedirect(preferenceId, paymentMethod);
      
      // Add a timeout to reset state if redirection fails
      setTimeout(() => {
        // We only reset if we're still on the same page
        if (document.visibilityState !== 'hidden') {
          console.log("[MercadoPago] PAYMENT FLOW TRACE - Redirecionamento pode ter falhado, resetando estado");
          setIsCreatingPayment(false);
          processingPaymentRef.current = false;
          
          // Attempt manual recovery - create a clickable button
          const redirectButton = document.createElement('a');
          redirectButton.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
          redirectButton.target = '_blank';
          redirectButton.textContent = 'Clique aqui para pagar se o redirecionamento não funcionou';
          redirectButton.className = 'fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded shadow-lg';
          
          document.body.appendChild(redirectButton);
          
          // Notify the user
          sonnerToast.error("O redirecionamento automático falhou. Use o botão auxiliar no canto inferior direito.");
          
          // Automatically click after a delay
          setTimeout(() => {
            try {
              redirectButton.click();
            } catch (e) {
              console.error("[MercadoPago] Error auto-clicking backup button:", e);
            }
          }, 1000);
          
          // Clean up after some time
          setTimeout(() => {
            if (document.body.contains(redirectButton)) {
              document.body.removeChild(redirectButton);
            }
          }, 30000);
        }
      }, 5000);
      
    } catch (error) {
      console.error("[MercadoPago] Critical error during redirect:", error);
      sonnerToast.error("Erro ao redirecionar para pagamento. Tente novamente.");
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro crítico no redirecionamento: ${error}`,
        { error: String(error) }
      );
    }
  };

  return {
    isCreatingPayment,
    setIsCreatingPayment,
    createdOrderId,
    setCreatedOrderId,
    processingPaymentRef,
    redirectToMercadoPago,
    isMercadoPagoReady: isSDKLoaded && !isError,
    isSDKLoaded,
    isSDKError: isError
  };
};
