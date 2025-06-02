
import React, { ReactNode } from 'react';
import Header from './Header';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartManager } from '@/hooks/useCartManager';
import '@/styles/components.css'; // Importar CSS para prevenir footer duplicado

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  console.log('🏗️ Layout: Renderizando Layout com footer ÚNICO e CartDrawer');
  
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

  console.log('🏗️ Layout: Cart state:', {
    cartItemsCount,
    cartAnimation,
    cartOpen,
    cartItems: cartItems.map(item => ({ id: item.id, panelId: item.panel.id }))
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
      
      {/* Cart Drawer - NOVO COMPONENTE ADICIONADO */}
      <CartDrawer
        cartItems={cartItems}
        isOpen={cartOpen}
        onClose={() => toggleCart()}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onChangeDuration={handleChangeDuration}
        onProceedToCheckout={handleProceedToCheckout}
      />
      
      {/* ÚNICO FOOTER DA APLICAÇÃO */}
      <MobileOptimizedFooter />
    </div>
  );
};

export default Layout;
