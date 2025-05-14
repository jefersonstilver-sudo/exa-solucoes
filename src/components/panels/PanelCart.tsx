
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartHeader from '@/components/cart/CartHeader';
import CartItem from '@/components/cart/CartItem';
import EmptyCart from '@/components/cart/EmptyCart';
import CartSummary from '@/components/cart/CartSummary';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PanelCartProps {
  cartItems: { panel: Panel; duration: number }[];
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
  
  const isEmpty = cartItems.length === 0;
  
  // Calculate subtotal, discount and total
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      return acc + getPanelPrice(item.panel, item.duration);
    }, 0);
  }, [cartItems]);
  
  // Todo: Implement actual discount calculation
  const discount = 0;
  
  const total = subtotal - discount;

  // Function to calculate price for a specific panel and duration
  const calculateItemPrice = (panel: Panel, duration: number) => {
    return getPanelPrice(panel, duration);
  };
  
  const handleCheckout = (e: React.MouseEvent) => {
    // Importante: Prevenir comportamento padrão e propagação para evitar conflitos
    e.preventDefault();
    e.stopPropagation();
    
    // Log detalhado para diagnóstico
    console.log("PanelCart: handleCheckout chamado - iniciando checkout");
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT, 
      LogLevel.INFO, 
      `Iniciando checkout com ${cartItems.length} itens`, 
      { total, cartItems: cartItems.length }
    );
    
    // Verificar se há itens no carrinho
    if (isEmpty) {
      console.log("PanelCart: Checkout cancelado - carrinho vazio");
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT, 
        LogLevel.ERROR, 
        "Tentativa de checkout com carrinho vazio"
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Salvar carrinho manualmente no localStorage para garantir persistência
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.SUCCESS, 
        "Carrinho salvo no localStorage antes do checkout", 
        { items: cartItems.length }
      );
      
      // Chamar a função de checkout que foi passada como prop
      onProceedToCheckout();
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        "Navegando para seleção de plano após checkout"
      );
    } catch (error) {
      console.error("PanelCart: Erro durante checkout", error);
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT, 
        LogLevel.ERROR, 
        "Erro durante processo de checkout", 
        { error }
      );
    } finally {
      // Resetar o estado de envio após um tempo curto
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <CartHeader itemCount={cartItems.length} onClear={onClear} />
      
      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <ScrollArea className="flex-grow">
            <AnimatePresence initial={false}>
              <div className="px-4">
                {cartItems.map(item => (
                  <motion.div
                    key={item.panel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="py-2"
                  >
                    <CartItem 
                      item={item}
                      onRemove={onRemove}
                      onChangeDuration={onChangeDuration}
                      calculatePrice={calculateItemPrice}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
          
          {/* Cart Summary */}
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            total={total}
            onCheckout={handleCheckout}
            isSubmitting={isSubmitting}
            isEmpty={isEmpty}
          />
        </div>
      )}
    </div>
  );
};

export default PanelCart;
