
import { useState, useEffect } from 'react';
import { useCartManager } from '@/hooks/useCartManager';
import { toast } from 'sonner';

export const useCartVerification = (authVerified: boolean) => {
  const { cartItems, initialLoadDone } = useCartManager();
  const [hasCart, setHasCart] = useState(false);
  const [cartVerified, setCartVerified] = useState(false);

  useEffect(() => {
    if (!authVerified || !initialLoadDone) return;

    console.log('🔍 [useCartVerification] SISTEMA CORRIGIDO - Verificando carrinho:', {
      cartItemsLength: cartItems?.length || 0,
      authVerified,
      initialLoadDone,
      timestamp: new Date().toISOString()
    });

    // CORREÇÃO: Verificação mais flexível
    const hasValidCart = cartItems && cartItems.length > 0;
    
    if (hasValidCart) {
      setHasCart(true);
      console.log('✅ [useCartVerification] Carrinho válido encontrado');
    } else {
      // Tentar recuperar do localStorage antes de considerar vazio
      try {
        const savedCart = localStorage.getItem('checkout_cart');
        const simpleCart = localStorage.getItem('simple_cart');
        
        if (savedCart || simpleCart) {
          const parsedCart = JSON.parse(savedCart || simpleCart || '[]');
          if (parsedCart && parsedCart.length > 0) {
            console.log('🔄 [useCartVerification] Carrinho recuperado do storage');
            setHasCart(true);
            setCartVerified(true);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar carrinho do storage:', error);
      }
      
      // CORREÇÃO: Não bloquear imediatamente, dar uma chance
      console.log('⚠️ [useCartVerification] Carrinho vazio - dando tempo para carregar');
      setHasCart(false);
      
      // Toast informativo em vez de erro bloqueante
      if (cartVerified) { // Só mostrar se já verificou antes
        toast.info("Verificando itens do carrinho...", { duration: 3000 });
      }
    }
    
    setCartVerified(true);
  }, [cartItems, authVerified, initialLoadDone, cartVerified]);

  return {
    hasCart,
    cartVerified,
    initialLoadDone,
    cartItems: cartItems || []
  };
};
