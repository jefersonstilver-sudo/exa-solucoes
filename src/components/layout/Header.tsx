
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
        <div className="relative overflow-hidden rounded-full bg-white/5 backdrop-blur-sm p-2 transition-all duration-300 hover:bg-white/10">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0NjkwNDYyMSwiZXhwIjoxOTA0NTg0NjIxfQ.GhdBh5KsL81Lijtsj7neVCyZfgMd-ExXWOZoTTwJ_Cg" 
            alt="Indexa Logo" 
            className="h-16 object-contain transition-transform duration-200 hover:scale-105"
          />
        </div>
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
