
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import { useCartManager } from '@/hooks/useCartManager';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const { 
    cartItems, 
    cartOpen, 
    toggleCart, 
    cartAnimation 
  } = useCartManager();

  // Calculate cart items count from cartItems array
  const cartItemsCount = cartItems.length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 mobile-scroll-fix">
      <Header 
        cartItemsCount={cartItemsCount}
        cartAnimation={cartAnimation}
        onToggleCart={toggleCart}
      />
      
      <main className={`flex-1 relative mobile-scroll-fix ${className}`}>
        {children}
      </main>
      
      <MobileOptimizedFooter />
    </div>
  );
};

export default Layout;
