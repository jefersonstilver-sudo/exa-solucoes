
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Video, 
  BarChart3, 
  Settings, 
  LogOut,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

const AdvertiserSidebarContent = ({ 
  onItemClick, 
  isCollapsed = false 
}: AdvertiserSidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/anunciante',
      icon: LayoutDashboard,
      description: 'Visão geral'
    },
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingCart,
      description: 'Gerenciar pedidos'
    },
    {
      title: 'Meus Vídeos',
      href: '/anunciante/videos',
      icon: Video,
      description: 'Biblioteca de vídeos'
    },
    {
      title: 'Relatórios',
      href: '/anunciante/relatorios',
      icon: BarChart3,
      description: 'Métricas e dados'
    },
    {
      title: 'Painéis Digitais',
      href: '/paineis-digitais/loja',
      icon: Monitor,
      description: 'Comprar painéis'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onItemClick?.();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-indexa-purple to-indexa-purple-dark text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className={cn(
        "p-6 border-b border-white/20",
        isCollapsed && "p-4"
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-indexa-purple font-bold text-sm">I</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold">INDEXA</h2>
              <p className="text-xs text-white/70">Portal do Anunciante</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isActive ? "text-white" : "text-white/70 group-hover:text-white",
                isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
              )} />
              
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.title}</span>
                  <span className={cn(
                    "text-xs transition-colors duration-200 truncate",
                    isActive ? "text-white/80" : "text-white/60"
                  )}>
                    {item.description}
                  </span>
                </div>
              )}

              {/* Tooltip para modo collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center px-3 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 w-full group relative",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className={cn(
            "h-4 w-4 text-white/70 group-hover:text-white transition-colors duration-200",
            !isCollapsed && "mr-3"
          )} />
          {!isCollapsed && <span>Sair</span>}

          {/* Tooltip para modo collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sair
            </div>
          )}
        </button>

        {!isCollapsed && (
          <div className="mt-4 text-xs text-white/60 text-center">
            INDEXA Portal v2.0
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertiserSidebarContent;
