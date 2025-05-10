
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-6 px-6 md:px-12 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-white text-base hover:text-white/90 transition-colors">Produtora</Link>
        <Link to="/" className="text-white text-base hover:text-white/90 transition-colors">Marketing</Link>
      </div>
      
      <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
        <img 
          src="/lovable-uploads/262f3b00-af56-4493-b8f9-8214eb19bd6f.png" 
          alt="Indexa Logo" 
          className="h-12"
        />
      </Link>
      
      <div className="flex items-center space-x-4">
        <Link to="/paineis-digitais" className="text-white text-base hover:text-white/90 transition-colors">
          Painéis Digitais
        </Link>
        
        <Button 
          variant="outline" 
          className="bg-indexa-mint text-indexa-purple-dark rounded-full border-none hover:bg-opacity-90 text-sm font-normal"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Loja Online
        </Button>
        
        <Button className="bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-sm font-normal">
          <User className="mr-2 h-4 w-4" />
          Acesso
        </Button>
      </div>
    </header>
  );
};

export default Header;
