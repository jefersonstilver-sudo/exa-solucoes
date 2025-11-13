
// Deprecated hook - MercadoPago integration removed
// This file is kept for backward compatibility with existing imports
// Use useStripeCheckout instead

import { useState } from 'react';

export const useMercadoPagoCheckout = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  const redirectToMercadoPago = () => {
    throw new Error('MercadoPago deprecated - Use Stripe integration instead');
  };

  return {
    isCreatingPayment,
    createdOrderId,
    redirectToMercadoPago,
    isMercadoPagoReady: false,
    isSDKLoaded: false,
    isSDKError: false,
  };
};
