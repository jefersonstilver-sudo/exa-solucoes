
import { useCheckout } from '@/hooks/useCheckout';
import { usePlanStorage } from './usePlanStorage';
import { usePlanCalculations } from './usePlanCalculations';
import { usePlanNavigation } from './usePlanNavigation';
import { useCallback, useMemo } from 'react';

export const usePlanSelection = (hasCart: boolean) => {
  console.log("🔄 usePlanSelection: Hook chamado, hasCart:", hasCart);
  
  // Estados do checkout
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();

  // Storage operations - memoizado para evitar re-criação
  const { savePlanToStorage } = usePlanStorage(setSelectedPlan);

  // Calculations - memoizado
  const { calculateEstimatedPrice: calculatePrice } = usePlanCalculations();

  // Navigation - usando as funções estáveis
  const { handleGoToCoupon, handleProceed } = usePlanNavigation(
    selectedPlan, 
    savePlanToStorage
  );

  // Wrapper para cálculo de preço com estado atual - memoizado
  const calculateEstimatedPrice = useCallback(() => {
    console.log("💰 Calculando preço estimado:", { selectedPlan, cartItemsLength: cartItems.length });
    return calculatePrice(selectedPlan, cartItems, PLANS);
  }, [calculatePrice, selectedPlan, cartItems, PLANS]);

  // Memoizar o retorno para evitar re-renderizações desnecessárias
  const returnValue = useMemo(() => ({
    selectedPlan,
    setSelectedPlan,
    cartItems,
    PLANS,
    calculateEstimatedPrice,
    handleProceed,
    handleGoToCoupon
  }), [
    selectedPlan,
    setSelectedPlan,
    cartItems,
    PLANS,
    calculateEstimatedPrice,
    handleProceed,
    handleGoToCoupon
  ]);

  console.log("✅ usePlanSelection: Retornando valores:", {
    selectedPlan,
    cartItemsLength: cartItems.length,
    hasHandlers: !!(handleProceed && handleGoToCoupon)
  });

  return returnValue;
};
