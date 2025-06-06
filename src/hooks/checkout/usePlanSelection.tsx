
import { useCheckout } from '@/hooks/useCheckout';
import { usePlanStorage } from './usePlanStorage';
import { usePlanCalculations } from './usePlanCalculations';
import { usePlanNavigation } from './usePlanNavigation';
import { useCart } from '@/contexts/SimpleCartContext';
import { useCallback, useMemo, useEffect } from 'react';
import { logPriceCalculation } from '@/utils/auditLogger';

export const usePlanSelection = (hasCart: boolean) => {
  console.log("🔄 usePlanSelection: Hook chamado, hasCart:", hasCart);
  
  // Estados do checkout
  const {
    selectedPlan, 
    setSelectedPlan,
    PLANS
  } = useCheckout();

  // CORREÇÃO: Usar o carrinho do contexto correto
  const { cartItems } = useCart();

  // Log detalhado para debug
  useEffect(() => {
    console.log("🔄 usePlanSelection: Estados atualizados:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      hasCart,
      cartItems: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base,
        price: item.price
      }))
    });
    
    // Log para auditoria quando há mudanças
    if (cartItems.length > 0) {
      logPriceCalculation('usePlanSelection', {
        selectedPlan,
        cartItemsCount: cartItems.length,
        hasCart,
        cartItems: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel.buildings?.nome,
          preco_base: item.panel.buildings?.preco_base,
          price: item.price
        }))
      });
    }
  }, [selectedPlan, cartItems, hasCart]);

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
    console.log("💰 usePlanSelection - Calculando preço estimado:", { 
      selectedPlan, 
      cartItemsLength: cartItems.length,
      cartItems: cartItems.map(item => ({
        panel_id: item.panel.id,
        building_name: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base,
        price: item.price
      }))
    });
    
    const result = calculatePrice(selectedPlan, cartItems, PLANS);
    console.log("💰 usePlanSelection - Resultado do cálculo:", result);
    
    // Log para auditoria
    logPriceCalculation('usePlanSelection-calculateEstimatedPrice', {
      selectedPlan,
      cartItemsCount: cartItems.length,
      estimatedPrice: result,
      cartItems: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base,
        price: item.price
      }))
    });
    
    return result;
  }, [calculatePrice, selectedPlan, cartItems, PLANS]);

  // Memoizar o retorno para evitar re-renderizações desnecessárias
  const returnValue = useMemo(() => ({
    selectedPlan,
    setSelectedPlan,
    cartItems, // CORREÇÃO: Usar cartItems do contexto correto
    PLANS,
    calculateEstimatedPrice,
    handleProceed,
    handleGoToCoupon
  }), [
    selectedPlan,
    setSelectedPlan,
    cartItems, // CORREÇÃO: Dependência correta
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
