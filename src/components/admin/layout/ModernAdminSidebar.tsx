
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Monitor, 
  ShoppingCart, 
  CheckSquare, 
  Users, 
  UserCheck, 
  Ticket, 
  ImageIcon,
  Bell,
  Settings,
  Play,
  Camera,
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
}

const ModernAdminSidebar = ({ isCollapsed }: SidebarProps) => {
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema'
    },
    {
      title: 'Prédios',
      href: '/admin/predios',
      icon: Building2,
      description: 'Gestão de edifícios'
    },
    {
      title: 'Painéis',
      href: '/admin/paineis',
      icon: Monitor,
      description: 'Dispositivos de exibição'
    },
    {
      title: 'Pedidos',
      href: '/admin/pedidos',
      icon: ShoppingCart,
      description: 'Vendas e transações'
    },
    {
      title: 'Aprovações',
      href: '/admin/aprovacoes',
      icon: CheckSquare,
      description: 'Aprovação de vídeos'
    },
    {
      title: 'Usuários',
      href: '/admin/usuarios',
      icon: Users,
      description: 'Gestão de usuários'
    },
    {
      title: 'Síndicos Interessados',
      href: '/admin/sindicos-interessados',
      icon: UserCheck,
      description: 'Leads de síndicos'
    },
    {
      title: 'Leads Produtora',
      href: '/admin/leads-produtora',
      icon: Coffee,
      description: 'Leads da produtora'
    },
    {
      title: 'Cupons',
      href: '/admin/cupons',
      icon: Ticket,
      description: 'Códigos de desconto'
    },
    {
      title: 'Config Homepage',
      href: '/admin/homepage-config',
      icon: ImageIcon,
      description: 'Imagens da página inicial'
    },
    {
      title: 'Notificações',
      href: '/admin/notificacoes',
      icon: Bell,
      description: 'Central de notificações'
    },
    {
      title: 'Vídeos',
      href: '/admin/videos',
      icon: Play,
      description: 'Gestão de vídeos'
    },
    {
      title: 'Configurações',
      href: '/admin/configuracoes',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">I</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">INDEXA</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
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
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-indexa-purple text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-100 hover:text-indexa-purple"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isActive ? "text-white" : "text-gray-400 group-hover:text-indexa-purple",
                isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
              )} />
              
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  <span className={cn(
                    "text-xs transition-colors duration-200",
                    isActive ? "text-white/80" : "text-gray-500"
                  )}>
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "text-xs text-gray-500",
          isCollapsed ? "text-center" : ""
        )}>
          {isCollapsed ? "v2.0" : "INDEXA Admin v2.0"}
        </div>
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
