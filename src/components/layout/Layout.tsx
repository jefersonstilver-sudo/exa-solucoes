
import React from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartManager } from '@/hooks/useCartManager';
import { Panel } from '@/types/panel';

interface LayoutProps {
  children: React.ReactNode;
  useGradientBackground?: boolean;
  cartItems?: Array<{panel: Panel, duration: number}>;
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  useGradientBackground = false,
  cartItems = [],
  onRemoveFromCart,
  onClearCart,
  onChangeDuration,
  onProceedToCheckout
}) => {
  // Get cart state from useCartManager
  const { cartOpen, setCartOpen } = useCartManager();

  // Use cart items from props if provided, otherwise fall back to cartManager
  const { cartItems: managerCartItems } = useCartManager();
  const effectiveCartItems = cartItems.length > 0 ? cartItems : managerCartItems;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main 
        className={`flex-1 ${
          useGradientBackground 
            ? 'bg-gradient-to-br from-gray-50 via-white to-purple-50' 
            : 'bg-white'
        }`}
      >
        {children}
      </main>
      <MobileOptimizedFooter />
      
      {/* Cart Drawer */}
      <CartDrawer
        cartItems={effectiveCartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onChangeDuration={onChangeDuration}
        onProceedToCheckout={onProceedToCheckout}
      />
    </div>
  );
};

export default Layout;
