import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Activity, MessageSquare, Building2, Gift, MoreHorizontal, FileBarChart, CheckSquare, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useUserPermissions } from '@/hooks/useUserPermissions';
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
  const { buildPath } = useAdminBasePath();
  const { permissions, userInfo } = useUserPermissions();

  // Definir itens baseado na role do usuário
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      {
        icon: Home,
        label: 'Dashboard',
        path: buildPath(''),
      }
    ];

    // Itens específicos por role
    if (userInfo.isSuperAdmin) {
      items.push(
        {
          icon: ShoppingCart,
          label: 'Pedidos',
          path: buildPath('pedidos'),
        },
        {
          icon: Activity,
          label: 'Monitor',
          path: buildPath('monitoramento-ia'),
        },
        {
          icon: MessageSquare,
          label: 'CRM',
          path: buildPath('monitoramento-ia/conversas'),
        }
      );
    } else if (userInfo.isFinancialAdmin) {
      items.push(
        {
          icon: ShoppingCart,
          label: 'Pedidos',
          path: buildPath('pedidos'),
        },
        {
          icon: Gift,
          label: 'Benefícios',
          path: buildPath('beneficio-prestadores'),
        },
        {
          icon: FileBarChart,
          label: 'Relatórios',
          path: buildPath('relatorios-financeiros'),
        }
      );
    } else if (userInfo.isMarketingAdmin) {
      items.push(
        {
          icon: Building2,
          label: 'Prédios',
          path: buildPath('predios'),
        },
        {
          icon: Megaphone,
          label: 'Leads',
          path: buildPath('leads-exa'),
        }
      );
    } else if (userInfo.isAdmin) {
      items.push(
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
          icon: CheckSquare,
          label: 'Aprovações',
          path: buildPath('aprovacoes'),
        }
      );
    }

    // Botão "Mais" sempre no final
    items.push({
      icon: MoreHorizontal,
      label: 'Mais',
      isMoreButton: true,
    });

    return items;
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === buildPath('')) {
      return location.pathname === path;
    }
    return location.pathname.includes(path.split('/').pop() || '');
  };

  // EXA brand color for active state
  const activeColor = 'hsl(0, 67%, 37%)'; // #9C1E1E in HSL

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav-clean" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto px-1">
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
                      'flex flex-col items-center justify-center flex-1 h-full gap-0.5 py-1',
                      'transition-all duration-200 relative rounded-lg',
                      'text-muted-foreground hover:text-foreground hover:bg-black/5'
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
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 py-1',
                'transition-all duration-200 relative rounded-lg',
                active
                  ? 'text-[#9C1E1E]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 transition-all',
                  active && 'scale-105'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#9C1E1E] text-white text-[8px] font-bold flex items-center justify-center">
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
              {/* Active indicator - subtle top line */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#9C1E1E] rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
