
import React from 'react';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClientOnly } from '@/components/ui/client-only';

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
  
  return (
    <ClientOnly>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        {isLoggedIn && user ? (
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Olá, {getFirstName()}! 🎉
                </p>
                <p className="text-xs text-gray-500">
                  Finalizar como: {user.email}
                </p>
              </div>
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <LogIn className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  Faça login para continuar sua compra
                </p>
                <p className="text-xs text-gray-500">
                  Entre para finalizar a compra
                </p>
              </div>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                onClick={() => navigate('/login')}
              >
                Entrar ou Cadastrar
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </ClientOnly>
  );
};

export default CartUserStatus;
