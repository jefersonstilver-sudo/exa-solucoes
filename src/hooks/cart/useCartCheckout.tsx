
import { useNavigate } from 'react-router-dom';
import { CartItem } from './useCartState';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';
import { Dispatch, SetStateAction } from 'react';

interface UseCartCheckoutProps {
  cartItems: CartItem[];
  setIsNavigating: Dispatch<SetStateAction<boolean>>;
  setCartOpen: Dispatch<SetStateAction<boolean>>;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();
  
  // Handle checkout process
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      sonnerToast.error('Adicione itens ao carrinho antes de continuar');
      return;
    }
    
    try {
      setIsNavigating(true);
      
      // Close cart
      setCartOpen(false);
      
      // Log checkout event
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT,
        LogLevel.INFO,
        `Iniciando checkout com ${cartItems.length} itens no carrinho`,
        { cartItems: cartItems.map(item => item.panel.id) }
      );
      
      // Navigate to plan selection page
      navigate('/selecionar-plano');
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR,
        `Erro ao processar checkout: ${error}`,
        { error: String(error) }
      );
      
      sonnerToast.error('Erro ao processar checkout. Tente novamente.');
    } finally {
      setIsNavigating(false);
    }
  };
  
  return {
    handleProceedToCheckout
  };
};
