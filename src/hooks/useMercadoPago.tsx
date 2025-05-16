
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface MercadoPagoCheckoutOptions {
  preferenceId: string;
  redirectMode?: boolean;
  paymentMethod?: 'credit_card' | 'pix' | string;
}

interface UseMercadoPagoOptions {
  publicKey: string;
}

export const useMercadoPago = ({ publicKey }: UseMercadoPagoOptions) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [mercadoPago, setMercadoPago] = useState<any>(null);
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
      setMercadoPago(null);
    }
    
    // Log carregamento do SDK
    console.log('[MercadoPago] Iniciando carregamento do SDK');
    
    // Create and load the script
    const script = document.createElement('script');
    script.id = 'mercadopago-script';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    // Add loading indicator
    sonnerToast.loading('Carregando MercadoPago SDK...');
    
    // Timeouts para detectar problemas de carregamento
    const timeoutId = setTimeout(() => {
      if (!isSDKLoaded) {
        console.warn('[MercadoPago] O carregamento do SDK está demorando mais que o esperado');
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.WARNING,
          "O carregamento do SDK do MercadoPago está demorando mais que o esperado",
          { publicKey: publicKey.substring(0, 10) + '...', attempts: loadAttempts }
        );
        
        // Tenta recarregar após falha
        if (loadAttempts < 2) {
          setLoadAttempts(prev => prev + 1);
          // Força recarregar o script
          if (document.contains(script)) {
            document.body.removeChild(script);
          }
          document.body.appendChild(script);
        }
      }
    }, 5000);
    
    script.onload = () => {
      console.log('[MercadoPago] SDK carregado com sucesso');
      clearTimeout(timeoutId);
      sonnerToast.dismiss();
      
      try {
        // @ts-ignore - MercadoPago é carregado via script
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        
        setMercadoPago(mp);
        setIsSDKLoaded(true);
        console.log('[MercadoPago] SDK inicializado corretamente');
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.INFO,
          "SDK do MercadoPago carregado com sucesso",
          { publicKey: publicKey.substring(0, 10) + '...' }
        );
      } catch (error) {
        console.error('[MercadoPago] Erro ao inicializar:', error);
        sonnerToast.error('Erro ao inicializar MercadoPago');
        setIsError(true);
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.ERROR,
          `Erro ao inicializar SDK do MercadoPago: ${error}`,
          { error: String(error) }
        );
      }
    };
    
    script.onerror = (e) => {
      console.error('[MercadoPago] Erro ao carregar SDK:', e);
      clearTimeout(timeoutId);
      sonnerToast.error('Erro ao carregar MercadoPago SDK');
      setIsError(true);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        "Erro ao carregar o script do SDK do MercadoPago",
        { publicKey: publicKey.substring(0, 10) + '...', attempts: loadAttempts }
      );
      
      // Tenta recarregar com CDN alternativo
      if (loadAttempts < 2) {
        setLoadAttempts(prev => prev + 1);
        script.src = 'https://sdk.mercadopago.com/js/v2?t=' + new Date().getTime();
        if (document.contains(script)) {
          document.body.removeChild(script);
        }
        document.body.appendChild(script);
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      clearTimeout(timeoutId);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicKey, loadAttempts]);

  const createCheckout = ({ preferenceId, redirectMode = true, paymentMethod = 'credit_card' }: MercadoPagoCheckoutOptions) => {
    if (!isSDKLoaded || !mercadoPago) {
      console.error('[MercadoPago] SDK não carregado');
      return { success: false, error: 'MercadoPago SDK não carregado' };
    }
    
    try {
      console.log(`[MercadoPago] Iniciando checkout com preferenceId: ${preferenceId}, modo: ${redirectMode ? 'redirect' : 'modal'}, método: ${paymentMethod || 'default'}`);
      
      // FIXED: Redirecionamento direto aperfeiçoado
      const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true&payment_method_id=${paymentMethod === 'pix' ? 'pix' : 'credit_card'}`;
      
      console.log('[MercadoPago] URL de redirecionamento:', checkoutUrl);
      
      // Force page redirect with safer approach
      sonnerToast.success('Redirecionando para Mercado Pago...');
      
      // Use uma abordagem de redirecionamento mais confiável
      setTimeout(() => {
        try {
          // Técnica mais confiável para redirecionamento
          window.location.replace(checkoutUrl);
          
          // Fallback se o replace não funcionar
          setTimeout(() => {
            window.location.href = checkoutUrl;
          }, 300);
        } catch (e) {
          console.error('[MercadoPago] Erro ao redirecionar:', e);
          // Último recurso
          window.open(checkoutUrl, '_self');
        }
      }, 500);
      
      return { success: true };
    } catch (error) {
      console.error('[MercadoPago] Erro ao criar checkout:', error);
      return { success: false, error };
    }
  };
  
  return {
    isSDKLoaded,
    isError,
    createCheckout,
    loadAttempts
  };
};
