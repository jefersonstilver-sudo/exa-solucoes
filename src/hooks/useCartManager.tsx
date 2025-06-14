
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

  // Enhanced handler functions with better feedback
  const handleAddToCart = async (panel: Panel, duration: number = 30) => {
    console.log('🛒 [CartManager] Adicionando ao carrinho:', { panelId: panel.id, duration });
    
    // Call the simple cart add function
    simpleCart.addToCart(panel, duration);
    
    // Auto-open cart after a short delay for better UX
    setTimeout(() => {
      simpleCart.setIsOpen(true);
    }, 800);
  };

  const handleRemoveFromCart = (panelId: string) => {
    console.log('🛒 [CartManager] Removendo do carrinho:', panelId);
    simpleCart.removeFromCart(panelId);
  };

  const handleClearCart = () => {
    console.log('🛒 [CartManager] Limpando carrinho');
    simpleCart.clearCart();
  };

  const handleChangeDuration = (panelId: string, duration: number) => {
    console.log('🛒 [CartManager] Alterando duração:', { panelId, duration });
    simpleCart.updateDuration(panelId, duration);
  };

  const handleProceedToCheckout = () => {
    console.log('🛒 [CartManager] Procedendo para checkout');
    simpleCart.proceedToCheckout();
  };

  return {
    ...simpleCart,
    selectedPlan,
    setSelectedPlan,
    initialLoadDone,
    // Enhanced handler functions
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  };
};
