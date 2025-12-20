
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import {
  LayoutDashboard,
  ShoppingBag,
  Play,
  Video,
  BarChart3,
  Settings
} from 'lucide-react';

const ModernAdvertiserSidebar = () => {
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
      title: 'Relatório',
      href: '/anunciante/videos',
      icon: Video
    },
    {
      title: 'Relatórios',
      href: '/anunciante/relatorios',
      icon: BarChart3
    },
    {
      title: 'Configurações',
      href: '/anunciante/configuracoes',
      icon: Settings
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href || location.pathname === '/anunciante/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-gradient-to-b from-[#9C1E1E] to-[#180A0A] border-r border-red-800/30 w-64 min-h-screen">
      <div className="p-6">
        {/* Logo da Indexa - agora clicável */}
        <div className="flex items-center justify-center mb-8">
          <UnifiedLogo 
            size="custom"
            linkTo="/"
            variant="light"
            className="w-32 h-32"
          />
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href, item.exact)
                  ? 'bg-[#00FFAB] text-[#9C1E1E] shadow-lg font-semibold'
                  : 'text-white hover:text-white hover:bg-white/10 hover:translate-x-1'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ModernAdvertiserSidebar;
