
import React, { ReactNode, memo } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartOptional } from '@/hooks/useCartOptional';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = memo(({ children, className = '' }) => {
  const cart = useCartOptional();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 mobile-scroll-fix">
      <Header 
        cartItemsCount={cart?.itemCount || 0}
        cartAnimation={false}
        onToggleCart={cart?.toggleCart || (() => {})}
      />
      
      <main className={`flex-1 relative mobile-scroll-fix pt-0 ${className}`}>
        {children}
      </main>
      
      {cart && (
        <CartDrawer
          cartItems={cart.cartItems}
          isOpen={cart.isOpen}
          onClose={cart.toggleCart}
          onRemoveFromCart={cart.removeFromCart}
          onClearCart={cart.clearCart}
          onChangeDuration={cart.updateDuration}
          onProceedToCheckout={cart.proceedToCheckout}
        />
      )}
      
      <MobileOptimizedFooter />
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
