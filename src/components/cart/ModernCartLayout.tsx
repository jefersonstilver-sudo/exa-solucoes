
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import ModernCartItem from './ModernCartItem';
import ModernEmptyCart from './ModernEmptyCart';
import ModernCartSummary from './ModernCartSummary';

interface ModernCartLayoutProps {
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onChangeDuration: (id: string, duration: number) => void;
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
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    console.log("🛒 [ModernCartLayout] Iniciando checkout:", {
      cartItemsCount: cartItems.length,
      totalPrice,
      isLoading: isCheckoutLoading
    });
    
    if (cartItems.length === 0) {
      console.warn("🛒 [ModernCartLayout] Tentativa de checkout com carrinho vazio");
      return;
    }
    
    if (isCheckoutLoading) {
      console.warn("🛒 [ModernCartLayout] Checkout já em andamento");
      return;
    }
    
    onProceedToCheckout();
  };

  if (cartItems.length === 0) {
    return <ModernEmptyCart />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md mx-auto">
      {/* Cart Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-[#3C1361]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Seu Carrinho ({cartItems.length})
            </h2>
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
              disabled={isCheckoutLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ModernCartItem
                item={item}
                onRemove={onRemove}
                onChangeDuration={onChangeDuration}
                isDisabled={isCheckoutLoading}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cart Summary */}
      <div className="p-6 border-t border-gray-200">
        <ModernCartSummary 
          cartItems={cartItems}
          totalPrice={totalPrice}
          onProceedToCheckout={handleCheckout}
          isCheckoutLoading={isCheckoutLoading}
        />
      </div>
    </div>
  );
};

export default ModernCartLayout;
