
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
        
        // Add slight delay to allow UI to render
        setTimeout(() => {
          // Execute redirect - IMMEDIATELY OPEN IN NEW TAB
          window.open(redirectParam, '_blank');
          
          // Also use location.href as fallback
          setTimeout(() => {
            window.location.href = redirectParam;
          }, 300);
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
      // Log detailed information for debugging
      console.log(`[MercadoPago] Redirecionando para checkout com preferenceId: ${preferenceId.substring(0, 10)}...`);
      console.log(`[MercadoPago] Método de pagamento: ${paymentMethod}`);
      
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
          console.log("[MercadoPago] Redirection may have failed, resetting state");
          setIsCreatingPayment(false);
          paymentInProgressRef.current = false;
          
          // Tentar novamente usando o botão auxiliar
          const redirectButton = document.createElement('a');
          redirectButton.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
          redirectButton.target = '_blank';
          redirectButton.textContent = 'Clique aqui para pagar se o redirecionamento não funcionou';
          redirectButton.className = 'bg-blue-500 text-white px-4 py-2 rounded fixed bottom-4 right-4 z-50 shadow-lg';
          
          document.body.appendChild(redirectButton);
          
          // Notify the user
          sonnerToast.error("O redirecionamento automático falhou. Use o botão auxiliar no canto inferior direito da tela.");
          
          setTimeout(() => {
            // Automatically click the button
            redirectButton.click();
            
            // Remove after some time
            setTimeout(() => {
              if (document.body.contains(redirectButton)) {
                document.body.removeChild(redirectButton);
              }
            }, 30000);
          }, 1000);
        }
      }, 5000);
      
    } catch (error) {
      console.error("[MercadoPago] Critical error during redirect:", error);
      sonnerToast.error("Erro ao redirecionar para pagamento. Tente novamente.");
      setIsCreatingPayment(false);
      paymentInProgressRef.current = false;
      
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
    redirectToMercadoPago,
    isMercadoPagoReady: isSDKLoaded && !isError,
    isSDKLoaded,
    isSDKError: isError
  };
};
