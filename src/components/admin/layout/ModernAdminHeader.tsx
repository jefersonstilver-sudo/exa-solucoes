import React, { useState, useEffect } from 'react';
import exaLogo from '@/assets/exa-logo.png';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ModernAdminHeader = () => {
  const { userInfo } = useUserPermissions();
  const { userProfile } = useAuth();
  const { isMobile } = useAdvancedResponsive();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  const getUserName = (): string => {
    if (userProfile?.nome) {
      return userProfile.nome.split(' ')[0];
    }
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'Admin';
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
      {/* EXA Logo - Only on Mobile */}
      {isMobile && (
        <div className="flex items-center gap-2">
          <img src={exaLogo} alt="EXA" className="h-7 w-auto" />
          <div className="h-4 w-px bg-border/50" />
          <span className="text-[10px] font-medium text-primary-foreground">
            {getRoleLabel()}
          </span>
        </div>
      )}

      {/* Desktop: Greeting */}
      {!isMobile && (
        <h1 className="text-lg font-semibold text-foreground">
          {getGreeting()}, <span className="text-primary">{getUserName()}</span> 👋
        </h1>
      )}

      {/* Data e hora - Desktop only */}
      <div className="hidden md:flex flex-col items-end text-right">
        <span className="text-sm font-medium text-foreground leading-tight">
          {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
        <span className="text-xs text-muted-foreground leading-tight font-mono">
          {format(currentTime, 'HH:mm:ss')}
        </span>
      </div>
    </div>
  );
};

export default ModernAdminHeader;