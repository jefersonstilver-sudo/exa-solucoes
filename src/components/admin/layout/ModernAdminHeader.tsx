import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import exaLogo from '@/assets/exa-logo.png';

const ModernAdminHeader = () => {
  const { userProfile, logout } = useAuth();
  const { userInfo } = useUserPermissions();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getAdminTitle = () => {
    switch (userInfo.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Dashboard Executivo';
      case 'admin_marketing':
        return 'Admin Marketing';
      default:
        return 'Admin Panel';
    }
  };

  const getRoleLabel = () => {
    switch (userInfo.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'admin_marketing':
        return 'Admin Marketing';
      default:
        return 'Admin';
    }
  };

  return (
    <div className="flex items-center justify-between flex-1">
      {/* EXA Logo with Role Label */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <img 
            src={exaLogo} 
            alt="EXA" 
            className="h-10 md:h-12 w-auto brightness-0 invert"
          />
          <span className="text-[10px] md:text-xs text-white/80 font-medium -mt-1">
            {getRoleLabel()}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <NotificationCenter />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full touch-target hover:bg-white/20">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white/20 text-white font-semibold text-xs backdrop-blur-sm">
                  {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none truncate">
                {userProfile?.email || 'Admin'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {getRoleLabel()}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="touch-target">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
export default ModernAdminHeader;