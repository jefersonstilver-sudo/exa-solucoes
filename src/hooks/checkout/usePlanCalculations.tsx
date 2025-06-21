
import { PlanKey, Plan } from '@/types/checkout';
import { CartItem } from '@/types/cart';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { logPriceCalculation } from '@/utils/auditLogger';

export const usePlanCalculations = () => {
  // CORREÇÃO: Usar função centralizada para consistência total
  const calculateEstimatedPrice = (
    selectedPlan: PlanKey | null,
    cartItems: CartItem[],
    PLANS: Record<number, Plan>
  ) => {
    if (!selectedPlan || !cartItems.length) {
      console.log("💰 [usePlanCalculations] Cálculo cancelado - dados insuficientes:", {
        selectedPlan,
        cartItemsLength: cartItems.length
      });
      return 0;
    }
    
    // CORREÇÃO: Usar função centralizada em vez de lógica própria
    const result = calculateTotalPrice(selectedPlan, cartItems, 0, false);
    
    console.log("💰 [usePlanCalculations] RESULTADO CORRIGIDO:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      estimatedPrice: result,
      timestamp: new Date().toISOString(),
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome
      }))
    });
    
    // Log para auditoria
    logPriceCalculation('usePlanCalculations', {
      selectedPlan,
      cartItemsCount: cartItems.length,
      estimatedPrice: result,
      cartItems: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome
      }))
    });
    
    return result;
  };

  return {
    calculateEstimatedPrice
  };
};
