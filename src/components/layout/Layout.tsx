
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
    cartItemsCount, 
    isCartOpen, 
    toggleCart, 
    cartAnimation 
  } = useCartManager();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        cartItemsCount={cartItemsCount}
        cartAnimation={cartAnimation}
        onToggleCart={toggleCart}
      />
      
      <main className={`flex-1 relative ${className}`}>
        {children}
      </main>
      
      <MobileOptimizedFooter />
    </div>
  );
};

export default Layout;
