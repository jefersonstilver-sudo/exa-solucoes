
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
      console.log('MercadoPago SDK carregado com sucesso');
      try {
        // @ts-ignore - MercadoPago é carregado via script
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        setMercadoPago(mp);
        setIsSDKLoaded(true);
      } catch (error) {
        console.error('Erro ao inicializar MercadoPago:', error);
        setIsError(true);
      }
    };
    script.onerror = () => {
      console.error('Erro ao carregar MercadoPago SDK');
      setIsError(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicKey]);

  const createCheckout = ({ preferenceId, redirectMode = true }: MercadoPagoCheckoutOptions) => {
    if (!isSDKLoaded || !mercadoPago) {
      console.error('MercadoPago SDK não carregado');
      return { error: 'MercadoPago SDK não carregado' };
    }
    
    try {
      if (redirectMode) {
        // Modo de redirecionamento - Navega para o checkout do MercadoPago
        window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}`;
        return { success: true };
      } else {
        // Modo modal - Abre o checkout do MercadoPago em um modal
        const checkout = mercadoPago.checkout({
          preference: {
            id: preferenceId
          },
          autoOpen: true,
        });
        return { success: true, checkout };
      }
    } catch (error) {
      console.error('Erro ao criar checkout do MercadoPago:', error);
      return { error };
    }
  };
  
  return {
    isSDKLoaded,
    isError,
    createCheckout,
  };
};
