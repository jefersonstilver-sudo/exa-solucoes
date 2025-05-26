
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ModernAdminSidebar from './ModernAdminSidebar';
import ModernAdminHeader from './ModernAdminHeader';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCartManager } from '@/hooks/useCartManager';

interface ModernSuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ModernSuperAdminLayout = ({ children }: ModernSuperAdminLayoutProps) => {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  } = useCartManager();

  const handleCloseCart = () => {
    setCartOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ModernAdminSidebar />
        <SidebarInset>
          <ModernAdminHeader />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <footer className="border-t bg-background p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>© 2024 INDEXA MEDIA</span>
                <span>•</span>
                <span>Painel Administrativo</span>
              </div>
              <div>
                v3.0
              </div>
            </div>
          </footer>
        </SidebarInset>

        {/* Cart Drawer */}
        <CartDrawer
          cartItems={cartItems}
          isOpen={cartOpen}
          onClose={handleCloseCart}
          onRemoveFromCart={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onChangeDuration={handleChangeDuration}
          onProceedToCheckout={handleProceedToCheckout}
        />
      </div>
    </SidebarProvider>
  );
};

export default ModernSuperAdminLayout;
