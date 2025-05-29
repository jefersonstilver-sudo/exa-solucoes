
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  Video, 
  BarChart3, 
  User,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AdvertiserDesktopSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const AdvertiserDesktopSidebar = ({ 
  collapsed = false, 
  onToggle 
}: AdvertiserDesktopSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/anunciante'
    },
    {
      id: 'orders',
      label: 'Meus Pedidos',
      icon: ShoppingBag,
      path: '/anunciante/pedidos'
    },
    {
      id: 'videos',
      label: 'Meus Vídeos',
      icon: Video,
      path: '/anunciante/videos'
    },
    {
      id: 'campaigns',
      label: 'Minhas Campanhas',
      icon: BarChart3,
      path: '/anunciante/campanhas'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/anunciante/perfil'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/anunciante' && location.pathname.startsWith(path));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-white border-r border-gray-200 flex flex-col shadow-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-indexa-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="font-semibold text-gray-900">INDEXA</span>
            </motion.div>
          )}
          
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 hover:bg-gray-100"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.div key={item.id} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full justify-start h-12 px-3',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-indexa-purple/10 text-indexa-purple hover:bg-indexa-purple/20'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  !collapsed && 'mr-3',
                  active ? 'text-indexa-purple' : 'text-gray-500'
                )} />
                
                {!collapsed && (
                  <motion.span
                    initial={false}
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                
                {!collapsed && item.badge && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        {!collapsed && userProfile && (
          <motion.div
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-2 mb-2"
          >
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile.email}
            </p>
            <p className="text-xs text-gray-500">Anunciante</p>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed ? 'justify-center px-0' : 'justify-start px-3'
          )}
        >
          <LogOut className={cn(
            'h-5 w-5',
            !collapsed && 'mr-3'
          )} />
          {!collapsed && (
            <motion.span
              initial={false}
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              Sair
            </motion.span>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default AdvertiserDesktopSidebar;
