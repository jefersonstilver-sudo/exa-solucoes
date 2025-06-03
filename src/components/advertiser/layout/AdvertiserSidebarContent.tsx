
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
  LogOut
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

interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
}

const AdvertiserSidebarContent = ({ onItemClick }: AdvertiserSidebarContentProps) => {
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
      title: 'Dashboard',
      href: '/anunciante',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingBag
    },
    {
      title: 'Meus Vídeos',
      href: '/anunciante/videos',
      icon: Video
    },
    {
      title: 'Perfil',
      href: '/anunciante/perfil',
      icon: User
    },
    {
      title: 'Configurações',
      href: '/anunciante/configuracoes',
      icon: Settings
    },
    {
      title: 'Suporte',
      href: '/anunciante/suporte',
      icon: HelpCircle
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-gradient-to-b from-[#3C1361] via-[#9333EA] to-[#A855F7] border-r border-white/20 w-full h-full shadow-xl">
      <div className="p-6">
        {/* Logo da Indexa - Unificada e Maior */}
        <div className="flex items-center justify-center mb-6">
          <UnifiedLogo 
            size="xl" 
            linkTo="/" 
            variant="light"
            className="drop-shadow-lg w-20 h-20"
          />
        </div>

        {/* Informações do Usuário Integradas */}
        <div className="flex items-center justify-between mb-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
          <div className="flex-1">
            <div className="text-white font-semibold text-sm truncate">
              {user?.email?.split('@')[0] || 'Anunciante'}
            </div>
            <div className="text-emerald-300 text-xs mt-1">
              Portal do Anunciante
            </div>
          </div>
          
          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white text-[#3C1361] font-semibold text-xs">
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
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive(item.href, item.exact)
                  ? 'bg-white text-[#3C1361] shadow-lg font-semibold'
                  : 'text-white hover:text-white hover:bg-white/20 hover:translate-x-1'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                isActive(item.href, item.exact) ? "text-[#3C1361]" : "text-white"
              )} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdvertiserSidebarContent;
