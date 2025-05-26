
import React from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartManager } from '@/hooks/useCartManager';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { getPanelPrice } from '@/utils/checkoutUtils';

interface LayoutProps {
  children: React.ReactNode;
  useGradientBackground?: boolean;
  cartItems?: Array<{panel: Panel, duration: number}>;
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
}

// Utility function to convert legacy cart item to full cart item
const convertLegacyToCartItem = (legacyItem: { panel: Panel; duration: number }): CartItem => {
  return {
    id: `cart_${legacyItem.panel.id}_${Date.now()}`,
    panel: legacyItem.panel,
    duration: legacyItem.duration,
    addedAt: Date.now(),
    price: getPanelPrice(legacyItem.panel, legacyItem.duration)
  };
};

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
  const { cartOpen, setCartOpen, cartItems: managerCartItems } = useCartManager();

  // Convert legacy cart items to proper CartItem format and choose the right source
  const effectiveCartItems: CartItem[] = cartItems.length > 0 
    ? cartItems.map(convertLegacyToCartItem)
    : managerCartItems;

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
