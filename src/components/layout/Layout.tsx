
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartManager } from '@/hooks/useCartManager';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  console.log('🏗️ [LAYOUT] Renderizando Layout com sistema de carrinho unificado');
  
  const { 
    cartItems, 
    cartOpen, 
    toggleCart, 
    cartAnimation,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  } = useCartManager();

  // Calculate cart items count from cartItems array
  const cartItemsCount = cartItems.length;

  console.log('🏗️ [LAYOUT] Estado do carrinho unificado:', {
    cartItemsCount,
    cartAnimation,
    cartOpen,
    cartItems: cartItems.map(item => ({ 
      id: item.id, 
      panelId: item.panel.id, 
      buildingName: item.panel.buildings?.nome 
    }))
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
      
      {/* Cart Drawer - Sistema unificado */}
      <CartDrawer
        cartItems={cartItems}
        isOpen={cartOpen}
        onClose={() => toggleCart()}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onChangeDuration={handleChangeDuration}
        onProceedToCheckout={handleProceedToCheckout}
      />
      
      <MobileOptimizedFooter />
    </div>
  );
};

export default Layout;
