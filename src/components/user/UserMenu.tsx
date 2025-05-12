
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, FileText, Target, Settings, 
  Lock, LogOut, LogIn, UserPlus 
} from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClientOnly } from '@/components/ui/client-only';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const UserMenu: React.FC = () => {
  const { user, isLoggedIn, logout } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Fechar o menu ao pressionar Esc
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    toast.success('Logout realizado com sucesso');
  };

  const menuAnimation = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
  };

  return (
    <ClientOnly>
      <div className="relative" ref={menuRef}>
        <motion.button 
          onClick={toggleMenu}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="focus:outline-none"
        >
          <Avatar 
            className={`h-9 w-9 bg-indexa-purple-light transition-all duration-300
              ${isLoggedIn 
                ? 'border-2 border-indexa-mint shadow-[0_0_10px_rgba(0,255,171,0.5)]' 
                : 'border-2 border-gray-500/50'}`}
          >
            {user?.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name || user.email || "User"} />
            ) : null}
            <AvatarFallback className="bg-indexa-purple-light text-white">
              {user?.name?.[0] || user?.email?.[0] || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              variants={menuAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-xl shadow-xl p-4 z-50"
            >
              {isLoggedIn ? (
                <>
                  <div className="border-b border-gray-100 pb-3 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10 bg-indexa-purple-dark">
                        {user?.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.name || user.email || "User"} />
                        ) : null}
                        <AvatarFallback>{user?.name?.[0] || user?.email?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm truncate max-w-[150px]">
                          {user?.name || user?.email}
                        </p>
                        {user?.name && (
                          <p className="text-neutral-500 text-xs truncate max-w-[150px]">
                            {user?.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 py-1">
                    <Link 
                      to="/pedidos" 
                      className="flex items-center gap-2 w-full text-sm p-2 text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      Meus Pedidos
                    </Link>
                    
                    <Link 
                      to="/campanhas" 
                      className="flex items-center gap-2 w-full text-sm p-2 text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Target className="h-4 w-4" />
                      Minhas Campanhas
                    </Link>
                    
                    <Link 
                      to="/configuracoes" 
                      className="flex items-center gap-2 w-full text-sm p-2 text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Configurações da Conta
                    </Link>
                    
                    <Link 
                      to="/alterar-senha" 
                      className="flex items-center gap-2 w-full text-sm p-2 text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Lock className="h-4 w-4" />
                      Alterar Senha
                    </Link>
                    
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-sm p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-gray-100 pb-3 mb-2">
                    <p className="text-sm text-neutral-900">👋 Bem-vindo! Faça login para continuar.</p>
                  </div>
                  
                  <div className="space-y-2 py-2">
                    <Link 
                      to="/login" 
                      className="flex items-center justify-center gap-2 w-full p-2 bg-indexa-purple text-white rounded-md hover:bg-indexa-purple-dark transition-colors text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </Link>
                    
                    <Link 
                      to="/cadastro" 
                      className="flex items-center justify-center gap-2 w-full p-2 border border-indexa-purple text-indexa-purple rounded-md hover:bg-indexa-purple/5 transition-colors text-sm font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastrar-se
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClientOnly>
  );
};

export default UserMenu;
