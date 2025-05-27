
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { 
  User, 
  Settings, 
  Key, 
  ShoppingBag, 
  LogOut,
  ChevronDown 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const UserDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { success } = await logout();
      if (success) {
        toast.success('Logout realizado com sucesso');
        navigate('/');
      } else {
        toast.error('Erro ao fazer logout');
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (!user) return null;

  const userName = user.nome || user.name || user.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#3C1361] text-white text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium">
            {userName}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/editar-perfil')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Editar Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/alterar-senha')}
        >
          <Key className="mr-2 h-4 w-4" />
          <span>Alterar Senha</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/configuracoes')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/meus-pedidos')}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>Meus Pedidos</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
