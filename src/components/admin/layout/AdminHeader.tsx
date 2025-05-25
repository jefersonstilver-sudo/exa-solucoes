
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo INDEXA oficial */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/f677426c-40b3-4d9c-a90d-29ecfd564e5e.png" 
              alt="INDEXA Logo" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="h-8 w-px bg-gray-600"></div>
          
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-gray-300">
              {isSuperAdmin ? 'Painel Super Administrativo' : 'Painel Administrativo'}
            </p>
          </div>
        </div>
        
        {/* Navegação direita */}
        <div className="flex items-center space-x-4">
          {/* Busca */}
          <div className="hidden md:flex items-center bg-gray-700 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input 
              type="search" 
              placeholder="Buscar..." 
              className="bg-transparent border-none focus:outline-none text-sm w-48 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-700">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2">
                <div className="w-8 h-8 bg-indexa-purple rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-400 flex items-center">
                    {isSuperAdmin && <Crown className="h-3 w-3 mr-1" />}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border border-gray-700 shadow-lg">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-gray-400">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={() => navigate('/super_admin/configuracoes')} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
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
