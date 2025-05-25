
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  Menu,
  User,
  Shield,
  Crown,
  Zap,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AdminHeaderProps {
  title?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Dashboard' }) => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      const { success } = await logout();
      if (success) {
        toast.success('Logout realizado com sucesso');
        navigate('/login');
      } else {
        toast.error('Erro ao realizar logout');
      }
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  const userName = userProfile?.email?.split('@')[0] || 'Usuario';
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';

  return (
    <header className="bg-gradient-to-r from-indexa-purple-dark via-indexa-purple to-indexa-purple-dark shadow-2xl border-b border-indexa-mint/20 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-6">
        {/* Logo INDEXA + Título */}
        <div className="flex items-center space-x-6">
          {/* Logo INDEXA */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indexa-mint to-indexa-mint-dark rounded-xl flex items-center justify-center shadow-xl shadow-indexa-mint/30">
                <span className="text-indexa-purple-dark font-black text-xl">I</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indexa-mint rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">INDEXA</h1>
              <p className="text-xs text-indexa-mint font-bold uppercase tracking-wider">MEDIA</p>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-indexa-mint/50 to-transparent"></div>
          
          {/* Título da seção */}
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                {title}
                {isSuperAdmin && (
                  <span className="ml-4 text-xs bg-indexa-mint/20 text-indexa-mint px-3 py-1 rounded-full border border-indexa-mint/30 backdrop-blur-sm font-bold">
                    MASTER ACCESS
                  </span>
                )}
              </h2>
              <p className="text-sm text-indexa-mint/80 font-medium">
                {isSuperAdmin ? 'Controle Total do Sistema' : 'Painel Administrativo'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navegação direita */}
        <div className="flex items-center space-x-4">
          {/* Busca premium */}
          <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 shadow-lg">
            <Search className="h-4 w-4 text-indexa-mint mr-3" />
            <input 
              type="search" 
              placeholder="Busca avançada no sistema..." 
              className="bg-transparent border-none focus:outline-none text-sm w-64 text-white placeholder-white/50 font-medium"
            />
          </div>
          
          {/* Status do sistema */}
          <div className="hidden lg:flex items-center space-x-2 bg-indexa-mint/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-indexa-mint/20">
            <Activity className="h-4 w-4 text-indexa-mint animate-pulse" />
            <span className="text-xs text-indexa-mint font-bold">ONLINE</span>
          </div>
          
          {/* Notificações premium */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:text-indexa-mint hover:bg-white/10 transition-all duration-300">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indexa-mint rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-indexa-mint rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-indexa-purple-dark/95 backdrop-blur-xl border-indexa-mint/20 shadow-2xl">
              <DropdownMenuLabel className="text-indexa-mint border-b border-indexa-mint/20 pb-2">
                Sistema de Alertas
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-indexa-mint/20" />
              <div className="max-h-64 overflow-auto">
                <DropdownMenuItem className="p-4 cursor-pointer text-white hover:bg-indexa-mint/10 transition-all duration-200">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 text-indexa-mint mt-1" />
                    <div>
                      <p className="font-medium text-white">Sistema Atualizado</p>
                      <p className="text-sm text-white/70">Todas as funcionalidades operacionais</p>
                      <p className="text-xs text-indexa-mint mt-1">Há 2 minutos</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Menu do usuário premium */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-white hover:text-indexa-mint hover:bg-white/10 transition-all duration-300 px-4 py-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-indexa-mint to-indexa-mint-dark rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-indexa-purple-dark" />
                  </div>
                  {isSuperAdmin && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-indexa-mint" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold">{userName}</p>
                  <p className="text-xs text-indexa-mint">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-indexa-purple-dark/95 backdrop-blur-xl border-indexa-mint/20 shadow-2xl">
              <DropdownMenuLabel className="text-indexa-mint">
                <div className="flex flex-col">
                  <span className="flex items-center font-bold">
                    {userName}
                    {isSuperAdmin && <Crown className="h-3 w-3 ml-2 text-indexa-mint" />}
                  </span>
                  <span className="text-xs text-white/70">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-indexa-mint/20" />
              <DropdownMenuItem onClick={() => navigate('/super_admin/configuracoes')} className="text-white hover:bg-indexa-mint/10 transition-all duration-200">
                <Settings className="mr-3 h-4 w-4 text-indexa-mint" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-indexa-mint/20" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:bg-red-500/10 transition-all duration-200">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
