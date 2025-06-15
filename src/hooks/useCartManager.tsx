
import { useState, useEffect } from 'react';
import { useSimpleCart } from './useSimpleCart';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';

const SELECTED_PLAN_KEY = 'selected_plan';

export const useCartManager = () => {
  const simpleCart = useSimpleCart();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load saved plan from localStorage on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(SELECTED_PLAN_KEY);
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          console.log('🔄 [CartManager] Plano carregado do localStorage:', parsedPlan);
          setSelectedPlan(parsedPlan as PlanKey);
        }
      }
    } catch (error) {
      console.error('Error loading saved plan:', error);
    } finally {
      setInitialLoadDone(true);
    }
  }, []);

  // Save plan to localStorage when it changes and sync across tabs
  useEffect(() => {
    if (selectedPlan && initialLoadDone) {
      try {
        console.log('💾 [CartManager] Salvando plano selecionado:', selectedPlan);
        localStorage.setItem(SELECTED_PLAN_KEY, selectedPlan.toString());
        
        // Disparar evento para sincronizar entre abas
        window.dispatchEvent(new StorageEvent('storage', {
          key: SELECTED_PLAN_KEY,
          newValue: selectedPlan.toString()
        }));
      } catch (error) {
        console.error('Error saving plan:', error);
      }
    }
  }, [selectedPlan, initialLoadDone]);

  // Listen for storage changes to sync selectedPlan across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_PLAN_KEY && e.newValue) {
        const newPlan = parseInt(e.newValue);
        if ([1, 3, 6, 12].includes(newPlan)) {
          console.log('🔄 [CartManager] Plano sincronizado de outra aba:', newPlan);
          setSelectedPlan(newPlan as PlanKey);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    // Limpar também o plano selecionado
    setSelectedPlan(null);
    localStorage.removeItem(SELECTED_PLAN_KEY);
  };

  const handleChangeDuration = (panelId: string, duration: number) => {
    console.log('🛒 [CartManager] Alterando duração:', { panelId, duration });
    simpleCart.updateDuration(panelId, duration);
  };

  const handleProceedToCheckout = () => {
    console.log('🛒 [CartManager] Procedendo para checkout');
    simpleCart.proceedToCheckout();
  };

  // Enhanced setSelectedPlan with logging
  const handleSetSelectedPlan = (plan: PlanKey | null) => {
    console.log('📋 [CartManager] Alterando plano selecionado:', { from: selectedPlan, to: plan });
    setSelectedPlan(plan);
  };

  return {
    ...simpleCart,
    selectedPlan,
    setSelectedPlan: handleSetSelectedPlan,
    initialLoadDone,
    // Enhanced handler functions
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  };
};
