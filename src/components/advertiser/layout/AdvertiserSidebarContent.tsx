
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Video,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
}

const AdvertiserSidebarContent = ({ onItemClick }: AdvertiserSidebarContentProps) => {
  const location = useLocation();

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
        {/* Logo da Indexa - Unificada */}
        <div className="flex items-center justify-center mb-8">
          <UnifiedLogo 
            size="xl" 
            linkTo="/" 
            variant="light"
            className="drop-shadow-lg"
          />
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
