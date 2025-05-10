
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-white font-medium">Produtora</Link>
        <Link to="/" className="text-white font-medium">Marketing</Link>
      </div>
      
      <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
        <img 
          src="/lovable-uploads/0b464c46-e1d7-4cde-8f2e-ffded8c109a1.png" 
          alt="Indexa Logo" 
          className="h-10"
          style={{ filter: 'brightness(0) invert(1)' }} // Torna o logo branco se necessário
        />
      </Link>
      
      <div className="flex items-center space-x-4">
        <Link to="/paineis-digitais" className="text-white font-medium">
          Painéis Digitais
        </Link>
        
        <Button 
          variant="outline" 
          className="bg-indexa-mint text-indexa-purple-dark border-none hover:bg-opacity-90"
        >
          Loja Online
        </Button>
        
        <Button className="bg-transparent border border-white text-white hover:bg-white hover:bg-opacity-20">
          Acesso
        </Button>
      </div>
    </header>
  );
};

export default Header;
