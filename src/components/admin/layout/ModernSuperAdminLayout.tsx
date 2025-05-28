
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#3C1361] to-[#2A0D47]">
        <ModernAdminSidebar />
        <SidebarInset>
          <ModernAdminHeader />
          <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <footer className="border-t bg-gradient-to-r from-[#3C1361] to-[#2A0D47] p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-purple-200">
              <div className="flex items-center space-x-4">
                <span>© 2024 INDEXA MEDIA</span>
                <span>•</span>
                <span>Painel Administrativo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-[#00FFAB] rounded flex items-center justify-center">
                  <span className="text-[#3C1361] font-bold text-xs">I</span>
                </div>
                <span className="text-white font-medium">v3.0</span>
              </div>
            </div>
          </footer>
        </SidebarInset>

        {/* Cart Drawer - mantido para compatibilidade */}
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
