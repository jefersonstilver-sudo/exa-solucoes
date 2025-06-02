
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Video, 
  BarChart3, 
  User,
  Settings,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ModernAdvertiserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const ModernAdvertiserSidebar = ({ 
  isOpen, 
  onClose, 
  isMobile 
}: ModernAdvertiserSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/anunciante',
      icon: LayoutDashboard,
      description: 'Visão geral',
      exact: true
    },
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingBag,
      description: 'Acompanhe seus pedidos'
    },
    {
      title: 'Minhas Campanhas',
      href: '/anunciante/campanhas',
      icon: BarChart3,
      description: 'Gerencie campanhas'
    },
    {
      title: 'Meus Vídeos',
      href: '/anunciante/videos',
      icon: Video,
      description: 'Biblioteca de vídeos'
    },
    {
      title: 'Perfil',
      href: '/anunciante/perfil',
      icon: User,
      description: 'Configurações da conta'
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const sidebarContent = (
    <div className="h-full bg-gradient-to-br from-[#6B46C1] via-[#9333EA] to-[#A855F7] flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/20 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                alt="Indexa Logo" 
                className="w-6 h-6 object-contain filter brightness-0 invert"
              />
            </motion.div>
            <div>
              <h2 className="text-white font-bold text-lg">INDEXA</h2>
              <p className="text-white/80 text-xs">Portal do Anunciante</p>
            </div>
          </div>
          
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  'group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                  active
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Icon className={cn(
                  'h-5 w-5 transition-colors duration-200 relative z-10',
                  active ? 'text-white' : 'text-white/70 group-hover:text-white'
                )} />
                
                <div className="flex flex-col relative z-10">
                  <span className="font-medium">{item.title}</span>
                  <span className={cn(
                    'text-xs transition-colors duration-200',
                    active ? 'text-white/90' : 'text-white/60 group-hover:text-white/80'
                  )}>
                    {item.description}
                  </span>
                </div>
                
                {active && (
                  <motion.div
                    className="absolute right-3 w-1 h-8 bg-white/50 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20 space-y-3 relative z-10">
        {/* User Info */}
        {userProfile && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {userProfile.email}
                </p>
                <p className="text-white/70 text-xs">Anunciante</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 h-10"
            asChild
          >
            <Link to="/anunciante/configuracoes">
              <Settings className="h-4 w-4 mr-3" />
              Configurações
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 h-10"
          >
            <HelpCircle className="h-4 w-4 mr-3" />
            Suporte
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-200 hover:text-red-100 hover:bg-red-500/20 h-10"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="hidden lg:block fixed left-0 top-0 h-full w-80 z-30"
    >
      {sidebarContent}
    </motion.div>
  );
};

export default ModernAdvertiserSidebar;
