
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Video,
  User,
  Settings,
  HelpCircle,
  LogOut,
  BarChart3,
  Crown
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
import NotificationCenter from '@/components/notifications/NotificationCenter';

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
    // GESTÃO PRINCIPAL
    {
      title: 'Dashboard',
      href: '/anunciante',
      icon: LayoutDashboard,
      exact: true,
      section: 'main'
    },
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingBag,
      section: 'main'
    },
    {
      title: 'Campanhas',
      href: '/anunciante/campanhas',
      icon: BarChart3,
      section: 'main'
    },
    
    // CONTEÚDO
    {
      title: 'Meus Vídeos',
      href: '/anunciante/videos',
      icon: Video,
      section: 'content'
    },
    
    // CONFIGURAÇÕES
    {
      title: 'Perfil',
      href: '/anunciante/perfil',
      icon: User,
      section: 'settings'
    },
    {
      title: 'Configurações',
      href: '/anunciante/configuracoes',
      icon: Settings,
      section: 'settings'
    },
    {
      title: 'Suporte',
      href: '/anunciante/suporte',
      icon: HelpCircle,
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

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "h-screen bg-gradient-to-b from-[#1e40af] via-[#3b82f6] to-[#60a5fa] shadow-xl flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Logo da INDEXA no topo */}
      <div className={cn("border-b border-white/20", isCollapsed ? "p-3" : "p-6")}>
        <div className="flex items-center justify-center mb-6">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={cn("drop-shadow-lg", isCollapsed ? "w-10 h-10" : "w-20 h-20")}
          />
        </div>
        
        {/* Informações do Usuário - só mostra se não estiver colapsado */}
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-white font-semibold text-sm truncate">
                {user?.email?.split('@')[0] || 'Anunciante'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Crown className="h-3 w-3 text-yellow-300" />
                <span className="text-xs font-medium text-yellow-300">
                  Portal do Anunciante
                </span>
              </div>
            </div>
            
            {/* Notificações e Menu do Usuário */}
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white text-[#1e40af] font-semibold text-xs">
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
                    <p className="text-xs leading-none text-gray-600">
                      Portal do Anunciante
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/anunciante/configuracoes')}
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
        )}
        
        {/* Avatar compacto quando colapsado */}
        {isCollapsed && (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white text-[#1e40af] font-semibold text-xs">
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
                  <p className="text-xs leading-none text-gray-600">
                    Portal do Anunciante
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/anunciante/configuracoes')}
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
        )}
      </div>
      
      {/* Navegação organizada por seções */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2 space-y-2" : "p-4 space-y-6")}>
        {Object.entries(groupedItems).map(([sectionKey, items]) => (
          <div key={sectionKey}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3 px-2">
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
                    isCollapsed ? "p-2 justify-center" : "space-x-3 px-3 py-3",
                    isActive(item.href, item.exact)
                      ? 'bg-white text-[#1e40af] shadow-lg font-semibold'
                      : 'text-white hover:text-white hover:bg-white/20 hover:translate-x-1'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className={cn(
                    "transition-transform duration-200 group-hover:scale-110",
                    isActive(item.href, item.exact) ? "text-[#1e40af]" : "text-white",
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
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
            <div className="flex items-center space-x-2 text-white text-sm">
              <Crown className="h-4 w-4" />
              <span>Portal Seguro</span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              INDEXA Anunciante v3.0
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
