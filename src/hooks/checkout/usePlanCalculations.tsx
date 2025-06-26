
import { PlanKey, Plan } from '@/types/checkout';
import { CartItem } from '@/types/cart';
import { calculatePrice } from '@/utils/priceCalculator';
import { logPriceCalculation } from '@/utils/auditLogger';

export const usePlanCalculations = () => {
  // CORREÇÃO: Usar função centralizada que já multiplica pelos meses
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
    
    // CORREÇÃO: Usar função centralizada que respeita o preco_base E multiplica pelos meses
    const result = calculatePrice(selectedPlan, cartItems, 0, false);
    
    console.log("💰 [usePlanCalculations] RESULTADO BASEADO NO PREÇO DO PRÉDIO MULTIPLICADO POR MESES:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      estimatedPrice: result.subtotal,
      mesesIncluidos: `Valor já inclui ${selectedPlan} meses`,
      timestamp: new Date().toISOString(),
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base_mensal: item.panel.buildings?.preco_base
      }))
    });
    
    // Log para auditoria
    logPriceCalculation('usePlanCalculations', {
      selectedPlan,
      cartItemsCount: cartItems.length,
      estimatedPrice: result.subtotal,
      cartItems: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base_mensal: item.panel.buildings?.preco_base
      }))
    });
    
    return result.subtotal; // Retorna o subtotal que já inclui a multiplicação pelos meses
  };

  return {
    calculateEstimatedPrice
  };
};
