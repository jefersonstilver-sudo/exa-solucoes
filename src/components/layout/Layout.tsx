
import React, { ReactNode, memo } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCart } from '@/contexts/SimpleCartContext';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = memo(({ children, className = '' }) => {
  const { 
    cartItems, 
    isOpen, 
    toggleCart, 
    removeFromCart,
    clearCart,
    updateDuration,
    proceedToCheckout,
    itemCount
  } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 mobile-scroll-fix">
      <Header 
        cartItemsCount={itemCount}
        cartAnimation={false}
        onToggleCart={toggleCart}
      />
      
      <main className={`flex-1 relative mobile-scroll-fix ${className}`}>
        {children}
      </main>
      
      <CartDrawer
        cartItems={cartItems}
        isOpen={isOpen}
        onClose={toggleCart}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onChangeDuration={updateDuration}
        onProceedToCheckout={proceedToCheckout}
      />
      
      <MobileOptimizedFooter />
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
