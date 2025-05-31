
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CartButton from './header/CartButton';
import UserMenu from '@/components/user/UserMenu';
import ThemeToggle from '@/components/ui/theme-toggle';

interface HeaderProps {
  cartItemsCount?: number;
  cartAnimation?: boolean;
  onToggleCart?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartItemsCount = 0, 
  cartAnimation = false,
  onToggleCart
}) => {
  console.log('🏢 Header: Renderizando header');
  console.log('🏢 Header: cartItemsCount:', cartItemsCount);
  console.log('🏢 Header: onToggleCart function:', !!onToggleCart);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#3C1361] to-[#2A0D47] dark:from-gray-900 dark:to-gray-800 shadow-lg">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo da Indexa - mantido apenas o essencial */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">Indexa</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <Link 
              to="/" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/planos" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Planos
            </Link>
            <Link 
              to="/sobre" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Sobre
            </Link>
            <Link 
              to="/contato" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Contato
            </Link>
          </nav>

          {/* Right side - Theme Toggle, Cart and User actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button - NOVO */}
            <ThemeToggle />

            {/* Loja Online Button */}
            <Link to="/paineis-digitais/loja">
              <Button 
                variant="outline" 
                className="bg-[#00FFAB] text-[#3C1361] border-[#00FFAB] hover:bg-[#00FFAB]/90 font-semibold px-5"
              >
                Loja Online
              </Button>
            </Link>

            {/* Cart Button */}
            <CartButton 
              cartItemsCount={cartItemsCount}
              isAnimating={cartAnimation}
              onToggleCart={onToggleCart}
            />

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
