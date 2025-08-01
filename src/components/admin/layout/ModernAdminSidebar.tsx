
import React from 'react';
import { useLocation } from 'react-router-dom';
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
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const ModernAdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();

  const navigationGroups = [
    {
      label: 'Dashboard',
      items: [
        {
          title: 'Dashboard',
          href: '/super_admin',
          icon: LayoutDashboard,
        }
      ]
    },
    {
      label: 'Gestão de Conteúdo',
      items: [
        {
          title: 'Prédios',
          href: '/super_admin/predios',
          icon: Building2,
        },
        {
          title: 'Painéis',
          href: '/super_admin/paineis',
          icon: Monitor,
        },
        {
          title: 'Vídeos',
          href: '/super_admin/videos',
          icon: Play,
        },
        {
          title: 'Config Homepage',
          href: '/super_admin/homepage-config',
          icon: ImageIcon,
        }
      ]
    },
    {
      label: 'Vendas & Usuários',
      items: [
        {
          title: 'Pedidos',
          href: '/super_admin/pedidos',
          icon: ShoppingCart,
        },
        {
          title: 'Usuários',
          href: '/super_admin/usuarios',
          icon: Users,
        },
        {
          title: 'Cupons',
          href: '/super_admin/cupons',
          icon: Ticket,
        }
      ]
    },
    {
      label: 'Leads & Aprovações',
      items: [
        {
          title: 'Aprovações',
          href: '/super_admin/aprovacoes',
          icon: CheckSquare,
        },
        {
          title: 'Síndicos Interessados',
          href: '/super_admin/sindicos-interessados',
          icon: UserCheck,
        },
        {
          title: 'Leads Produtora',
          href: '/super_admin/leads-produtora',
          icon: Coffee,
        }
      ]
    },
    {
      label: 'Sistema',
      items: [
        {
          title: 'Notificações',
          href: '/super_admin/notificacoes',
          icon: Bell,
        },
        {
          title: 'Configurações',
          href: '/super_admin/configuracoes',
          icon: Settings,
        }
      ]
    }
  ];

  return (
    <Sidebar 
      variant="sidebar" 
      className="border-r border-sidebar-border bg-gradient-to-b from-indexa-purple to-purple-700"
    >
      <SidebarHeader className="border-b border-white/10 p-6">
        <div className="flex items-center justify-center mb-2">
          <UnifiedLogo 
            size="custom"
            linkTo="/"
            variant="light"
            className={cn(
              "transition-all duration-300",
              state === "collapsed" ? "w-8 h-8" : "w-16 h-16"
            )}
          />
        </div>
        {state !== "collapsed" && (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">INDEXA</h2>
            <p className="text-xs text-white/70">Admin Panel</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-white/80 font-medium text-xs uppercase tracking-wider">
              {state === "collapsed" ? "" : group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200",
                          isActive && "bg-white/20 text-white font-medium shadow-lg"
                        )}
                        tooltip={state === "collapsed" ? item.title : undefined}
                      >
                        <a href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <div className={cn(
          "text-xs text-white/60",
          state === "collapsed" ? "text-center" : ""
        )}>
          {state === "collapsed" ? "v2.0" : "INDEXA Admin v2.0"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ModernAdminSidebar;
