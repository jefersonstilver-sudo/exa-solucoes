
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from '../useCartManager';
import { PlanKey, Plan } from '@/types/checkout';
import { toast } from 'sonner';
import { calculateTotalPrice } from '@/utils/checkoutUtils';

// Define PLANS locally com preços corretos
const PLANS: Record<number, Plan> = {
  1: { 
    id: 1, 
    name: 'Mensal', 
    months: 1, 
    price: 200, // R$ 200/mês
    discount: 0 
  },
  3: { 
    id: 3, 
    name: 'Trimestral', 
    months: 3, 
    price: 160, // R$ 160/mês (20% desconto)
    discount: 20 
  },
  6: { 
    id: 6, 
    name: 'Semestral', 
    months: 6, 
    price: 140, // R$ 140/mês (30% desconto)
    discount: 30 
  },
  12: { 
    id: 12, 
    name: 'Anual', 
    months: 12, 
    price: 125, // R$ 125/mês (37.5% desconto)
    discount: 37.5 
  }
};

export const usePlanSelection = (hasCart: boolean) => {
  const navigate = useNavigate();
  const { cartItems, selectedPlan, setSelectedPlan } = useCartManager();
  
  const [isLoading, setIsLoading] = useState(false);

  // CORREÇÃO: Usar função centralizada para calcular preço estimado
  const calculateEstimatedPrice = () => {
    if (!selectedPlan || cartItems.length === 0) {
      console.log("💰 [usePlanSelection] Cálculo cancelado - dados insuficientes:", {
        selectedPlan,
        cartItemsLength: cartItems.length
      });
      return 0;
    }
    
    // Usar função centralizada para garantir consistência
    const result = calculateTotalPrice(selectedPlan, cartItems, 0, false);
    
    console.log("💰 [usePlanSelection] PREÇO ESTIMADO CORRIGIDO:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      estimatedPrice: result,
      calculation: `${cartItems.length} painéis × R$ ${PLANS[selectedPlan]?.price}/mês × ${selectedPlan} meses = R$ ${result}`
    });
    
    return result;
  };

  // Navigate to coupon page
  const handleGoToCoupon = async () => {
    if (!selectedPlan) {
      toast.error("Selecione um plano para continuar");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Adicione painéis ao carrinho para continuar");
      return;
    }

    setIsLoading(true);
    
    try {
      // Save selected plan to localStorage for persistence
      localStorage.setItem('selectedPlan', selectedPlan.toString());
      
      // Navigate to coupon page
      navigate('/checkout/cupom');
    } catch (error) {
      console.error("Error navigating to coupon page:", error);
      toast.error("Erro ao prosseguir");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    PLANS,
    cartItems,
    calculateEstimatedPrice,
    handleGoToCoupon,
    isLoading
  };
};
