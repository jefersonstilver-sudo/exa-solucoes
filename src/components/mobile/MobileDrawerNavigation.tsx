
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  ShoppingBag, 
  Video, 
  BarChart3, 
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileDrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    email?: string;
    name?: string;
  };
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  divider?: boolean;
}

const MobileDrawerNavigation = ({ 
  isOpen, 
  onClose, 
  userProfile,
  onLogout 
}: MobileDrawerNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/anunciante/perfil',
      divider: true
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      path: '/anunciante/configuracoes'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/anunciante' && location.pathname.startsWith(path));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indexa-purple text-white">
                      {userProfile?.name?.[0] || userProfile?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {userProfile?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {userProfile?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <div key={item.id}>
                      <motion.button
                        onClick={() => handleNavigation(item.path)}
                        className={cn(
                          'w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors',
                          'touch-target text-left',
                          active
                            ? 'bg-indexa-purple/10 text-indexa-purple border-r-2 border-indexa-purple'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={cn(
                          'h-5 w-5',
                          active ? 'text-indexa-purple' : 'text-gray-500'
                        )} />
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                      
                      {item.divider && (
                        <div className="my-2 border-t border-gray-200" />
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawerNavigation;
