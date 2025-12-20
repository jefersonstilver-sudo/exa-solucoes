import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Video,
  User,
  LogOut,
  Crown,
  Receipt
} from 'lucide-react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import exaLogo from '@/assets/exa-logo.png';

interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

const AdvertiserSidebarContent = ({ onItemClick, isCollapsed = false }: AdvertiserSidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserSession();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  const sidebarItems = [
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingBag,
      section: 'main'
    },
    {
      title: 'Minhas Faturas',
      href: '/anunciante/faturas',
      icon: Receipt,
      section: 'main'
    },
    {
      title: 'Relatório',
      href: '/anunciante/videos',
      icon: Video,
      section: 'content'
    },
    {
      title: 'Perfil',
      href: '/anunciante/perfil',
      icon: User,
      section: 'settings'
    }
  ];

  const sections = {
    main: 'Gestão Principal',
    content: 'Conteúdo',
    settings: 'Configurações'
  };

  const groupedItems = sidebarItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarItems>);

  const isActive = (href: string) => {
    return location.pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "h-screen bg-gradient-to-b from-red-800 via-red-900 to-black shadow-2xl flex flex-col transition-all duration-300 overflow-hidden",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Logo e Info do Usuário */}
      <div className={cn(
        "border-b border-white/20 flex-shrink-0",
        isCollapsed ? "p-3" : "p-6"
      )}>
        {/* Logo EXA */}
        <div className="flex items-center justify-center mb-4">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            logoUrl={exaLogo}
            altText="EXA Logo"
            className={cn(
              "drop-shadow-2xl transition-all duration-300 hover:scale-105",
              isCollapsed ? "w-10 h-10" : "w-20 h-20"
            )}
          />
        </div>
        
        {/* Informações do Usuário - apenas quando expandido */}
        {!isCollapsed && (
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-left-5 duration-300">
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user?.email?.split('@')[0] || 'Anunciante'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Crown className="h-3 w-3 text-blue-400 flex-shrink-0" />
                <span className="text-xs font-medium text-blue-400 truncate">
                  Portal do Anunciante
                </span>
              </div>
            </div>
            
            {/* Notificações e Menu - UMA única instância */}
            <div className="flex items-center space-x-2 ml-2">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-white/20">
                      <AvatarFallback className="bg-white text-exa-red font-semibold text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none text-gray-900">
                      {user?.email || 'Anunciante'}
                    </p>
                    <p className="text-xs leading-none text-blue-600 font-medium">
                      Portal do Anunciante
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {/* Avatar compacto quando colapsado - SEM NotificationCenter duplicado */}
        {isCollapsed && (
          <div className="flex flex-col items-center space-y-2">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20 transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-white/20">
                    <AvatarFallback className="bg-white text-exa-red font-semibold text-xs">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-gray-900">
                    {user?.email || 'Anunciante'}
                  </p>
                  <p className="text-xs leading-none text-blue-600 font-medium">
                    Portal do Anunciante
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Navegação organizada por seções */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2 space-y-2" : "p-4 space-y-6")}>
        {Object.entries(groupedItems).map(([sectionKey, items]) => (
          <div key={sectionKey}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                {sections[sectionKey as keyof typeof sections]}
              </h3>
            )}
            <div className={cn(isCollapsed ? "space-y-1" : "space-y-1")}>
              {items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group',
                    isCollapsed ? "p-2 justify-center" : "space-x-3 px-4 py-3",
                    isActive(item.href)
                      ? 'bg-white text-gray-900 shadow-lg font-semibold'
                      : 'text-white hover:text-white hover:bg-white/10 hover:translate-x-1'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className={cn(
                    "transition-transform duration-200 group-hover:scale-110",
                    isActive(item.href) ? "text-red-600" : "text-white",
                    "h-5 w-5"
                  )} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Footer da sidebar */}
      <div className={cn("border-t border-white/20", isCollapsed ? "p-2" : "p-4")}>
        {!isCollapsed && (
          <>
            <div className="flex items-center space-x-2 text-white text-xs">
              <Crown className="h-4 w-4" />
              <span>Sistema Seguro</span>
            </div>
            <div className="text-xs text-white/50 mt-1">
              EXA Anunciante v3.0
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdvertiserSidebarContent;
