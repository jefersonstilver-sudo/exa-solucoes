
import { useNavigate } from 'react-router-dom';
import { CartItem } from '@/types/cart';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseCartCheckoutProps {
  cartItems: CartItem[];
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    console.log('🚀 [useCartCheckout] Iniciando processo de checkout');
    console.log('🚀 [useCartCheckout] Items no carrinho:', cartItems.length);
    
    if (cartItems.length === 0) {
      console.warn('🚀 [useCartCheckout] Tentativa de checkout com carrinho vazio');
      return;
    }

    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT,
      LogLevel.INFO,
      `Iniciando checkout com ${cartItems.length} itens`,
      { 
        itemCount: cartItems.length,
        totalPrice: cartItems.reduce((sum, item) => sum + item.price, 0)
      }
    );

    setIsNavigating(true);
    setCartOpen(false);
    
    // CORREÇÃO: Navegar para a primeira etapa do checkout (seleção de plano)
    navigate('/checkout/plano');
    
    // Reset navigation state after a delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  return {
    handleProceedToCheckout
  };
};
