
import { useState, useEffect } from 'react';
import { useSimpleCart } from './useSimpleCart';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { useNavigate } from 'react-router-dom';

export const useCartManager = () => {
  const simpleCart = useSimpleCart();
  const navigate = useNavigate();
  
  // CORREÇÃO: Inicialização SÍNCRONA do plano do localStorage
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(() => {
    try {
      const saved = localStorage.getItem('selectedPlan');
      if (saved) {
        const parsed = parseInt(saved);
        if ([1, 3, 6, 12].includes(parsed)) {
          console.log("🔄 [useCartManager] Plano carregado SINCRONAMENTE:", parsed);
          return parsed as PlanKey;
        }
      }
    } catch (e) {
      console.error("❌ [useCartManager] Erro ao carregar plano:", e);
    }
    console.log("🔄 [useCartManager] Usando plano padrão: 1");
    return 1;
  });
  
  const [initialLoadDone, setInitialLoadDone] = useState(true);

  // Save plan to localStorage when it changes
  useEffect(() => {
    if (selectedPlan) {
      try {
        localStorage.setItem('selectedPlan', selectedPlan.toString());
        console.log("💾 [useCartManager] Plano salvo:", selectedPlan);
      } catch (error) {
        console.error('❌ [useCartManager] Erro ao salvar plano:', error);
      }
    }
  }, [selectedPlan]);

  const handleAddToCart = async (panel: Panel, duration: number = 30) => {
    simpleCart.addToCart(panel, duration);
    
    setTimeout(() => {
      simpleCart.setIsOpen(true);
    }, 800);
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
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  };
};
