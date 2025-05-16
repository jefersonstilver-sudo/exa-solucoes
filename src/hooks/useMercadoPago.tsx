
import { useState, useEffect } from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseMercadoPagoOptions {
  publicKey: string;
}

export const useMercadoPago = ({ publicKey }: UseMercadoPagoOptions) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  useEffect(() => {
    if (!publicKey) {
      console.error('[MercadoPago] Public key não fornecida');
      setIsError(true);
      
      // CRITICAL FIX: Even without public key, allow the app to proceed
      // since we'll use direct URL redirection instead of SDK
      setIsSDKLoaded(true);
      return;
    }
    
    // Check if SDK is already defined in window
    // @ts-ignore - MercadoPago é carregado via script
    if (window.MercadoPago) {
      console.log('[MercadoPago] SDK já está carregado');
      setIsSDKLoaded(true);
      return;
    }
    
    // Remove any existing script to prevent duplicate loading
    const existingScript = document.getElementById('mercadopago-script');
    if (existingScript) {
      document.body.removeChild(existingScript);
      setIsSDKLoaded(false);
    }
    
    // Log SDK loading start
    console.log('[MercadoPago] Iniciando carregamento do SDK');
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      'Iniciando carregamento do SDK MercadoPago',
      { publicKey: publicKey.substring(0, 8) + '...' }
    );
    
    // Create and load the script
    const script = document.createElement('script');
    script.id = 'mercadopago-script';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    // Set a reasonable timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      if (!isSDKLoaded) {
        console.warn('[MercadoPago] O carregamento do SDK está demorando mais que o esperado');
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.WARNING,
          'Timeout no carregamento do SDK MercadoPago',
          { attempts: loadAttempts }
        );
        
        // CRITICAL FIX: Proceed anyway after timeout
        // We will use direct URL redirection instead of SDK
        console.log('[MercadoPago] Proceeding without SDK (will use direct URL checkout)');
        setIsSDKLoaded(true);
      }
    }, 5000);
    
    script.onload = () => {
      console.log('[MercadoPago] SDK carregado com sucesso');
      clearTimeout(timeoutId);
      
      try {
        // @ts-ignore - MercadoPago é carregado via script
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        
        setIsSDKLoaded(true);
        console.log('[MercadoPago] SDK inicializado corretamente');
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.INFO,
          'SDK MercadoPago carregado com sucesso',
          { success: true }
        );
      } catch (error) {
        console.error('[MercadoPago] Erro ao inicializar:', error);
        setIsError(true);
        
        // CRITICAL FIX: Continue anyway since we'll use direct URL redirection
        setIsSDKLoaded(true);
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.ERROR,
          'Erro ao inicializar SDK MercadoPago',
          { error: String(error) }
        );
      }
    };
    
    script.onerror = (e) => {
      console.error('[MercadoPago] Erro ao carregar SDK:', e);
      clearTimeout(timeoutId);
      setIsError(true);
      
      // CRITICAL FIX: Proceed even without SDK
      console.log('[MercadoPago] Proceeding without SDK (will use direct URL checkout)');
      setIsSDKLoaded(true);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        'Erro ao carregar SDK MercadoPago',
        { error: String(e) }
      );
    };
    
    document.body.appendChild(script);
    
    return () => {
      clearTimeout(timeoutId);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicKey, loadAttempts]);
  
  return {
    isSDKLoaded,
    isError,
    loadAttempts
  };
};
