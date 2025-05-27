
import React, { memo } from 'react';
import { CartItem } from '@/types/cart';
import Header from './Header';
import CartDrawer from '@/components/cart/CartDrawer';
import MobileOptimizedFooter from './MobileOptimizedFooter';
import { useCartManager } from '@/hooks/useCartManager';
import { setupPeriodicCleanup } from '@/services/realtimeCleanupService';

interface LayoutProps {
  children: React.ReactNode;
  cartItems?: CartItem[];
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
}

const Layout: React.FC<LayoutProps> = memo(({ 
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
  const onProceedToCheckout = externalOnProceedToCheckout || internalHandleProceedToCheckout;

  // Configurar limpeza automática na montagem do Layout
  React.useEffect(() => {
    const cancelCleanup = setupPeriodicCleanup();
    
    // Cleanup na desmontagem
    return cancelCleanup;
  }, []);

  const handleToggleCart = React.useCallback(() => {
    if (cartItems.length > 0) {
      toggleCart();
    }
  }, [cartItems.length, toggleCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header Fixed */}
      <Header 
        cartItemsCount={cartItems.length}
        cartAnimation={cartAnimation}
        onToggleCart={handleToggleCart}
      />
      
      {/* Main Content */}
      <main className="flex-1 w-full">
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
});

Layout.displayName = 'Layout';

export default Layout;
