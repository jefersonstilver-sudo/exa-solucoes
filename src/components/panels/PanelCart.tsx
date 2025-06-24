
import React, { useState } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import ModernCartLayout from '@/components/cart/ModernCartLayout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { calculatePixPrice } from '@/utils/priceCalculator';

interface PanelCartProps {
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onChangeDuration: (id: string, duration: number) => void;
  onProceedToCheckout: () => void;
}

const PanelCart: React.FC<PanelCartProps> = ({
  cartItems,
  onRemove,
  onClear,
  onChangeDuration,
  onProceedToCheckout
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = () => {
    console.log("PanelCart: Iniciando checkout moderno");
    
    // CORRIGIDO: Calcular total usando calculador centralizado
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
    const total = calculatePixPrice(selectedPlan, cartItems, 0);
    
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT, 
      LogLevel.INFO, 
      `Iniciando checkout moderno com ${cartItems.length} itens`, 
      { 
        total, 
        cartItems: cartItems.length 
      }
    );
    
    if (cartItems.length === 0) {
      console.log("PanelCart: Checkout cancelado - carrinho vazio");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setTimeout(() => {
        onProceedToCheckout();
        setTimeout(() => {
          setIsSubmitting(false);
        }, 3000);
      }, 100);
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        "Navegando para seleção de plano após checkout moderno"
      );
    } catch (error) {
      console.error("PanelCart: Erro durante checkout", error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <ModernCartLayout
      cartItems={cartItems}
      onRemove={onRemove}
      onClear={onClear}
      onChangeDuration={onChangeDuration}
      onProceedToCheckout={handleCheckout}
      isCheckoutLoading={isSubmitting}
    />
  );
};

export default PanelCart;
