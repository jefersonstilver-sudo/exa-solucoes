
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from '../useCartManager';
import { PlanKey, Plan } from '@/types/checkout';
import { toast } from 'sonner';

// Define PLANS locally
const PLANS: Record<number, Plan> = {
  1: { id: 1, name: 'Mensal', months: 1, price: 1, discount: 0 },
  3: { id: 3, name: 'Trimestral', months: 3, price: 0.9, discount: 10 },
  6: { id: 6, name: 'Semestral', months: 6, price: 0.8, discount: 20 },
  12: { id: 12, name: 'Anual', months: 12, price: 0.7, discount: 30 }
};

export const usePlanSelection = (hasCart: boolean) => {
  const navigate = useNavigate();
  const { cartItems, selectedPlan, setSelectedPlan } = useCartManager();
  
  const [isLoading, setIsLoading] = useState(false);

  // Calculate estimated price
  const calculateEstimatedPrice = () => {
    if (!selectedPlan || cartItems.length === 0) return 0;
    
    const plan = PLANS[selectedPlan];
    if (!plan) return 0;
    
    return cartItems.reduce((total, item) => {
      const basePrice = item.panel.buildings?.preco_base || 0;
      return total + (basePrice * plan.price * selectedPlan);
    }, 0);
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
