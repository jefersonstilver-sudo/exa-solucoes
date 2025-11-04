import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Building2, Bell, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const MobileBottomNav = () => {
  const location = useLocation();
  const { buildPath } = useAdminBasePath();

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      path: buildPath('/'),
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      path: buildPath('/orders'),
    },
    {
      icon: Building2,
      label: 'Prédios',
      path: buildPath('/buildings'),
    },
    {
      icon: Bell,
      label: 'Alertas',
      path: buildPath('/notifications'),
    },
    {
      icon: MoreHorizontal,
      label: 'Mais',
      path: buildPath('/settings'),
    },
  ];

  const isActive = (path: string) => {
    if (path === buildPath('/')) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav-container">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200 relative touch-target',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-6 w-6', active && 'scale-110')} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium mt-1',
                  active && 'font-bold'
                )}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
