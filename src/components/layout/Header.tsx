
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PanelCart from '@/components/panels/PanelCart';

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
        
        {/* Increased spacing between logo and navigation items */}
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
      
      <div className="hidden md:flex items-center gap-4">
        <Link to="/paineis-digitais/loja">
          <Button 
            variant="outline" 
            className="bg-indexa-mint text-indexa-purple-dark rounded-full border-none hover:bg-opacity-90 text-base font-medium"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Loja Online
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          {/* User icon first */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full"
          >
            <Avatar className="h-9 w-9 bg-indexa-purple-light border-2 border-indexa-mint">
              <AvatarFallback className="bg-indexa-purple-light text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
          
          {/* Shopping cart moved to the right of the user icon */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-white hover:bg-white/20 rounded-full"
              >
                <ShoppingBag className="h-6 w-6 text-indexa-mint" /> 
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] md:w-[450px] overflow-auto">
              <PanelCart 
                cartItems={cartItems} 
                onRemove={onRemoveFromCart} 
                onClear={onClearCart} 
                onChangeDuration={onChangeDuration} 
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Mobile menu button */}
      <div className="md:hidden flex items-center gap-3">
        {/* User icon first in mobile as well */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20 rounded-full"
        >
          <Avatar className="h-8 w-8 bg-indexa-purple-light border-2 border-indexa-mint">
            <AvatarFallback className="bg-indexa-purple-light text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
        
        {/* Shopping cart moved to the right of the user icon in mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-white/20 rounded-full"
            >
              <ShoppingBag className="h-6 w-6 text-indexa-mint" /> 
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] overflow-auto">
            <PanelCart 
              cartItems={cartItems} 
              onRemove={onRemoveFromCart} 
              onClear={onClearCart} 
              onChangeDuration={onChangeDuration} 
            />
          </SheetContent>
        </Sheet>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="text-white hover:bg-white/20"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Mobile menu */}
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
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
