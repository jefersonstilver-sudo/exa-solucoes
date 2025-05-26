
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import CartButton from './header/CartButton';
import HeaderLogo from './header/HeaderLogo';

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
  const { user, isLoggedIn } = useUserSession();

  console.log('🏢 Header: Renderizando header');
  console.log('🏢 Header: cartItemsCount:', cartItemsCount);
  console.log('🏢 Header: onToggleCart function:', !!onToggleCart);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#3C1361] to-[#2A0D47] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <HeaderLogo />

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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

          {/* Right side - Cart and User actions */}
          <div className="flex items-center space-x-4">
            {/* Loja Online Button */}
            <Link to="/paineis-digitais/loja">
              <Button 
                variant="outline" 
                className="bg-[#00FFAB] text-[#3C1361] border-[#00FFAB] hover:bg-[#00FFAB]/90 font-semibold"
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

            {/* User Profile/Login */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-[#00FFAB] rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-[#3C1361]" />
                </div>
                <span className="text-white text-sm font-medium">
                  {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                </span>
              </div>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-[#00FFAB] hover:bg-white/10"
                >
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
