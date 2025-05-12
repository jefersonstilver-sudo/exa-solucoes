
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogIn, LogOut, Settings, Package, Film, ShoppingBag, UserIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { ClientOnly } from '@/components/ui/client-only';
import { motion } from 'framer-motion';

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, isLoading, isLoggedIn, logout } = useUserSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  // Generate avatar initials from name or email
  const getInitials = () => {
    if (!user) return "?";
    
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "?";
  };

  return (
    <ClientOnly fallback={<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>}>
      {isLoading ? (
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`relative p-0 overflow-hidden ${isLoggedIn ? 'border-0' : 'border-0'}`} 
              aria-label="Menu do usuário"
            >
              <motion.div 
                className={`rounded-full ${isLoggedIn ? 'ring-[3px] ring-indexa-mint' : 'ring-[1px] ring-gray-300'}`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user?.avatar_url || ''} 
                    alt={user?.name || user?.email || "Usuário"}
                  />
                  <AvatarFallback 
                    className={`${isLoggedIn ? 'bg-indexa-purple text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {isLoggedIn ? getInitials() : <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {isLoggedIn ? (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/paineis-digitais/loja" className="flex items-center cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>Loja</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/meus-pedidos" className="flex items-center cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Meus Pedidos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/minhas-campanhas" className="flex items-center cursor-pointer">
                      <Film className="mr-2 h-4 w-4" />
                      <span>Minhas Campanhas</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm text-center">Faça login para continuar</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/login" className="flex items-center justify-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Entrar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/cadastro" className="flex items-center justify-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Criar Conta</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ClientOnly>
  );
};

export default UserMenu;
