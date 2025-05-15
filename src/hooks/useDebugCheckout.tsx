
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useDebugCheckout = (cartItems: CartItem[]) => {
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const navigate = useNavigate();
  
  /**
   * Função para navegar diretamente para o checkout sem passar pelos fluxos normais
   */
  const directGoToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log para rastreamento e diagnóstico
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Botão de checkout direto clicado",
      { cartItemsCount: cartItems.length }
    );
    
    if (cartItems.length === 0) {
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR,
        "Tentativa de checkout direto com carrinho vazio"
      );
      return;
    }
    
    try {
      // Garantir que o carrinho está salvo no localStorage
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Definir um plano padrão para teste
      localStorage.setItem('selectedPlan', '3');
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Navegação direta para checkout",
        { url: '/checkout', cartItemsCount: cartItems.length }
      );
      
      // Registrar a navegação e navegar
      logNavigation('/checkout', 'direct', true);
      
      // Usar navigate do React Router
      navigate('/checkout');
    } catch (error) {
      console.error("Erro na navegação direta para checkout:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        "Erro na navegação direta para checkout",
        { error: String(error) }
      );
      
      // Fallback para navegação via window.location
      logNavigation('/checkout', 'location', true);
      window.location.href = '/checkout';
    }
  };
  
  return {
    debugModalOpen,
    setDebugModalOpen,
    directGoToCheckout
  };
};
