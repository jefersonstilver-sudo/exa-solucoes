
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { 
  User, 
  LogOut, 
  Settings, 
  ShoppingBag, 
  BarChart3,
  Video,
  FileText,
  ChevronDown,
  LogIn,
  UserPlus
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const UserMenu: React.FC = () => {
  const { isLoggedIn, user, hasRole, logout } = useUserSession();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Log detalhado do estado do usuário
  console.log('🔍 [USER MENU DEBUG] Estado atual:', {
    isLoggedIn,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role,
    isLoading: false // useUserSession não expõe isLoading
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('🚪 [USER MENU] Iniciando logout...');
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('❌ [USER MENU] Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigate = (path: string) => {
    console.log('🔗 [USER MENU] Navegando para:', path);
    navigate(path);
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserRole = () => {
    if (hasRole('super_admin')) return 'Super Admin';
    if (hasRole('admin')) return 'Admin';
    if (hasRole('anunciante')) return 'Anunciante';
    return 'Cliente';
  };

  const getRoleColor = () => {
    if (hasRole('super_admin')) return 'bg-red-500';
    if (hasRole('admin')) return 'bg-blue-500';
    if (hasRole('anunciante')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.nome) return user.nome;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getFirstName = () => {
    const displayName = getUserDisplayName();
    if (displayName.includes(' ')) {
      return displayName.split(' ')[0];
    }
    return displayName;
  };

  // CORRIGIDO: Condição mais robusta para usuários não logados
  if (!isLoggedIn) {
    console.log('👤 [USER MENU] Usuário NÃO logado - mostrando dropdown de login');
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <User className="h-5 w-5" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="w-48 bg-white border-gray-200 shadow-lg rounded-lg" 
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal text-center py-3">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#3C1361] to-[#2A0D47] flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Bem-vindo!
              </p>
              <p className="text-xs text-gray-600">
                Faça login ou crie sua conta
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-gray-200" />

          <DropdownMenuItem 
            onClick={() => navigate('/login')}
            className="cursor-pointer text-gray-900 hover:bg-gray-100 flex items-center justify-center py-3"
          >
            <LogIn className="mr-2 h-4 w-4" />
            <span className="font-medium">Fazer Login</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate('/cadastro')}
            className="cursor-pointer text-gray-900 hover:bg-gray-100 flex items-center justify-center py-3"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="font-medium">Criar Conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // USUÁRIO LOGADO - Interface completa
  console.log('✅ [USER MENU] Usuário LOGADO - mostrando menu completo');
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-auto px-2 rounded-lg hover:bg-white/10 text-white"
        >
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#00FFAB] text-[#3C1361] text-sm font-semibold">
                {getUserInitials(user?.name || user?.nome, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-medium text-white">
                {getFirstName()}
              </span>
              <Badge className={`${getRoleColor()} text-white text-xs px-1 py-0 h-4`}>
                {getUserRole()}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-white/70" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56 bg-white border-gray-200 shadow-lg" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-gray-600">
              {user?.email}
            </p>
            <Badge className={`${getRoleColor()} text-white text-xs w-fit`}>
              {getUserRole()}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-200" />

        {/* Menu para Clientes */}
        {!hasRole('admin') && !hasRole('super_admin') && !hasRole('anunciante') && (
          <>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/meus-pedidos')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Meus Pedidos</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Menu para Anunciantes */}
        {hasRole('anunciante') && (
          <>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/anunciante')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/anunciante/pedidos')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Meus Pedidos</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/anunciante/campanhas')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Campanhas</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/anunciante/videos')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <Video className="mr-2 h-4 w-4" />
              <span>Meus Vídeos</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavigate('/anunciante/relatorios')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Relatórios</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Menu para Admins */}
        {(hasRole('admin') || hasRole('super_admin')) && (
          <>
            <DropdownMenuItem 
              onClick={() => handleNavigate(hasRole('super_admin') ? '/super_admin' : '/admin')}
              className="cursor-pointer text-gray-900 hover:bg-gray-100"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Painel Admin</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
