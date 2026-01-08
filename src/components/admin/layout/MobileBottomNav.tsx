import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, ShoppingBag, Monitor, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { MobileMoreMenu } from './MobileMoreMenu';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: number;
  isMoreButton?: boolean;
}

const MobileBottomNav = () => {
  const location = useLocation();
  const { basePath, buildPath } = useAdminBasePath();

  // FASE 1: 5 itens fixos por processo de negócio
  const navItems: NavItem[] = [
    {
      icon: Home,
      label: 'Início',
      path: basePath,
    },
    {
      icon: Users,
      label: 'CRM',
      path: buildPath('contatos'),
    },
    {
      icon: ShoppingBag,
      label: 'Vendas',
      path: buildPath('pedidos'),
    },
    {
      icon: Monitor,
      label: 'Operação',
      path: buildPath('paineis-exa'),
    },
    {
      icon: MoreHorizontal,
      label: 'Mais',
      isMoreButton: true,
    }
  ];

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === path;
    }
    // Verificar se está em alguma sub-rota relacionada
    const segment = path.split('/').pop() || '';
    return location.pathname.includes(segment);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-1">
        {navItems.map((item, idx) => {
          const active = item.path ? isActive(item.path) : false;
          const Icon = item.icon;

          // Botão "Mais" com dropdown
          if (item.isMoreButton) {
            return (
              <MobileMoreMenu
                key="more-menu"
                trigger={
                  <button
                    className={cn(
                      'flex flex-col items-center justify-center flex-1 h-full gap-1 py-2',
                      'transition-all duration-200 relative rounded-lg',
                      'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-5 w-5 transition-all" />
                    <span className="text-[10px] font-medium">
                      {item.label}
                    </span>
                  </button>
                }
              />
            );
          }

          // Itens normais de navegação
          return (
            <NavLink
              key={item.path || idx}
              to={item.path!}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 py-2',
                'transition-all duration-200 relative rounded-lg',
                active
                  ? 'text-[#9C1E1E]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {/* Indicador ativo - barra no topo */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#9C1E1E] rounded-full" />
              )}
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 transition-all',
                  active && 'scale-110'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#9C1E1E] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
