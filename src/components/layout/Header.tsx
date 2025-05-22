
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import PanelCart from '@/components/panels/PanelCart';
import UserMenu from '@/components/user/UserMenu';
import AdminAccessButton from '@/components/admin/AdminAccessButton';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  cartItems?: {panel: any, duration: number}[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (id: string, duration: number) => void;
  onProceedToCheckout?: () => void;
  cartItemCount?: number;
  setDrawerOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ 
  cartItems = [], 
  onRemoveFromCart = () => {}, 
  onClearCart = () => {}, 
  onChangeDuration = () => {},
  onProceedToCheckout = () => {},
  cartItemCount,
  setDrawerOpen
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);

  // Add animation when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      setCartAnimating(true);
      const timer = setTimeout(() => setCartAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);
  
  // Handle menu toggle
  const handleMenuOpen = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    // Close cart when menu is opened
    if (newMenuState) {
      setIsCartOpen(false);
      if (setDrawerOpen) setDrawerOpen(false);
    }
  };

  // Handle cart open/close
  const handleCartOpen = (open: boolean) => {
    setIsCartOpen(open);
    
    // Sync with parent drawer state if provided
    if (setDrawerOpen) setDrawerOpen(open);
    
    // Close menu when cart is opened
    if (open) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="w-full py-4 px-4 md:px-8 flex items-center justify-between bg-gradient-to-r from-indexa-purple-dark to-indexa-purple shadow-md border-b border-purple-800/30">
      <div className="flex items-center">
        <Link to="/" className="text-white text-lg font-semibold transition-colors">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0NjkwNDYyMSwiZXhwIjoxOTA0NTg0NjIxfQ.GhdBh5KsL81Lijtsj7neVCyZfgMd-ExXWOZoTTwJ_Cg" 
            alt="Indexa Logo" 
            className="h-14 w-auto object-contain" 
          />
        </Link>
        
        <div className="hidden md:flex gap-6 ml-12">
          <Link to="/" className="text-white/90 font-medium hover:text-white transition-colors">
            Produtora
          </Link>
          <Link to="/" className="text-white/90 font-medium hover:text-white transition-colors">
            Marketing
          </Link>
          <Link to="/paineis-digitais" className="text-white/90 font-medium hover:text-white transition-colors">
            Painéis Digitais
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Link to="/paineis-digitais/loja" className="hidden md:block">
          <Button 
            variant="outline" 
            className="bg-indexa-mint text-indexa-purple-dark rounded-full border-none hover:bg-opacity-90 text-base font-medium"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Loja Online
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          {/* Admin Access Button */}
          <AdminAccessButton variant="icon" className="hidden sm:flex" />
          
          {/* User profile menu */}
          <UserMenu />
          
          {/* Shopping cart drawer */}
          <Drawer open={isCartOpen} onOpenChange={handleCartOpen}>
            <DrawerTrigger asChild>
              <motion.div
                animate={cartAnimating ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0],
                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                } : {}}
                transition={{ duration: 0.6 }}
                aria-label={`Abrir carrinho com ${cartItemCount || cartItems.length} itens`}
                className="relative"
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-white hover:bg-white/20 rounded-full group"
                >
                  <ShoppingCart className="h-6 w-6 text-indexa-mint group-hover:text-[#00FFAB] transition-colors" /> 
                  <AnimatePresence>
                    {(cartItemCount || cartItems.length) > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {cartItemCount || cartItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </DrawerTrigger>
            <DrawerContent className="h-full">
              <PanelCart 
                cartItems={cartItems} 
                onRemove={onRemoveFromCart} 
                onClear={onClearCart} 
                onChangeDuration={onChangeDuration}
                onProceedToCheckout={onProceedToCheckout}
              />
              <DrawerClose className="sr-only">Close</DrawerClose>
            </DrawerContent>
          </Drawer>
        </div>
        
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleMenuOpen} 
          className="text-white hover:bg-white/20 md:hidden"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile menu with conditional rendering */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-indexa-purple-dark/95 shadow-lg z-50 md:hidden">
          <div className="flex flex-col p-4 gap-4">
            <Link to="/" className="text-white/90 font-medium p-2 hover:bg-white/10 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Produtora
            </Link>
            <Link to="/" className="text-white/90 font-medium p-2 hover:bg-white/10 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Marketing
            </Link>
            <Link to="/paineis-digitais" className="text-white/90 font-medium p-2 hover:bg-white/10 rounded-md" onClick={() => setIsMenuOpen(false)}>
              Painéis Digitais
            </Link>
            <Link to="/paineis-digitais/loja" className="text-white/90 font-medium p-2 hover:bg-white/10 rounded-md bg-indexa-mint/20" onClick={() => setIsMenuOpen(false)}>
              Loja Online
            </Link>
            {/* Admin access button for mobile */}
            <div className="p-2">
              <AdminAccessButton variant="subtle" className="w-full justify-start" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
