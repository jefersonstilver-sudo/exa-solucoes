
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import OnlineStoreButton from './OnlineStoreButton';
import CartButton from './CartButton';

const DesktopNavigation = () => {
  const { user } = useUserSession();

  return (
    <nav className="hidden md:flex items-center space-x-1">
      <OnlineStoreButton />
      
      <CartButton />
      
      {user ? (
        <div className="flex items-center space-x-2">
          <Button 
            asChild 
            variant="ghost" 
            className="text-white hover:text-[#00FFAB] hover:bg-white/10 transition-colors duration-300"
          >
            <Link to="/anunciante">Dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Button 
            asChild 
            variant="ghost" 
            className="text-white hover:text-[#00FFAB] hover:bg-white/10 transition-colors duration-300"
          >
            <Link to="/login">Entrar</Link>
          </Button>
          <Button 
            asChild 
            className="bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361] font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Link to="/register">Cadastrar</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default DesktopNavigation;
