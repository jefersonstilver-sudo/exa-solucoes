
import { useState, useEffect } from 'react';

interface MercadoPagoCheckoutOptions {
  preferenceId: string;
  redirectMode?: boolean;
}

interface UseMercadoPagoOptions {
  publicKey: string;
}

export const useMercadoPago = ({ publicKey }: UseMercadoPagoOptions) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [mercadoPago, setMercadoPago] = useState<any>(null);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      console.log('MercadoPago SDK loaded');
      try {
        // @ts-ignore - MercadoPago is loaded via script
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        setMercadoPago(mp);
        setIsSDKLoaded(true);
      } catch (error) {
        console.error('Error initializing MercadoPago:', error);
        setIsError(true);
      }
    };
    script.onerror = () => {
      console.error('Error loading MercadoPago SDK');
      setIsError(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [publicKey]);

  const createCheckout = ({ preferenceId, redirectMode = true }: MercadoPagoCheckoutOptions) => {
    if (!isSDKLoaded || !mercadoPago) {
      console.error('MercadoPago SDK not loaded');
      return { error: 'MercadoPago SDK not loaded' };
    }
    
    try {
      if (redirectMode) {
        // Redirect mode - Navigate to MercadoPago checkout
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
        return { success: true };
      } else {
        // Modal mode - Open MercadoPago checkout in a modal
        // Note: This requires checkout.js to be loaded and a container element
        // const checkout = mercadoPago.checkout({
        //   preference: {
        //     id: preferenceId
        //   },
        //   autoOpen: true,
        // });
        // return { success: true, checkout };
        
        // For simplicity, we'll redirect in both cases
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Error creating MercadoPago checkout:', error);
      return { error };
    }
  };
  
  return {
    isSDKLoaded,
    isError,
    createCheckout,
  };
};
