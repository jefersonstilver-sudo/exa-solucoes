
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
      return;
    }
    
    // Remove any existing script to prevent duplicate loading
    const existingScript = document.getElementById('mercadopago-script');
    if (existingScript) {
      document.body.removeChild(existingScript);
      setIsSDKLoaded(false);
    }
    
    // Log carregamento do SDK
    console.log('[MercadoPago] Iniciando carregamento do SDK');
    
    // Create and load the script
    const script = document.createElement('script');
    script.id = 'mercadopago-script';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    // Timeouts para detectar problemas de carregamento
    const timeoutId = setTimeout(() => {
      if (!isSDKLoaded) {
        console.warn('[MercadoPago] O carregamento do SDK está demorando mais que o esperado');
        
        // Tenta recarregar após falha - simplified retries
        if (loadAttempts < 1) {
          setLoadAttempts(prev => prev + 1);
          if (document.contains(script)) {
            document.body.removeChild(script);
          }
          document.body.appendChild(script);
        } else {
          // After retry, just proceed without SDK
          console.log('[MercadoPago] Proceeding without SDK after retry');
          setIsSDKLoaded(true); // Let the app proceed anyway
        }
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
      } catch (error) {
        console.error('[MercadoPago] Erro ao inicializar:', error);
        setIsError(true);
        // Simply continue anyway since we'll use direct URL redirection
        setIsSDKLoaded(true);
      }
    };
    
    script.onerror = (e) => {
      console.error('[MercadoPago] Erro ao carregar SDK:', e);
      clearTimeout(timeoutId);
      setIsError(true);
      
      // CRITICAL FIX: Proceed even without SDK, since we'll use direct URLs
      console.log('[MercadoPago] Proceeding without SDK (will use direct URL checkout)');
      setIsSDKLoaded(true); // Let the app proceed without SDK
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
