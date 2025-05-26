
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/user/UserMenu';
import HeaderLogo from '@/components/layout/header/HeaderLogo';
import CartButton from '@/components/layout/header/CartButton';
import OnlineStoreButton from '@/components/layout/header/OnlineStoreButton';
import { useCartManager } from '@/hooks/useCartManager';

const ModernAdminHeader = () => {
  const { cartItems, cartAnimation, toggleCart } = useCartManager();

  return (
    <header className="border-b bg-gradient-to-r from-indexa-purple to-indexa-purple/95 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-white hover:bg-white/10 transition-colors duration-200" />
          <HeaderLogo />
        </div>
        
        <div className="flex items-center space-x-4">
          <OnlineStoreButton />
          <CartButton 
            cartItemsCount={cartItems.length}
            isAnimating={cartAnimation}
            onToggleCart={toggleCart}
          />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
