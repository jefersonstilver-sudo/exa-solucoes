
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from '../useCartManager';
import { PlanKey, Plan } from '@/types/checkout';
import { toast } from 'sonner';
import { calculateTotalPrice } from '@/utils/checkoutUtils';

// Define PLANS com preços corretos - CORREÇÃO: Remover valores fixos
const PLANS: Record<number, Plan> = {
  1: { 
    id: 1, 
    name: 'Mensal', 
    months: 1, 
    price: 0, // Será calculado dinamicamente
    discount: 0 
  },
  3: { 
    id: 3, 
    name: 'Trimestral', 
    months: 3, 
    price: 0, // Será calculado dinamicamente
    discount: 20 
  },
  6: { 
    id: 6, 
    name: 'Semestral', 
    months: 6, 
    price: 0, // Será calculado dinamicamente
    discount: 30 
  },
  12: { 
    id: 12, 
    name: 'Anual', 
    months: 12, 
    price: 0, // Será calculado dinamicamente
    discount: 37.5 
  }
};

export const usePlanSelection = (hasCart: boolean) => {
  const navigate = useNavigate();
  const { cartItems, selectedPlan, setSelectedPlan } = useCartManager();
  
  const [isLoading, setIsLoading] = useState(false);

  // CORREÇÃO: Usar calculador baseado no preço do prédio
  const calculateEstimatedPrice = () => {
    if (!selectedPlan || cartItems.length === 0) {
      console.log("💰 [usePlanSelection] Cálculo cancelado - dados insuficientes:", {
        selectedPlan,
        cartItemsLength: cartItems.length
      });
      return 0;
    }
    
    // Usar função do checkoutUtils que respeita o preco_base do prédio
    const result = calculateTotalPrice(selectedPlan, cartItems, 0, false);
    
    console.log("💰 [usePlanSelection] PREÇO CORRIGIDO BASEADO NO PRÉDIO:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      estimatedPrice: result,
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base
      }))
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
      localStorage.setItem('selectedPlan', selectedPlan.toString());
      navigate('/checkout/cupom');
    } catch (error) {
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
