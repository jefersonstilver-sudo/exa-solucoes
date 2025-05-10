
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-white font-medium hover:text-white/90 transition-colors">Produtora</Link>
        <Link to="/" className="text-white font-medium hover:text-white/90 transition-colors">Marketing</Link>
      </div>
      
      <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
        <img 
          src="/lovable-uploads/81812668-ec84-48ea-9ba5-f3f31b273fb2.png" 
          alt="Indexa Logo" 
          className="h-10"
        />
      </Link>
      
      <div className="flex items-center space-x-4">
        <Link to="/paineis-digitais" className="text-white font-medium hover:text-white/90 transition-colors">
          Painéis Digitais
        </Link>
        
        <Button 
          variant="outline" 
          className="bg-indexa-mint text-indexa-purple-dark border-none hover:bg-opacity-90 font-medium"
        >
          Loja Online
        </Button>
        
        <Button className="bg-transparent border border-white text-white hover:bg-white hover:bg-opacity-20 font-medium">
          Acesso
        </Button>
      </div>
    </header>
  );
};

export default Header;
