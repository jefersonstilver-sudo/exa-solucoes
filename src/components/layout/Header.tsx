
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import UserMenu from '@/components/user/UserMenu';
import HeaderLogo from './header/HeaderLogo';
import DesktopNavigation from './header/DesktopNavigation';
import CartButton from './header/CartButton';
import MobileMenuButton from './header/MobileMenuButton';
import MobileMenu from './header/MobileMenu';
import OnlineStoreButton from './header/OnlineStoreButton';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { cartItems, toggleCart } = useCartManager();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const totalCartItems = cartItems.length;

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/planos", label: "Planos" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" }
  ];

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-indexa-purple to-indexa-purple/95 text-white shadow-xl relative z-40">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <HeaderLogo />

            {/* Desktop Navigation */}
            <DesktopNavigation navItems={navItems} />

            {/* Right Side - Loja Online + User + Cart + Mobile Menu */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Online Store Button */}
              <OnlineStoreButton />

              {/* User Menu */}
              <UserMenu />

              {/* Cart Button - NOW WITH TOGGLE FUNCTION */}
              <CartButton 
                cartItemsCount={totalCartItems} 
                onToggleCart={toggleCart}
              />

              {/* Mobile Menu Button */}
              <MobileMenuButton 
                isMenuOpen={isMenuOpen} 
                onToggle={toggleMobileMenu} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={closeMobileMenu} 
        navItems={navItems} 
      />
    </>
  );
};

export default Header;
