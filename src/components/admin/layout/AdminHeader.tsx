
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  Crown
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
  const { userProfile, logout, isSuperAdmin } = useAuth();
  const { buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  const userName = userProfile?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="bg-gradient-to-r from-[#9C1E1E] via-[#D72638] to-[#180A0A] shadow-lg border-b border-white/20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Título da página */}
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/80">
              {isSuperAdmin ? 'Painel Super Administrativo' : 'Painel Administrativo'}
            </p>
          </div>
        </div>
        
        {/* Navegação direita */}
        <div className="flex items-center space-x-4">
          {/* Busca */}
          <div className="hidden md:flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-white/70 mr-2" />
            <input 
              type="search" 
              placeholder="Buscar..." 
              className="bg-transparent border-none focus:outline-none text-sm w-48 text-white placeholder-white/60"
            />
          </div>
          
          {/* Notificações - Melhor visibilidade */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-white hover:bg-white/20 hover:text-white bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            {/* Badge de notificação - exemplo */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
              3
            </span>
          </Button>
          
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-white hover:bg-white/20 hover:text-white px-3 py-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-white/70 flex items-center">
                    {isSuperAdmin && <Crown className="h-3 w-3 mr-1" />}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-xl rounded-xl">
              <DropdownMenuLabel className="text-gray-900">
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              {isSuperAdmin && (
                <DropdownMenuItem onClick={() => navigate(buildPath('configuracoes'))} className="text-gray-900 hover:bg-gray-100">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:bg-red-50">
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
