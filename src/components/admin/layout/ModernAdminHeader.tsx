
import React from 'react';
import { Bell, Settings, LogOut, User } from 'lucide-react';
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

const ModernAdminHeader = () => {
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
    <header className="bg-gradient-to-r from-[#3C1361] to-[#2A0D47] border-b border-purple-800/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo da Indexa */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#00FFAB] rounded-lg flex items-center justify-center">
              <span className="text-[#3C1361] font-bold text-xl">I</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                INDEXA
              </h1>
              <p className="text-sm text-purple-200">Painel Administrativo</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sistema de Notificações */}
          <NotificationCenter />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#00FFAB] text-[#3C1361] font-semibold">
                    {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-gray-200" align="end" forceMount>
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
