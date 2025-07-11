
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CartButton from './header/CartButton';
import HeaderLogo from './header/HeaderLogo';
import UserMenu from '@/components/user/UserMenu';
import MobileMenu from './header/MobileMenu';
import MobileMenuButton from './header/MobileMenuButton';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  console.log('🏢 Header: Renderizando header');
  console.log('🏢 Header: cartItemsCount:', cartItemsCount);
  console.log('🏢 Header: onToggleCart function:', !!onToggleCart);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#3C1361] to-[#2A0D47] shadow-lg">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo com mais espaço */}
          <div className="flex-shrink-0">
            <HeaderLogo />
          </div>

          {/* Navigation - Desktop Only */}
          <nav className="hidden lg:flex items-center space-x-10">
            <Link 
              to="/" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/linkae" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              LINKAÊ
            </Link>
            <Link 
              to="/produtora" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Produtora
            </Link>
            <Link 
              to="/exa" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              EXA
            </Link>
            <Link 
              to="/sou-sindico" 
              className="text-white hover:text-[#00FFAB] transition-colors font-medium"
            >
              Sou Síndico
            </Link>
          </nav>

          {/* Right side - Cart and User actions */}
          <div className="flex items-center space-x-3 lg:space-x-5">
            {/* Mobile Menu Button - Only on Mobile */}
            <div className="lg:hidden">
              <MobileMenuButton 
                isMenuOpen={isMobileMenuOpen}
                onToggle={toggleMobileMenu}
              />
            </div>

            {/* Loja Online Button */}
            <Link to="/loja">
              <Button 
                variant="outline" 
                className="bg-[#00FFAB] text-[#3C1361] border-[#00FFAB] hover:bg-[#00FFAB]/90 font-semibold px-3 lg:px-5 text-sm lg:text-base"
              >
                <span className="hidden sm:inline">Loja Online</span>
                <span className="sm:hidden">Loja</span>
              </Button>
            </Link>

            {/* Cart Button */}
            <CartButton 
              cartItemsCount={cartItemsCount}
              isAnimating={cartAnimation}
              onToggleCart={onToggleCart}
            />

            {/* User Menu - Agora visível em todas as telas */}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </header>
  );
};

export default Header;
