
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Monitor, 
  ShoppingBag, 
  Users, 
  Settings, 
  Image,
  Bell,
  CreditCard,
  CheckSquare,
  UserCheck,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
}

const ModernAdminSidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();
  
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/super_admin',
      exact: true
    },
    {
      title: 'Prédios',
      icon: Building,
      href: '/super_admin/predios'
    },
    {
      title: 'Painéis',
      icon: Monitor,
      href: '/super_admin/paineis'
    },
    {
      title: 'Pedidos',
      icon: ShoppingBag,
      href: '/super_admin/pedidos'
    },
    {
      title: 'Aprovações',
      icon: CheckSquare,
      href: '/super_admin/aprovacoes'
    },
    {
      title: 'Usuários',
      icon: Users,
      href: '/super_admin/usuarios'
    },
    {
      title: 'Síndicos Interessados',
      icon: UserCheck,
      href: '/super_admin/sindicos-interessados'
    },
    {
      title: 'Cupons',
      icon: CreditCard,
      href: '/super_admin/cupons'
    },
    {
      title: 'Homepage',
      icon: Home,
      href: '/super_admin/homepage-config'
    },
    {
      title: 'Notificações',
      icon: Bell,
      href: '/super_admin/notificacoes'
    },
    {
      title: 'Configurações',
      icon: Settings,
      href: '/super_admin/configuracoes'
    }
  ];

  const isActiveRoute = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-full bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-purple-900" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">INDEXA</h1>
              <p className="text-xs text-purple-200">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-purple-700/50 hover:text-white',
                  isActive 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-purple-100',
                  isCollapsed ? 'justify-center' : 'justify-start'
                )}
              >
                <Icon className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ModernAdminSidebar;
