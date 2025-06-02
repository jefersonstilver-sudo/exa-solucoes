
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import { useCartManager } from '@/hooks/useCartManager';
import '@/styles/components.css'; // Importar CSS para prevenir footer duplicado

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  console.log('🏗️ Layout: Renderizando Layout com footer ÚNICO');
  
  const { 
    cartItems, 
    cartOpen, 
    toggleCart, 
    cartAnimation 
  } = useCartManager();

  // Calculate cart items count from cartItems array
  const cartItemsCount = cartItems.length;

  console.log('🏗️ Layout: Cart state:', {
    cartItemsCount,
    cartAnimation,
    cartOpen
  });

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
      
      {/* ÚNICO FOOTER DA APLICAÇÃO */}
      <MobileOptimizedFooter />
    </div>
  );
};

export default Layout;
