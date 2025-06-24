
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from '../useCartManager';
import { PlanKey, Plan } from '@/types/checkout';
import { toast } from 'sonner';
import { calculatePixPrice } from '@/utils/priceCalculator';

// Define PLANS com preços corretos
const PLANS: Record<number, Plan> = {
  1: { 
    id: 1, 
    name: 'Mensal', 
    months: 1, 
    price: 200,
    discount: 0 
  },
  3: { 
    id: 3, 
    name: 'Trimestral', 
    months: 3, 
    price: 160,
    discount: 20 
  },
  6: { 
    id: 6, 
    name: 'Semestral', 
    months: 6, 
    price: 140,
    discount: 30 
  },
  12: { 
    id: 12, 
    name: 'Anual', 
    months: 12, 
    price: 125,
    discount: 37.5 
  }
};

export const usePlanSelection = (hasCart: boolean) => {
  const navigate = useNavigate();
  const { cartItems, selectedPlan, setSelectedPlan } = useCartManager();
  
  const [isLoading, setIsLoading] = useState(false);

  // Usar calculador centralizado para preço estimado
  const calculateEstimatedPrice = () => {
    if (!selectedPlan || cartItems.length === 0) {
      return 0;
    }
    
    return calculatePixPrice(selectedPlan, cartItems, 0);
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
