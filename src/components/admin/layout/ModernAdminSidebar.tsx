import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Building2,
  ShoppingCart,
  CheckSquare,
  Monitor,
  Settings,
  Ticket
} from 'lucide-react';

const ModernAdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/super_admin/',
      active: location.pathname === '/super_admin/' || location.pathname === '/super_admin'
    },
    {
      label: 'Usuários',
      icon: Users,
      href: '/super_admin/usuarios',
      active: location.pathname.includes('/usuarios')
    },
    {
      label: 'Prédios',
      icon: Building2,
      href: '/super_admin/predios',
      active: location.pathname.includes('/predios')
    },
    {
      label: 'Painéis',
      icon: Monitor,
      href: '/super_admin/paineis',
      active: location.pathname.includes('/paineis')
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      href: '/super_admin/pedidos',
      active: location.pathname.includes('/pedidos')
    },
    {
      label: 'Aprovações',
      icon: CheckSquare,
      href: '/super_admin/aprovacoes',
      active: location.pathname.includes('/aprovacoes')
    },
    {
      label: 'Cupons',
      icon: Ticket,
      href: '/super_admin/cupons',
      active: location.pathname.includes('/cupons')
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/super_admin/configuracoes',
      active: location.pathname.includes('/configuracoes')
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 px-4 py-6">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                item.active
                  ? 'bg-indexa-purple text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
