
import { useState, useRef, useEffect } from 'react';
import { useMercadoPagoCheckout } from '../useMercadoPagoCheckout';

/**
 * Hook for initializing and managing payment processing state
 */
export const usePaymentInit = () => {
  // Loading and processing states
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  // Get MercadoPago checkout functionality
  const { 
    redirectToMercadoPago,
    isMercadoPagoReady,
    isSDKLoaded
  } = useMercadoPagoCheckout();
  
  // Reset payment state when component unmounts
  useEffect(() => {
    return () => {
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
    };
  }, []);
  
  return {
    // State
    isCreatingPayment,
    setIsCreatingPayment,
    createdOrderId,
    setCreatedOrderId,
    processingPaymentRef,
    
    // MercadoPago
    redirectToMercadoPago,
    isMercadoPagoReady,
    isSDKLoaded
  };
};
