
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Building,
  MonitorPlay,
  CheckSquare,
  Video,
  Ticket,
  Settings,
  Bell
} from 'lucide-react';

const ModernAdminSidebar = () => {
  const location = useLocation();

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/super_admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Usuários',
      href: '/super_admin/usuarios',
      icon: Users
    },
    {
      title: 'Pedidos',
      href: '/super_admin/pedidos',
      icon: Package
    },
    {
      title: 'Aprovações',
      href: '/super_admin/aprovacoes',
      icon: CheckSquare
    },
    {
      title: 'Gestão de Vídeos',
      href: '/super_admin/videos',
      icon: Video
    },
    {
      title: 'Prédios',
      href: '/super_admin/predios',
      icon: Building
    },
    {
      title: 'Painéis',
      href: '/super_admin/paineis',
      icon: MonitorPlay
    },
    {
      title: 'Cupons',
      href: '/super_admin/cupons',
      icon: Ticket
    },
    {
      title: 'Notificações',
      href: '/super_admin/notifications',
      icon: Bell
    },
    {
      title: 'Configurações',
      href: '/super_admin/configuracoes',
      icon: Settings
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-slate-900 border-r border-slate-700 w-64 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-8">
          INDEXA Admin
        </h2>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-indexa-purple text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
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

export default ModernAdminSidebar;
