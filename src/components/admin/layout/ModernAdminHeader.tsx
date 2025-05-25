
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from '@/components/user/UserMenu';
import { useAuth } from '@/hooks/useAuth';

const ModernAdminHeader = () => {
  const { userProfile } = useAuth();

  const getRoleText = (role: string | null | undefined) => {
    switch (role) {
      case 'super_admin':
        return 'Administrador Master';
      case 'admin':
        return 'Administrador';
      case 'client':
        return 'Área do Anunciante';
      default:
        return 'Painel Administrativo';
    }
  };

  return (
    <header className="border-b bg-gradient-to-r from-indexa-purple to-indexa-purple/95 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-white hover:bg-white/10 transition-colors duration-200" />
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                alt="Indexa Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-white/90 font-medium">
                {getRoleText(userProfile?.role)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
