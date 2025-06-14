
import { useState, useEffect } from 'react';
import { useSimpleCart } from './useSimpleCart';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { useNavigate } from 'react-router-dom';

// Helper para forçar atualização e sincronização de carrinho a partir do localStorage ao entrar na página de resumo
const forceLocalCartSync = () => {
  try {
    const localCart = localStorage.getItem('simple_cart');
    if (localCart) {
      return JSON.parse(localCart);
    }
  } catch (e) {
    console.error('Erro ao ler simple_cart do localStorage:', e);
  }
  return [];
};

export const useCartManager = () => {
  const simpleCart = useSimpleCart();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [syncedCartItems, setSyncedCartItems] = useState(simpleCart.cartItems);
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

  // Sincronizar carrinho com localStorage ao entrar na página de resumo/checkout
  useEffect(() => {
    // Checa se está na URL de checkout/revisão
    if (window.location.pathname.startsWith('/checkout/')) {
      const syncedFromLocal = forceLocalCartSync();
      if (
        Array.isArray(syncedFromLocal) &&
        syncedFromLocal.length !== simpleCart.cartItems.length
      ) {
        console.log('[CartManager] Sincronizando carrinho do localStorage:', {
          previous: simpleCart.cartItems.length,
          new: syncedFromLocal.length,
        });
        // Força atualização
        simpleCart.setCartItems(syncedFromLocal);
        setSyncedCartItems(syncedFromLocal);
      } else {
        setSyncedCartItems(simpleCart.cartItems);
      }
    } else {
      setSyncedCartItems(simpleCart.cartItems);
    }
  }, [simpleCart.cartItems]);

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
    // Adicionando log detalhado
    console.log('[CartManager] Procedendo para checkout', {
      simpleCartLength: simpleCart.cartItems.length,
      syncedCartLength: syncedCartItems.length,
    });
    // Garante sincronização antes de navegar
    if (
      syncedCartItems.length === 0 ||
      !Array.isArray(syncedCartItems) ||
      !syncedCartItems[0]?.panel
    ) {
      alert('Seu carrinho está vazio ou em estado inconsistente. Tente recarregar a página ou adicionar um painel novamente.');
      return;
    }

    simpleCart.setIsOpen(false);
    navigate('/plano');
  };

  return {
    ...simpleCart,
    selectedPlan,
    setSelectedPlan,
    initialLoadDone,
    cartItems: syncedCartItems, // sempre retorna os sincronizados
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  };
};
