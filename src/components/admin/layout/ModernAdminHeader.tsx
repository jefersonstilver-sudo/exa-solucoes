
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  Crown,
  X
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface ModernAdminHeaderProps {
  title?: string;
}

const ModernAdminHeader: React.FC<ModernAdminHeaderProps> = ({ title = 'Dashboard Executivo' }) => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    searchTerm, 
    setSearchTerm, 
    results, 
    isLoading, 
    isOpen, 
    setIsOpen, 
    clearSearch 
  } = useGlobalSearch();
  
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

  const handleResultClick = (url: string) => {
    navigate(url);
    clearSearch();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4 text-blue-400" />;
      case 'order': return <Bell className="h-4 w-4 text-green-400" />;
      case 'building': return <Settings className="h-4 w-4 text-orange-400" />;
      case 'panel': return <Search className="h-4 w-4 text-purple-400" />;
      default: return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const userName = userProfile?.email?.split('@')[0] || 'Usuario';
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';

  return (
    <header className="indexa-header-gradient shadow-lg border-b border-white/10">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />
          <div>
            <h1 className="text-xl font-semibold text-white drop-shadow-sm">{title}</h1>
            <p className="text-sm text-white/80">
              Sistema de Gestão INDEXA
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sistema de Busca Global */}
          <div className="hidden md:flex relative">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
              <Search className="h-4 w-4 text-white/70 mr-2" />
              <input 
                type="search" 
                placeholder="Buscar usuários, pedidos, prédios..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="bg-transparent border-none focus:outline-none text-sm w-64 text-white placeholder-white/50"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-6 w-6 p-0 text-white/70 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Resultados da Busca */}
            {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {isLoading && (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Buscando...
                  </div>
                )}
                
                {!isLoading && results.length === 0 && searchTerm.length >= 2 && (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum resultado encontrado para "{searchTerm}"
                  </div>
                )}
                
                {!isLoading && results.length > 0 && (
                  <div className="py-2">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-white/70 flex items-center">
                    {isSuperAdmin && <Crown className="h-3 w-3 mr-1 text-yellow-300" />}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border border-purple-200/50 shadow-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{userName}</span>
                  <span className="text-xs text-purple-600">{userProfile?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-purple-100" />
              <DropdownMenuItem 
                onClick={() => navigate('/super_admin/configuracoes')}
                className="text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-purple-100" />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair do Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Overlay para fechar busca */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
};

export default ModernAdminHeader;
