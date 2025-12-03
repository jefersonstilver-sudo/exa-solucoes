import React, { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import exaLogo from '@/assets/exa-logo.png';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const ModernAdminHeader = () => {
  const {
    userProfile,
    logout
  } = useAuth();
  const {
    userInfo
  } = useUserPermissions();
  const navigate = useNavigate();
  const {
    isMobile
  } = useAdvancedResponsive();
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Atualiza a cada segundo
    return () => clearInterval(interval);
  }, []);
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
  return <div className="flex items-center justify-between flex-1">
      {/* EXA Logo - Only on Mobile - Clean style */}
      {isMobile && <div className="flex items-center gap-2">
          <img src={exaLogo} alt="EXA" className="h-7 w-auto" />
          <div className="h-4 w-px bg-border/50" />
          <span className="text-[10px] font-medium text-primary-foreground">
            {getRoleLabel()}
          </span>
        </div>}

      {/* Desktop: Dynamic Title */}
      {!isMobile && <div />}

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Data e hora com segundos em tempo real - Desktop only */}
        <div className="hidden md:flex flex-col items-end text-right border-r border-border/30 pr-3 mr-1">
          <span className="text-sm font-medium text-foreground leading-tight">
            {format(currentTime, "EEEE, dd 'de' MMMM", {
            locale: ptBR
          })}
          </span>
          <span className="text-xs text-muted-foreground leading-tight font-mono">
            {format(currentTime, 'HH:mm:ss')}
          </span>
        </div>
        
        <NotificationCenter />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`relative h-7 w-7 rounded-full touch-target ${isMobile ? 'hover:bg-black/5' : 'hover:bg-accent'}`}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="font-semibold text-[10px] bg-muted text-muted-foreground">
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
    </div>;
};
export default ModernAdminHeader;