
import { useState, useEffect } from 'react';
import { useSimpleCart } from './useSimpleCart';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { useNavigate } from 'react-router-dom';

export const useCartManager = () => {
  const simpleCart = useSimpleCart();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const navigate = useNavigate();

  // Load saved plan from localStorage on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
        }
      }
    } catch (error) {
      console.error('Error loading saved plan:', error);
    } finally {
      setInitialLoadDone(true);
    }
  }, []);

  // Save plan to localStorage when it changes
  useEffect(() => {
    if (selectedPlan) {
      try {
        localStorage.setItem('selectedPlan', selectedPlan.toString());
      } catch (error) {
        console.error('Error saving plan:', error);
      }
    }
  }, [selectedPlan]);

  // Handler functions expected by components
  const handleAddToCart = (panel: Panel, duration: number = 30) => {
    simpleCart.addToCart(panel, duration);
  };

  const handleRemoveFromCart = (panelId: string) => {
    simpleCart.removeFromCart(panelId);
  };

  const handleClearCart = () => {
    simpleCart.clearCart();
  };

  const handleChangeDuration = (panelId: string, duration: number) => {
    simpleCart.updateDuration(panelId, duration);
  };

  const handleProceedToCheckout = () => {
    simpleCart.proceedToCheckout();
  };

  return {
    ...simpleCart,
    selectedPlan,
    setSelectedPlan,
    initialLoadDone,
    // Handler functions
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  };
};
