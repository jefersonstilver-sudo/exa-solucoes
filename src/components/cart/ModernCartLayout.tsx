
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from '@/types/cart';
import ModernCartHeader from './ModernCartHeader';
import ModernCartItem from './ModernCartItem';
import ModernCartSummary from './ModernCartSummary';
import ModernEmptyCart from './ModernEmptyCart';

interface ModernCartLayoutProps {
  cartItems: CartItem[];
  onRemove: (panelId: string) => void;
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  onProceedToCheckout: () => void;
  isCheckoutLoading?: boolean;
}

const ModernCartLayout: React.FC<ModernCartLayoutProps> = ({
  cartItems,
  onRemove,
  onClear,
  onChangeDuration,
  onProceedToCheckout,
  isCheckoutLoading = false
}) => {
  const isEmpty = cartItems.length === 0;

  if (isEmpty) {
    return <ModernEmptyCart />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <ModernCartHeader 
        itemCount={cartItems.length}
        onClear={onClear}
      />
      
      {/* Items List - espaçamento mais compacto */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 py-3">
          <AnimatePresence mode="popLayout">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  y: -8, 
                  scale: 0.98,
                  transition: { duration: 0.15 }
                }}
                transition={{ 
                  duration: 0.25,
                  delay: index * 0.03
                }}
                layout
              >
                <ModernCartItem
                  item={item}
                  onRemove={onRemove}
                  onChangeDuration={onChangeDuration}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
      
      {/* Summary and Checkout */}
      <ModernCartSummary
        cartItems={cartItems}
        onProceedToCheckout={onProceedToCheckout}
        isCheckoutLoading={isCheckoutLoading}
      />
    </div>
  );
};

export default ModernCartLayout;
