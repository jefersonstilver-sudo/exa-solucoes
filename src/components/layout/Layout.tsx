
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCart } from '@/contexts/SimpleCartContext';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
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

  console.log('🏗️ [Layout] Renderizando layout');

  return (
    <div className="min-h-screen flex flex-col bg-white mobile-scroll-fix">
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
};

export default Layout;
