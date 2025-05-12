
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import CartButton from './header/CartButton';
import UserButton from './header/UserButton';
import HeaderMenu from './header/HeaderMenu';
import MobileHeader from './header/MobileHeader';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  cartItems?: {panel: any, duration: number}[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (id: string, duration: number) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartItems = [], 
  onRemoveFromCart = () => {}, 
  onClearCart = () => {}, 
  onChangeDuration = () => {} 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopCartOpen, setIsDesktopCartOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  return (
    <header className="w-full py-4 px-4 md:px-8 flex items-center justify-between bg-gradient-to-r from-indexa-purple-dark to-indexa-purple shadow-md border-b border-purple-800/30 relative">
      {/* Logo container com z-index extremamente alto para garantir visibilidade máxima */}
      <div className="flex items-center z-[250] relative">
        <Link to="/" className="block text-white text-lg font-semibold transition-colors">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0NjkwNDYyMSwiZXhwIjoxOTA0NTg0NjIxfQ.GhdBh5KsL81Lijtsj7neVCyZfgMd-ExXWOZoTTwJ_Cg" 
            alt="Indexa Logo" 
            className="h-14 w-auto object-contain" 
          />
        </Link>
        
        {/* Navegação Desktop */}
        <div className="ml-8 hidden md:block">
          <HeaderMenu />
        </div>
      </div>
      
      {/* Botões de carrinho e usuário no Desktop */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Link para Loja Online */}
          <Link to="/paineis-digitais/loja">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-indexa-mint hover:bg-white/20 rounded-full"
            >
              <Store className="h-5 w-5" />
            </Button>
          </Link>
          
          <UserButton />
          
          {/* Carrinho Desktop */}
          <CartButton
            cartItems={cartItems}
            onRemoveFromCart={onRemoveFromCart}
            onClearCart={onClearCart}
            onChangeDuration={onChangeDuration}
            isDesktopCartOpen={isDesktopCartOpen}
            setIsDesktopCartOpen={setIsDesktopCartOpen}
          />
        </div>
      </div>
      
      {/* Mobile menu e botões do carrinho - Agora completamente fora do fluxo do cabeçalho principal */}
      <MobileHeader 
        cartItems={cartItems}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onChangeDuration={onChangeDuration}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isMobileCartOpen={isMobileCartOpen}
        setIsMobileCartOpen={setIsMobileCartOpen}
      />
    </header>
  );
};

export default Header;
