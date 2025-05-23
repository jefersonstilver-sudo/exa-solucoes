
import React from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu,
  User,
  RefreshCw,
  Shield,
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
import { useTheme } from '@/components/ui/theme-provider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface AdminHeaderProps {
  title?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Dashboard' }) => {
  const { setTheme } = useTheme();
  const { user, session } = useUserSession();
  const navigate = useNavigate();
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  // Get user name and role from session if available
  const userName = session?.user?.user_metadata?.name || 
                  (user && 'name' in user ? (user as any).name : user?.email) || 
                  'Usuario';
                  
  const userRole = session?.user?.user_metadata?.role || 
                  (user && 'role' in user ? (user as any).role : 'admin');

  const isSuperAdmin = user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin';

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-xl border-b border-slate-600/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2 text-slate-300 hover:text-white hover:bg-slate-700" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            {isSuperAdmin && (
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-slate-900" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center">
                {title}
                {isSuperAdmin && (
                  <span className="ml-3 text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full border border-amber-500/30">
                    MASTER
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-400">
                {isSuperAdmin ? 'Sistema de Controle Master' : 'Painel Administrativo INDEXA'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search - Enhanced for super admin */}
          <div className="hidden md:flex items-center border border-slate-600 rounded-lg px-3 py-2 bg-slate-800/50 backdrop-blur-sm">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="search" 
              placeholder={isSuperAdmin ? "Busca avançada..." : "Buscar..."} 
              className="bg-transparent border-none focus:outline-none text-sm w-32 md:w-48 text-slate-300 placeholder-slate-500"
            />
          </div>
          
          {/* Notifications - Enhanced styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-slate-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">
                {isSuperAdmin ? 'Alertas do Sistema' : 'Notificações'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <div className="max-h-64 overflow-auto">
                <DropdownMenuItem className="p-3 cursor-pointer text-slate-300 hover:bg-slate-700">
                  <div>
                    <p className="font-medium">Sistema atualizado</p>
                    <p className="text-sm text-slate-400">Todas as funcionalidades operacionais</p>
                    <p className="text-xs text-slate-500 mt-1">Há 5 minutos</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Theme Toggle - Enhanced */}
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <Sun className="h-5 w-5" />
          </Button>
          
          {/* User Menu - Enhanced for super admin */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-white hover:bg-slate-700 relative">
                <User className="h-5 w-5" />
                {isSuperAdmin && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-slate-800"></div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-slate-200">
                <div className="flex flex-col">
                  <span className="flex items-center">
                    {userName}
                    {isSuperAdmin && <Crown className="h-3 w-3 ml-2 text-amber-400" />}
                  </span>
                  <span className="text-xs text-slate-400">{userRole}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={() => navigate('/super_admin/configuracoes')} className="text-slate-300 hover:bg-slate-700">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:bg-red-900/20">
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

export default AdminHeader;
