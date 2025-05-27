
import React from 'react';
import { CartItem } from '@/types/cart';
import Header from './Header';
import CartDrawer from '@/components/cart/CartDrawer';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import { useCartManager } from '@/hooks/useCartManager';

interface LayoutProps {
  children: React.ReactNode;
  cartItems?: CartItem[];
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  cartItems: externalCartItems,
  onRemoveFromCart: externalOnRemoveFromCart,
  onClearCart: externalOnClearCart,
  onChangeDuration: externalOnChangeDuration,
  onProceedToCheckout: externalOnProceedToCheckout
}) => {
  // Use o hook interno do carrinho para gerenciar o estado
  const {
    cartItems: internalCartItems,
    cartOpen,
    setCartOpen,
    handleRemoveFromCart: internalHandleRemoveFromCart,
    handleClearCart: internalHandleClearCart,
    handleChangeDuration: internalHandleChangeDuration,
    handleProceedToCheckout: internalHandleProceedToCheckout,
    cartAnimation,
    toggleCart
  } = useCartManager();

  // Use props externas se fornecidas, senão use as internas
  const cartItems = externalCartItems || internalCartItems;
  const onRemoveFromCart = externalOnRemoveFromCart || internalHandleRemoveFromCart;
  const onClearCart = externalOnClearCart || internalHandleClearCart;
  const onChangeDuration = externalOnChangeDuration || internalHandleChangeDuration;
  // CORREÇÃO: Usar handleProceedToCheckout do useCartManager em vez de função vazia
  const onProceedToCheckout = externalOnProceedToCheckout || internalHandleProceedToCheckout;

  console.log('🏗️ Layout: Renderizando com carrinho');
  console.log('🏗️ Layout: cartItems.length:', cartItems.length);
  console.log('🏗️ Layout: cartOpen:', cartOpen);
  console.log('🏗️ Layout: toggleCart function:', !!toggleCart);

  const handleToggleCart = () => {
    console.log('🏗️ Layout: handleToggleCart chamado');
    console.log('🏗️ Layout: cartOpen atual:', cartOpen);
    console.log('🏗️ Layout: cartItems.length:', cartItems.length);
    
    if (cartItems.length > 0) {
      toggleCart();
    } else {
      console.log('🏗️ Layout: Carrinho vazio, não abrindo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        cartItemsCount={cartItems.length}
        cartAnimation={cartAnimation}
        onToggleCart={handleToggleCart}
      />
      
      <main className="pt-20 flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <MobileOptimizedFooter />
      
      {/* Cart Drawer */}
      <CartDrawer
        cartItems={cartItems}
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
