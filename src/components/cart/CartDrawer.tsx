
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import PanelCart from '@/components/panels/PanelCart';
import EmptyCart from '@/components/cart/EmptyCart';

interface CartDrawerProps {
  cartItems: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
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
  console.log('🛒 CartDrawer: Renderizando');
  console.log('🛒 CartDrawer: isOpen:', isOpen);
  console.log('🛒 CartDrawer: cartItems.length:', cartItems.length);

  const handleClose = () => {
    console.log('🛒 CartDrawer: Fechando drawer');
    onClose();
  };

  // MUDANÇA CRÍTICA: Sempre mostrar quando isOpen for true, independente de ter itens
  const shouldShow = isOpen;
  const isEmpty = cartItems.length === 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300 
            }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEmpty ? 'Seu Carrinho' : `Seu Carrinho (${cartItems.length} ${cartItems.length === 1 ? 'item' : 'itens'})`}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 flex flex-col">
              {isEmpty ? (
                <EmptyCart />
              ) : (
                <PanelCart
                  cartItems={cartItems}
                  onRemove={onRemoveFromCart || (() => {})}
                  onClear={onClearCart || (() => {})}
                  onChangeDuration={onChangeDuration || (() => {})}
                  onProceedToCheckout={onProceedToCheckout || (() => {})}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
