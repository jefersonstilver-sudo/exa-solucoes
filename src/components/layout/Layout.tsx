
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  console.log('🏗️ Layout: Renderizando Layout com sistema GLOBAL');
  
  const { 
    cartItems, 
    isOpen, 
    toggleCart, 
    isAnimating,
    removeFromCart,
    clearCart,
    updateDuration,
    proceedToCheckout,
    itemCount
  } = useCart();

  console.log('🏗️ Layout: Cart state GLOBAL:', {
    itemCount,
    isAnimating,
    isOpen,
    cartItemsLength: cartItems.length
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 mobile-scroll-fix">
      <Header 
        cartItemsCount={itemCount}
        cartAnimation={isAnimating}
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
};

export default Layout;
