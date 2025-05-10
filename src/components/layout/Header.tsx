
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, KeyRound } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-6 px-6 md:px-12 flex items-center justify-between bg-[#180024cc] backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-white text-lg font-semibold hover:text-white/90 transition-colors">Produtora</Link>
        <Link to="/" className="text-white text-lg font-semibold hover:text-white/90 transition-colors">Marketing</Link>
      </div>
      
      <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
        <div className="relative p-4 transition-all duration-300">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0NjkwNDYyMSwiZXhwIjoxOTA0NTg0NjIxfQ.GhdBh5KsL81Lijtsj7neVCyZfgMd-ExXWOZoTTwJ_Cg" 
            alt="Indexa Logo" 
            className="h-20 w-auto object-contain transition-transform duration-200 hover:scale-105 filter drop-shadow-md"
          />
        </div>
      </Link>
      
      <div className="flex items-center space-x-4">
        <Link to="/paineis-digitais" className="text-white text-lg font-semibold hover:text-white/90 transition-colors">
          Painéis Digitais
        </Link>
        
        <Button 
          variant="outline" 
          className="bg-indexa-mint text-indexa-purple-dark rounded-full border-none hover:bg-opacity-90 text-base font-medium"
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Loja Online
        </Button>
        
        <Button className="bg-transparent border border-white text-white rounded-full hover:bg-white hover:bg-opacity-10 text-base font-medium">
          <KeyRound className="mr-2 h-5 w-5" />
          Acesso
        </Button>
      </div>
    </header>
  );
};

export default Header;
