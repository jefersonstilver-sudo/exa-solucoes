
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartButton from './CartButton';
import UserButton from './UserButton';
import HeaderMenu from './HeaderMenu';

interface MobileHeaderProps {
  cartItems: {panel: any, duration: number}[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onChangeDuration: (id: string, duration: number) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  cartItems,
  onRemoveFromCart,
  onClearCart,
  onChangeDuration,
  isMenuOpen,
  setIsMenuOpen,
  isMobileCartOpen,
  setIsMobileCartOpen
}) => {
  // Handle menu toggle
  const handleMenuOpen = () => {
    const newMenuState = !isMenuOpen;
    console.log("Toggle menu:", newMenuState);
    setIsMenuOpen(newMenuState);
    
    // Close cart when menu is opened
    if (newMenuState) {
      setIsMobileCartOpen(false);
    }
  };

  return (
    <>
      <div className="md:hidden flex items-center gap-3">
        <UserButton isMobile={true} />
        
        <CartButton
          cartItems={cartItems}
          onRemoveFromCart={onRemoveFromCart}
          onClearCart={onClearCart}
          onChangeDuration={onChangeDuration}
          isDesktopCartOpen={false}
          setIsDesktopCartOpen={() => {}}
          isMobile={true}
          isMobileCartOpen={isMobileCartOpen}
          setIsMobileCartOpen={setIsMobileCartOpen}
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleMenuOpen} 
          className="text-white hover:bg-white/20"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile menu with conditional rendering */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-indexa-purple-dark/95 shadow-lg z-50 md:hidden">
          <HeaderMenu isMobile={true} onLinkClick={() => setIsMenuOpen(false)} />
        </div>
      )}
    </>
  );
};

export default MobileHeader;
