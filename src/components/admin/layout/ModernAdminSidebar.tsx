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
  Ticket,
  Bell,
  Megaphone,
  LogOut,
  Zap,
  Film,
  Gift,
  UsersRound,
  FileBarChart
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          title: 'CRM Clientes',
          href: buildPath('crm'),
          icon: UsersRound,
          permission: 'canViewCRM' // ✅ CORRIGIDO: Permissão específica
        },
        {
          title: 'Aprovações',
          href: buildPath('aprovacoes'),
          icon: CheckSquare,
          permission: 'canViewApprovals'
        },
        {
          title: 'Benefício Prestadores',
          href: buildPath('beneficio-prestadores'),
          icon: Gift,
          permission: 'canManageProviderBenefits'
        },
        {
          title: 'Relatórios Financeiros',
          href: buildPath('relatorios-financeiros'),
          icon: FileBarChart,
          permission: 'canViewFinancialReports'
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
          title: 'Segurança',
          href: buildPath('seguranca'),
          icon: Shield,
          permission: 'canManageSystemSettings',
          requireSuperAdmin: true
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
          title: 'Vídeos do Site',
          href: buildPath('videos-site'),
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
      const hasSuperAdminAccess = !item.requireSuperAdmin || isSuperAdmin;
      const hasPermission = !item.permission || permissions[item.permission as keyof typeof permissions];
      
      if (!hasSuperAdminAccess) return false;
      if (!hasPermission) return false;
      return true;
    })
  })).filter(group => group.items.length > 0);

  const getAdminBadgeColor = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'text-yellow-400';
      case 'admin': return 'text-blue-400';
      case 'admin_marketing': return 'text-orange-400';
      case 'admin_financeiro': return 'text-green-400';
      default: return 'text-indexa-mint';
    }
  };

  const getAdminTitle = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin Geral';
      case 'admin_marketing': return 'Admin Marketing';
      case 'admin_financeiro': return 'Admin Financeiro';
      default: return 'Admin';
    }
  };

  // CRITICAL: Forçar sidebar expandido no mobile para mostrar textos
  const collapsed = isMobile ? false : state === "collapsed";

  // Remover auto-close automático - usuário fecha manualmente ou ao clicar em link
  // React.useEffect(() => {
  //   if (isMobile && open) {
  //     setOpen(false);
  //   }
  // }, [location.pathname, isMobile, setOpen]);

  return (
    <Sidebar 
      className="h-screen bg-gradient-to-b from-[#180A0A] via-[#3B1E1E] to-[#9C1E1E] border-r border-white/20 shadow-2xl"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : isTablet ? "sidebar" : "sidebar"}
      style={{ backgroundColor: '#180A0A' }}
    >
      <SidebarHeader className={`${collapsed ? 'p-3' : 'p-4 md:p-6'} border-b border-white/20 bg-[#180A0A]`}>
        <div className="flex items-center justify-center mb-3 md:mb-4">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={collapsed ? "w-12 h-12 md:w-14 md:h-14" : "w-16 h-16 md:w-24 md:h-24"}
          />
        </div>
        
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-xs md:text-sm truncate">
                {userProfile?.email?.split('@')[0] || 'Admin'}
              </div>
              <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                <Crown className={`h-3 w-3 ${getAdminBadgeColor()}`} />
                <span className={`text-[10px] md:text-xs font-medium ${getAdminBadgeColor()} truncate`}>
                  {getAdminTitle()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20 touch-target">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white text-[#9C1E1E] font-semibold text-xs">
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

      <SidebarContent 
        className={`${collapsed ? 'px-2' : 'px-3 md:px-4'} py-4 md:py-6 space-y-4 md:space-y-6 overflow-y-auto admin-sidebar-scroll`}
        style={{ 
          background: 'linear-gradient(180deg, #180A0A 0%, #3B1E1E 50%, #9C1E1E 100%)',
          backgroundColor: '#180A0A'
        }}
      >
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] md:text-xs font-semibold text-red-200 uppercase tracking-wider mb-2 md:mb-3 px-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            
             <SidebarGroupContent>
               <SidebarMenu className="space-y-1">
                 {group.items.map((item) => {
                   const isActive = location.pathname === item.href;
                   const Icon = item.icon;

                    const linkContent = (
                      <NavLink
                        to={item.href}
                        className={`flex flex-row items-center ${collapsed ? 'px-3 py-3 gap-0 justify-center' : 'px-4 py-4 gap-3'} rounded-xl transition-all duration-200 font-medium group touch-target ${
                          isActive 
                            ? "bg-white !text-[#9C1E1E] font-bold shadow-lg hover:!bg-white hover:!text-[#9C1E1E]" 
                            : "text-white hover:bg-white/20 hover:text-white"
                        }`}
                        onClick={() => {
                          // Auto-fechar sidebar no mobile após clicar
                          if (isMobile) {
                            setOpen(false);
                          }
                        }}
                      >
                        <Icon className={`${collapsed ? 'h-5 w-5' : isMobile ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
                        {!collapsed && (
                          <span className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold truncate`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    );

                   return (
                     <SidebarMenuItem key={item.href}>
                       <SidebarMenuButton asChild>
                         {collapsed ? (
                           <TooltipProvider delayDuration={0}>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 {linkContent}
                               </TooltipTrigger>
                               <TooltipContent side="right" className="bg-white text-[#9C1E1E] font-semibold">
                                 <p>{item.title}</p>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         ) : (
                           linkContent
                         )}
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   );
                 })}
               </SidebarMenu>
             </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className={`${collapsed ? 'p-2' : 'p-3 md:p-4'} border-t border-white/20 bg-[#9C1E1E]`}>
        <div className="flex items-center space-x-2 text-white text-xs md:text-sm">
          <Shield className={`${collapsed ? 'h-4 w-4' : 'h-3 w-3 md:h-4 md:w-4'} flex-shrink-0`} />
          <span className={`${collapsed ? 'text-[9px]' : 'text-xs'} truncate whitespace-nowrap`}>Sistema Seguro</span>
        </div>
        <div className={`${collapsed ? 'text-[8px]' : 'text-[10px] md:text-xs'} text-white/60 mt-0.5 truncate`}>
          INDEXA Admin v3.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default ModernAdminSidebar;
