import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Building2, Gift, MoreHorizontal } from 'lucide-react';
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
      path: buildPath(''),
    },
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      path: buildPath('pedidos'),
    },
    {
      icon: Building2,
      label: 'Prédios',
      path: buildPath('predios'),
    },
    {
      icon: Gift,
      label: 'Benefícios',
      path: buildPath('beneficio-prestadores'),
    },
    {
      icon: MoreHorizontal,
      label: 'Mais',
      path: buildPath('configuracoes'),
    },
  ];

  const isActive = (path: string) => {
    // Exact match for dashboard
    if (path === buildPath('')) {
      return location.pathname === path;
    }
    // For other paths, check if current path starts with it
    return location.pathname.includes(path.split('/').pop() || '');
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-t border-white/20 shadow-2xl" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                'transition-all duration-200 relative touch-target rounded-lg',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-7 w-7 transition-all',
                  active && 'scale-110 text-[#00FFAB]'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#00FFAB] text-gray-900 text-[10px] font-bold flex items-center justify-center shadow-lg">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  active ? 'text-white' : 'text-white/90'
                )}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#00FFAB] rounded-b-full shadow-lg" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
