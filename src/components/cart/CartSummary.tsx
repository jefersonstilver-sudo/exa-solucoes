
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
  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log for diagnostics
    logCheckoutEvent(
      CheckoutEvent.AUDIT,
      LogLevel.INFO,
      "Checkout button clicked",
      { isEmpty, isSubmitting }
    );
    
    // If button is already processing or cart is empty, do nothing
    if (isSubmitting || isEmpty) {
      return;
    }
    
    // Detailed log of checkout button click
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT,
      LogLevel.INFO,
      "Checkout button clicked in cart summary"
    );
    
    // Call handler passed as prop
    onCheckout(e);
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
        className="w-full bg-[#3C1361] hover:bg-[#2A0D45] text-white"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Complete purchase
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        By proceeding, you agree to our terms of use
      </p>
    </div>
  );
};

export default CartSummary;
