
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  Video, 
  BarChart3, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

interface MobileBottomNavigationProps {
  userRole?: 'client' | 'admin' | 'super_admin';
}

const MobileBottomNavigation = ({ userRole = 'client' }: MobileBottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        id: 'dashboard',
        label: 'Início',
        icon: Home,
        path: '/anunciante'
      },
      {
        id: 'orders',
        label: 'Pedidos',
        icon: ShoppingBag,
        path: '/anunciante/pedidos'
      },
      {
        id: 'videos',
        label: 'Vídeos',
        icon: Video,
        path: '/anunciante/videos'
      },
      {
        id: 'profile',
        label: 'Perfil',
        icon: User,
        path: '/anunciante/perfil'
      }
    ];

    return baseItems;
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/anunciante' && location.pathname.startsWith(path));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 relative',
                'transition-colors duration-200',
                active 
                  ? 'text-indexa-purple' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-indexa-purple rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5',
                  active ? 'text-indexa-purple' : 'text-gray-500'
                )} />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </div>
              
              <span className={cn(
                'text-xs font-medium',
                active ? 'text-indexa-purple' : 'text-gray-500'
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNavigation;
