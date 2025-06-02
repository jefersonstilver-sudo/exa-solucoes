
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CartItem } from '@/types/cart';
import PanelCart from '@/components/panels/PanelCart';

interface CartDrawerProps {
  cartItems: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onChangeDuration: (id: string, duration: number) => void;
  onProceedToCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  cartItems,
  isOpen,
  onClose,
  onRemoveFromCart,
  onClearCart,
  onChangeDuration,
  onProceedToCheckout
}) => {
  console.log('🛒 [CART DRAWER] Renderizando drawer:', {
    isOpen,
    cartItemsCount: cartItems.length,
    items: cartItems.map(item => ({ id: item.id, panelId: item.panel.id, name: item.panel.buildings?.nome }))
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold text-gray-900">
                  Carrinho ({cartItems.length})
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-auto">
                <PanelCart
                  cartItems={cartItems}
                  onRemove={onRemoveFromCart}
                  onClear={onClearCart}
                  onChangeDuration={onChangeDuration}
                  onProceedToCheckout={onProceedToCheckout}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
