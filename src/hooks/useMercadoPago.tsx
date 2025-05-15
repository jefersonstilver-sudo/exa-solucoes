
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';

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
  
  useEffect(() => {
    if (!publicKey) {
      console.error('Public key não fornecida para o MercadoPago SDK');
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
    
    // Create and load the script
    const script = document.createElement('script');
    script.id = 'mercadopago-script';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    // Add loading indicator
    sonnerToast.loading('Carregando MercadoPago SDK...');
    
    script.onload = () => {
      console.log('MercadoPago SDK carregado com sucesso');
      sonnerToast.dismiss();
      try {
        // @ts-ignore - MercadoPago é carregado via script
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        
        setMercadoPago(mp);
        setIsSDKLoaded(true);
        console.log('MercadoPago inicializado corretamente');
      } catch (error) {
        console.error('Erro ao inicializar MercadoPago:', error);
        sonnerToast.error('Erro ao inicializar MercadoPago');
        setIsError(true);
      }
    };
    
    script.onerror = () => {
      console.error('Erro ao carregar MercadoPago SDK');
      sonnerToast.error('Erro ao carregar MercadoPago SDK');
      setIsError(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicKey]);

  const createCheckout = ({ preferenceId, redirectMode = true, paymentMethod }: MercadoPagoCheckoutOptions) => {
    if (!isSDKLoaded || !mercadoPago) {
      console.error('MercadoPago SDK não carregado');
      return { success: false, error: 'MercadoPago SDK não carregado' };
    }
    
    try {
      console.log(`Iniciando checkout do MercadoPago com preferenceId: ${preferenceId}, modo: ${redirectMode ? 'redirect' : 'modal'}, método: ${paymentMethod || 'default'}`);
      
      // Direct redirect approach - more reliable for all payment methods
      const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
      console.log('Redirecionando para:', checkoutUrl);
      
      // Force page redirect with delay to ensure toast is visible
      sonnerToast.success('Redirecionando para Mercado Pago...');
      
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 800);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar checkout do MercadoPago:', error);
      return { success: false, error };
    }
  };
  
  return {
    isSDKLoaded,
    isError,
    createCheckout,
  };
};
