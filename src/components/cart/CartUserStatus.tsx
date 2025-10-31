
import React from 'react';
import { User, LogIn, Check, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClientOnly } from '@/components/ui/client-only';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CartUserStatusProps {
  isLoggedIn: boolean;
  user: { name?: string; email?: string } | null;
}

const CartUserStatus: React.FC<CartUserStatusProps> = ({ isLoggedIn, user }) => {
  const navigate = useNavigate();
  
  const getFirstName = () => {
    if (!user || !user.name) return '';
    return user.name.split(' ')[0];
  };
  
  const handleLogout = () => {
    // Implement logout functionality here
    navigate('/login');
  };
  
  return (
    <ClientOnly>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-5 sm:px-6 mt-4"
      >
        {isLoggedIn && user ? (
          <div className="bg-gradient-to-r from-[#3C1361]/10 to-[#3C1361]/5 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 p-0 rounded-full bg-[#3C1361] hover:bg-[#3C1361]/80">
                    <User className="h-5 w-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => navigate('/meus-pedidos')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Meus pedidos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Olá, {getFirstName()}! <span className="ml-1">✨</span>
                </p>
                <p className="text-xs text-gray-500">
                  Finalizar como: {user.email}
                </p>
              </div>
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#00FFAB]/20 to-[#00FFAB]/10 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="bg-[#00FFAB]/30 rounded-full p-2">
                <LogIn className="h-4 w-4 text-[#9C1E1E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Entre para continuar com a compra
                </p>
                <p className="text-xs text-gray-500">
                  Acesse sua conta para finalizar
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#9C1E1E] hover:bg-[#00FFAB] hover:text-[#9C1E1E] text-white text-xs h-8 transition-colors font-medium"
                onClick={() => navigate('/login')}
              >
                Fazer Login
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </ClientOnly>
  );
};

export default CartUserStatus;
