
import React from 'react';
import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

interface ModernAdminHeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const ModernAdminHeader = ({ onToggleSidebar, sidebarCollapsed }: ModernAdminHeaderProps) => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#3C1361] via-[#9333EA] to-[#A855F7] border-b border-white/20 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Botão Hambúrguer */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center space-x-4">
          {/* Sistema de Notificações */}
          <NotificationCenter />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-white text-[#3C1361] font-semibold">
                    {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none text-gray-900">
                  {userProfile?.email || 'Admin'}
                </p>
                <p className="text-xs leading-none text-gray-600">
                  Super Administrador
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/super_admin/configuracoes')}
                className="text-gray-700 hover:bg-gray-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
