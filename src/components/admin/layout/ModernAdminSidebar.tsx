
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

  const mainManagementItems = [
    {
      title: 'Dashboard',
      href: '/super_admin',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema'
    },
    {
      title: 'Prédios',
      href: '/super_admin/predios',
      icon: Building2,
      description: 'Gestão de edifícios'
    },
    {
      title: 'Painéis',
      href: '/super_admin/paineis',
      icon: Monitor,
      description: 'Dispositivos de exibição'
    },
    {
      title: 'Pedidos',
      href: '/super_admin/pedidos',
      icon: ShoppingCart,
      description: 'Vendas e transações'
    }
  ];

  const activeItems = [
    {
      title: 'Aprovações',
      href: '/super_admin/aprovacoes',
      icon: CheckSquare,
      description: 'Aprovação de vídeos'
    },
    {
      title: 'Vídeos',
      href: '/super_admin/videos',
      icon: Play,
      description: 'Gestão de vídeos'
    }
  ];

  const leadsItems = [
    {
      title: 'Usuários',
      href: '/super_admin/usuarios',
      icon: Users,
      description: 'Gestão de usuários'
    },
    {
      title: 'Síndicos Interessados',
      href: '/super_admin/sindicos-interessados',
      icon: UserCheck,
      description: 'Leads de síndicos'
    },
    {
      title: 'Leads Produtora',
      href: '/super_admin/leads-produtora',
      icon: Coffee,
      description: 'Leads da produtora'
    }
  ];

  const systemItems = [
    {
      title: 'Cupons',
      href: '/super_admin/cupons',
      icon: Ticket,
      description: 'Códigos de desconto'
    },
    {
      title: 'Config Homepage',
      href: '/super_admin/homepage-config',
      icon: ImageIcon,
      description: 'Imagens da página inicial'
    },
    {
      title: 'Notificações',
      href: '/super_admin/notificacoes',
      icon: Bell,
      description: 'Central de notificações'
    },
    {
      title: 'Configurações',
      href: '/super_admin/configuracoes',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  const renderNavSection = (title: string, items: any[]) => (
    <div className="mb-8">
      {!isCollapsed && (
        <h3 className="px-3 mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
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
      </div>
    </div>
  );

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
              <p className="text-xs text-white/70">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {renderNavSection("GESTÃO PRINCIPAL", mainManagementItems)}
        {renderNavSection("ATIVOS", activeItems)}
        {renderNavSection("LEADS & CLIENTES", leadsItems)}
        {renderNavSection("SISTEMA", systemItems)}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-white/20",
        isCollapsed && "p-2"
      )}>
        <div className={cn(
          "text-xs text-white/60",
          isCollapsed ? "text-center" : ""
        )}>
          {isCollapsed ? "v2.0" : "INDEXA Admin v2.0"}
        </div>
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
