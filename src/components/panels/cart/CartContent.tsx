
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import CartEmpty from './CartEmpty';
import { Panel } from '@/types/panel';

interface CartContentProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  calculatePrice: (panel: Panel, duration: number) => number;
  formatCurrency: (value: number) => string;
  calculateOriginalTotal: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
}

const CartContent: React.FC<CartContentProps> = ({
  cartItems,
  onRemove,
  onChangeDuration,
  calculatePrice,
  formatCurrency,
  calculateOriginalTotal,
  calculateDiscount,
  calculateTotal
}) => {
  if (cartItems.length === 0) {
    return <CartEmpty />;
  }

  return (
    <>
      <div className="space-y-5">
        <AnimatePresence>
          {cartItems.map(({ panel, duration }) => (
            <CartItem
              key={panel.id}
              panel={panel}
              duration={duration}
              onRemove={onRemove}
              onChangeDuration={onChangeDuration}
              price={formatCurrency(calculatePrice(panel, duration))}
            />
          ))}
        </AnimatePresence>
      </div>
      
      <CartSummary 
        subtotal={formatCurrency(calculateOriginalTotal())}
        discount={formatCurrency(calculateDiscount())}
        total={formatCurrency(calculateTotal())}
      />
    </>
  );
};

export default CartContent;
