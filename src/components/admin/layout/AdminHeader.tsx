
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
    <header className="bg-indexa-purple shadow-sm border-b border-indexa-purple-dark">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo INDEXA oficial */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODEzNjM2MCwiZXhwIjoxNzc5NjcyMzYwfQ.lJuvOzeGcyQSF2sNqu1GyxuZpgwpBUGt9HsIbKrGakg" 
              alt="INDEXA Logo" 
              className="h-12 w-auto"
            />
          </div>
          
          <div className="h-8 w-px bg-indexa-mint/30"></div>
          
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-indexa-mint">
              {isSuperAdmin ? 'Painel Super Administrativo' : 'Painel Administrativo'}
            </p>
          </div>
        </div>
        
        {/* Navegação direita */}
        <div className="flex items-center space-x-4">
          {/* Busca */}
          <div className="hidden md:flex items-center bg-indexa-purple-dark rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-indexa-mint mr-2" />
            <input 
              type="search" 
              placeholder="Buscar..." 
              className="bg-transparent border-none focus:outline-none text-sm w-48 text-white placeholder-indexa-mint/60"
            />
          </div>
          
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="text-indexa-mint hover:text-white hover:bg-indexa-purple-dark">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 text-indexa-mint hover:text-white hover:bg-indexa-purple-dark px-3 py-2">
                <div className="w-8 h-8 bg-indexa-mint rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-indexa-purple" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-indexa-mint/80 flex items-center">
                    {isSuperAdmin && <Crown className="h-3 w-3 mr-1" />}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-indexa-purple-dark border border-indexa-mint/20 shadow-lg">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-indexa-mint">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-indexa-mint/20" />
              <DropdownMenuItem onClick={() => navigate('/super_admin/configuracoes')} className="text-indexa-mint hover:bg-indexa-purple hover:text-white">
                <Settings className="mr-3 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-indexa-mint/20" />
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
