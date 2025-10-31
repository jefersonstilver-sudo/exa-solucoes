
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  onCheckout: (e: React.MouseEvent) => void;
  isSubmitting: boolean;
  isEmpty: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  total,
  onCheckout,
  isSubmitting,
  isEmpty
}) => {
  // Use a ref to track clicks to prevent double-clicking
  const isProcessingRef = React.useRef(false);
  
  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log for diagnostics
    logCheckoutEvent(
      CheckoutEvent.AUDIT,
      LogLevel.INFO,
      "Botão de finalizar compra clicado",
      { isEmpty, isSubmitting, timestamp: Date.now() }
    );
    
    // If button is already processing, cart is empty, or a previous click is being handled, do nothing
    if (isSubmitting || isEmpty || isProcessingRef.current) {
      console.log("Checkout prevented: isSubmitting=", isSubmitting, "isEmpty=", isEmpty, "isProcessingRef=", isProcessingRef.current);
      return;
    }
    
    // Set processing flag to prevent multiple rapid clicks
    isProcessingRef.current = true;
    
    // Detailed log of checkout button click
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT,
      LogLevel.INFO,
      "Botão de checkout clicado no sumário do carrinho",
      { timestamp: Date.now() }
    );
    
    console.log("Proceeding with checkout flow");
    
    // Call handler passed as prop
    onCheckout(e);
    
    // Reset processing flag after a delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };
  
  return (
    <div className="border-t p-4 bg-white">
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-green-600">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-semibold mt-2 pt-2 border-t">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button 
        onClick={handleCheckoutClick} 
        disabled={isEmpty || isSubmitting} 
        className="w-full bg-[#9C1E1E] hover:bg-[#180A0A] text-white"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Finalizar compra
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        Ao prosseguir, você concorda com nossos termos de uso
      </p>
    </div>
  );
};

export default CartSummary;
