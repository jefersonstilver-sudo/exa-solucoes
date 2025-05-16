
import { useState, useEffect } from 'react';

export const usePaymentFlowState = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Reset payment state when component unmounts
  useEffect(() => {
    return () => {
      setIsCreatingPayment(false);
    };
  }, []);

  return {
    isCreatingPayment,
    setIsCreatingPayment
  };
};
