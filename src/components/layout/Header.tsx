
import React from 'react';
import { motion } from 'framer-motion';
import HeaderLogo from './header/HeaderLogo';
import DesktopNavigation from './header/DesktopNavigation';
import MobileMenuButton from './header/MobileMenuButton';
import MobileMenu from './header/MobileMenu';

interface HeaderProps {
  cartItemsCount?: number;
  isAnimating?: boolean;
  onToggleCart?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartItemsCount = 0, 
  isAnimating = false, 
  onToggleCart 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#3C1361] via-[#4A1A73] to-[#3C1361] shadow-xl border-b border-white/10"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <HeaderLogo />
            
            {/* Desktop Navigation */}
            <DesktopNavigation />
            
            {/* Mobile Menu Button */}
            <MobileMenuButton 
              isOpen={isMobileMenuOpen}
              onToggle={toggleMobileMenu}
            />
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </>
  );
};

export default Header;
