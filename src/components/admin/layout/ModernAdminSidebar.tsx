
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
    <div className="bg-gradient-to-b from-[#3C1361] to-[#2A0D47] border-r border-purple-800/30 w-64 min-h-screen">
      <div className="p-6">
        {/* Logo da Indexa no topo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-[#00FFAB] rounded-lg flex items-center justify-center">
            <span className="text-[#3C1361] font-bold text-xl">I</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              INDEXA
            </h2>
            <p className="text-xs text-purple-200">Admin Panel</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href, item.exact)
                  ? 'bg-[#00FFAB] text-[#3C1361] shadow-lg font-semibold'
                  : 'text-purple-100 hover:text-white hover:bg-white/10 hover:translate-x-1'
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
