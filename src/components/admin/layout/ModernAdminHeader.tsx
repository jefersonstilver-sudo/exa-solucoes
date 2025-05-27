
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/user/UserMenu';
import CartButton from '@/components/layout/header/CartButton';
import OnlineStoreButton from '@/components/layout/header/OnlineStoreButton';
import { useCartManager } from '@/hooks/useCartManager';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ModernAdminHeader = () => {
  const { cartItems, cartAnimation, toggleCart } = useCartManager();

  return (
    <header className="bg-gradient-to-r from-indexa-purple via-indexa-purple-dark to-indexa-purple text-white shadow-2xl border-b border-indexa-mint/20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-white hover:bg-white/20 hover:text-indexa-mint transition-all duration-200 rounded-lg p-2" />
          
          {/* Indicador de status do sistema */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-indexa-mint">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Sistema Online</span>
            </div>
          </div>
        </div>
        
        {/* Área central com busca */}
        <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 max-w-md flex-1 mx-6">
          <Search className="h-4 w-4 text-indexa-mint mr-3" />
          <Input 
            type="search" 
            placeholder="Buscar em todo o sistema..." 
            className="bg-transparent border-none focus:outline-none text-sm text-white placeholder-white/60 flex-1"
          />
        </div>
        
        {/* Área direita */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-indexa-mint transition-all duration-200 rounded-lg relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
              <span className="text-white text-[10px]">3</span>
            </div>
          </Button>

          {/* Loja Online */}
          <OnlineStoreButton />

          {/* Carrinho */}
          <CartButton 
            cartItemsCount={cartItems.length}
            isAnimating={cartAnimation}
            onToggleCart={toggleCart}
          />

          {/* Divisor */}
          <div className="h-8 w-px bg-white/20"></div>

          {/* Menu do usuário */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
