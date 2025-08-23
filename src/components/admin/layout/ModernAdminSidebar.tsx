import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Building2, 
  MonitorPlay, 
  Settings, 
  Users, 
  Shield,
  Crown,
  Video,
  Images,
  CheckSquare,
  UserCheck,
  Coffee,
  Ticket,
  Bell,
  Megaphone,
  LogOut,
  Zap,
  Film
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function ModernAdminSidebar() {
  const { state, open, setOpen } = useSidebar();
  const location = useLocation();
  const { userProfile, session, isSuperAdmin, logout } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const { basePath, buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsiveLayout();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  const navigationGroups = [
    {
      label: 'Gestão Principal',
      items: [
        {
          title: 'Dashboard',
          href: basePath,
          icon: LayoutDashboard,
          permission: 'canViewDashboard'
        },
        {
          title: 'Pedidos',
          href: buildPath('pedidos'),
          icon: ShoppingBag,
          permission: 'canViewOrders'
        },
        {
          title: 'Aprovações',
          href: buildPath('aprovacoes'),
          icon: CheckSquare,
          permission: 'canViewApprovals'
        }
      ]
    },
    {
      label: 'Ativos',
      items: [
        {
          title: 'Prédios',
          href: buildPath('predios'),
          icon: Building2,
          permission: 'canManageBuildings'
        },
        {
          title: 'Painéis',
          href: buildPath('paineis'),
          icon: MonitorPlay,
          permission: 'canManagePanels'
        }
      ]
    },
    {
      label: 'Leads & Clientes',
      items: [
        {
          title: 'Síndicos Interessados',
          href: buildPath('sindicos-interessados'),
          icon: UserCheck,
          permission: 'canViewSindicosInteressados'
        },
        {
          title: 'Leads Produtora',
          href: buildPath('leads-produtora'),
          icon: Coffee,
          permission: 'canViewLeadsProdutora'
        },
        {
          title: 'Leads LINKAÊ',
          href: buildPath('leads-linkae'),
          icon: Megaphone,
          permission: 'canViewLeadsLinkae'
        },
        {
          title: 'Leads EXA',
          href: buildPath('leads-exa'),
          icon: Zap,
          permission: 'canViewLeadsExa'
        }
      ]
    },
    {
      label: 'Sistema',
      items: [
        {
          title: 'Usuários',
          href: buildPath('usuarios'),
          icon: Users,
          permission: 'canManageUsers',
          requireSuperAdmin: true
        },
        {
          title: 'Cupons',
          href: buildPath('cupons'),
          icon: Ticket,
          permission: 'canManageCoupons'
        },
        {
          title: 'Homepage Config',
          href: buildPath('homepage-config'),
          icon: Images,
          permission: 'canManageHomepageConfig'
        },
        {
          title: 'Configurações',
          href: buildPath('configuracoes'),
          icon: Settings,
          permission: 'canManageSystemSettings',
          requireSuperAdmin: true
        }
      ]
    },
    {
      label: 'Conteúdo',
      items: [
        {
          title: 'Vídeos',
          href: buildPath('videos'),
          icon: Video,
          permission: 'canManageVideos'
        },
        {
          title: 'Portfólio Produtora',
          href: buildPath('portfolio-produtora'),
          icon: Film,
          permission: 'canManagePortfolio'
        },
        {
          title: 'Logos EXA',
          href: buildPath('logos'),
          icon: Images,
          permission: 'canManageHomepageConfig'
        },
        {
          title: 'Notificações',
          href: buildPath('notificacoes'),
          icon: Bell,
          permission: 'canManageNotifications'
        }
      ]
    }
  ];

  // Filter items based on permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.requireSuperAdmin && !isSuperAdmin) return false;
      if (item.permission && !permissions[item.permission as keyof typeof permissions]) return false;
      return true;
    })
  })).filter(group => group.items.length > 0);

  const getAdminBadgeColor = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'text-yellow-400';
      case 'admin': return 'text-blue-400';
      case 'admin_marketing': return 'text-purple-400';
      default: return 'text-indexa-mint';
    }
  };

  const getAdminTitle = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin Geral';
      case 'admin_marketing': return 'Admin Marketing';
      default: return 'Admin';
    }
  };

  const collapsed = state === "collapsed";

  // Auto-close on mobile when navigating
  React.useEffect(() => {
    if (isMobile && open) {
      const timer = setTimeout(() => setOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isMobile, open, setOpen]);

  return (
    <Sidebar 
      className="h-screen bg-gradient-to-b from-[#1e1b4b] via-[#4c1d95] to-[#7c3aed] border-r border-white/20 shadow-2xl"
      collapsible="icon"
      variant={isMobile ? "floating" : "sidebar"}
    >
      <SidebarHeader className="p-6 border-b border-white/20">
        <div className="flex items-center justify-center mb-4">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={collapsed ? "w-10 h-10" : "w-24 h-24"}
          />
        </div>
        
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-white font-semibold text-sm truncate">
                {userProfile?.email?.split('@')[0] || 'Admin'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Crown className={`h-3 w-3 ${getAdminBadgeColor()}`} />
                <span className={`text-xs font-medium ${getAdminBadgeColor()}`}>
                  {getAdminTitle()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white text-[#1e1b4b] font-semibold text-xs">
                        {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{userProfile?.email || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{getAdminTitle()}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isSuperAdmin && (
                    <DropdownMenuItem onClick={() => navigate(buildPath('configuracoes'))}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 space-y-6 overflow-y-auto admin-sidebar-scroll">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-violet-200 uppercase tracking-wider mb-3 px-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.href}
                          className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm group ${
                            isActive 
                              ? "bg-white !text-[#1e1b4b] font-bold shadow-lg hover:!bg-white hover:!text-[#1e1b4b]" 
                              : "text-white hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          <div className="mr-3 transition-transform duration-200 group-hover:scale-110">
                            <Icon className="h-5 w-5" />
                          </div>
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-2 text-white text-sm">
          <Shield className="h-4 w-4" />
          {!collapsed && <span>Sistema Seguro</span>}
        </div>
        {!collapsed && (
          <div className="text-xs text-white/60 mt-0.5">
            INDEXA Admin v3.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default ModernAdminSidebar;