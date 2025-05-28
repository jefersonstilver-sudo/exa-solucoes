
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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Título da página apenas */}
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-semibold text-black">{title}</h2>
            <p className="text-sm text-gray-600">
              {isSuperAdmin ? 'Painel Super Administrativo' : 'Painel Administrativo'}
            </p>
          </div>
        </div>
        
        {/* Navegação direita */}
        <div className="flex items-center space-x-4">
          {/* Busca */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input 
              type="search" 
              placeholder="Buscar..." 
              className="bg-transparent border-none focus:outline-none text-sm w-48 text-black placeholder-gray-500"
            />
          </div>
          
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-gray-600 hover:text-black hover:bg-gray-100 px-3 py-2">
                <div className="w-8 h-8 bg-indexa-purple rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-black">{userName}</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    {isSuperAdmin && <Crown className="h-3 w-3 mr-1" />}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuLabel className="text-black">
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={() => navigate('/super_admin/configuracoes')} className="text-black hover:bg-gray-100">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
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
