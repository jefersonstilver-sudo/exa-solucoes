
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import PanelCart from '@/components/panels/PanelCart';

interface CartButtonProps {
  cartItems: {panel: any, duration: number}[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onChangeDuration: (id: string, duration: number) => void;
  isDesktopCartOpen: boolean;
  setIsDesktopCartOpen: (open: boolean) => void;
  isMobile?: boolean;
  isMobileCartOpen?: boolean;
  setIsMobileCartOpen?: (open: boolean) => void;
}

const CartButton: React.FC<CartButtonProps> = ({ 
  cartItems, 
  onRemoveFromCart, 
  onClearCart, 
  onChangeDuration,
  isDesktopCartOpen, 
  setIsDesktopCartOpen,
  isMobile = false,
  isMobileCartOpen,
  setIsMobileCartOpen
}) => {
  // Determina qual estado de cart e setter usar com base em isMobile
  const isCartOpen = isMobile ? isMobileCartOpen : isDesktopCartOpen;
  const setIsCartOpen = isMobile ? setIsMobileCartOpen! : setIsDesktopCartOpen;
  
  // Função para lidar com a abertura do carrinho
  const handleCartOpen = (open: boolean) => {
    console.log(`Toggle ${isMobile ? 'mobile' : 'desktop'} cart:`, open);
    setIsCartOpen(open);
  };

  return (
    <>
      {cartItems.length > 0 ? (
        <Sheet open={isCartOpen} onOpenChange={handleCartOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-white/20 rounded-full"
            >
              <ShoppingBag className="h-6 w-6 text-indexa-mint" /> 
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </Button>
          </SheetTrigger>
          {isCartOpen && (
            <SheetContent side="right" className={`${isMobile ? 'w-[85%]' : 'w-[350px] md:w-[450px]'} overflow-auto`}>
              <PanelCart 
                cartItems={cartItems} 
                onRemove={onRemoveFromCart} 
                onClear={onClearCart} 
                onChangeDuration={onChangeDuration} 
              />
            </SheetContent>
          )}
        </Sheet>
      ) : (
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-white hover:bg-white/20 rounded-full"
        >
          <ShoppingBag className="h-6 w-6 text-indexa-mint" />
        </Button>
      )}
    </>
  );
};

export default CartButton;
