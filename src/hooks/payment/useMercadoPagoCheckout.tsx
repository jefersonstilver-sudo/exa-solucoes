
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Initialize MercadoPago
  const { isSDKLoaded, createCheckout, isError } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Log MercadoPago SDK status for diagnostics
  useEffect(() => {
    console.log("[MercadoPago] SDK status:", {
      isSDKLoaded,
      isError,
      publicKey: MP_PUBLIC_KEY ? MP_PUBLIC_KEY.substring(0, 10) + '...' : 'missing'
    });
  }, [isSDKLoaded, isError]);

  // Handle redirection to MercadoPago checkout with explicit payment method handling
  const redirectToMercadoPago = (preferenceId: string, paymentMethod = 'credit_card') => {
    if (!preferenceId) {
      sonnerToast.error("Erro: ID de referência para pagamento não encontrado");
      throw new Error('Preference ID is required for MercadoPago redirect');
    }
    
    // Mostrar toast antes do redirecionamento
    sonnerToast.success('Redirecionando para o Mercado Pago...', {
      duration: 3000 // Toast mais longo para garantir visibilidade
    });
    
    // Log do evento para rastreamento
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando redirecionamento para o Mercado Pago com método ${paymentMethod}`,
      { preferenceId, paymentMethod }
    );
    
    // CORREÇÃO CRÍTICA: Usar método simplificado de redirecionamento
    handleMercadoPagoRedirect(preferenceId, paymentMethod);
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
