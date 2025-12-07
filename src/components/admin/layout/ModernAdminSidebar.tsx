import React, { useMemo } from 'react';
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
  Mail,
  LogOut,
  Zap,
  Film,
  Gift,
  UsersRound,
  FileBarChart,
  Tv,
  Clapperboard,
  Brain,
  MessageSquare,
  CreditCard,
  Bot,
  AlertTriangle,
  Star,
  FileText,
  Scale,
  Sun,
  Moon
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

// Hooks para badges dinâmicos
import { useUnreadCount } from '@/modules/monitoramento-ia/hooks/useUnreadCount';
import { useEscalacoesPendentes } from '@/hooks/useEscalacoesPendentes';
import { useOfflineAlerts } from '@/hooks/useOfflineAlerts';
import { useSidebarFavorites } from '@/hooks/useSidebarFavorites';
import { SidebarFavoritesStar } from './SidebarFavoritesStar';
import { useTheme } from '@/components/ui/theme-provider';
import { ThemeToggle } from './ThemeToggle';

export function ModernAdminSidebar() {
  const { state, open, setOpen, setOpenMobile, isMobile: isSidebarMobile } = useSidebar();
  const location = useLocation();
  const { userProfile, session, isSuperAdmin, logout } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const { basePath, buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsiveLayout();

  // Badges dinâmicos
  const { unreadCount } = useUnreadCount();
  const { pendentesCount: escalacoesPendentes } = useEscalacoesPendentes();
  const { offlineCount } = useOfflineAlerts();
  
  // Favorites system
  const { favorites, toggleFavorite, isFavorite } = useSidebarFavorites();

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

  // 7 SEÇÕES REORGANIZADAS conforme especificação
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
          title: 'Sync Notion',
          href: buildPath('sync-notion'),
          icon: Building2,
          permission: 'canManageBuildings',
          badge: '🔄',
          badgeColor: 'bg-blue-500'
        },
        {
          title: 'Pedidos',
          href: buildPath('pedidos'),
          icon: ShoppingBag,
          permission: 'canViewOrders'
        },
        {
          title: 'Propostas',
          href: buildPath('propostas'),
          icon: FileText,
          permission: 'canViewOrders'
        },
        {
          title: 'Jurídico',
          href: buildPath('juridico'),
          icon: Scale,
          permission: 'canViewOrders'
        },
        {
          title: 'Assinaturas',
          href: buildPath('assinaturas'),
          icon: CreditCard,
          permission: 'canViewOrders'
        },
        {
          title: 'Aprovações',
          href: buildPath('aprovacoes'),
          icon: CheckSquare,
          permission: 'canViewApprovals'
        },
        {
          title: 'Cupons',
          href: buildPath('cupons'),
          icon: Ticket,
          permission: 'canManageCoupons'
        },
        {
          title: 'Benefícios Prestadores',
          href: buildPath('beneficio-prestadores'),
          icon: Gift,
          permission: 'canManageProviderBenefits'
        }
      ]
    },
    {
      label: 'CRM',
      items: [
        {
          title: 'CRM Site',
          href: buildPath('crm'),
          icon: UsersRound,
          permission: 'canViewCRM'
        },
        {
          title: 'CRM Chat',
          href: buildPath('crm-chat'),
          icon: MessageSquare,
          permission: 'canViewCRM',
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-green-500'
        },
        {
          title: 'Escalações',
          href: buildPath('escalacoes'),
          icon: AlertTriangle,
          permission: 'canViewCRM',
          badge: escalacoesPendentes > 0 ? escalacoesPendentes : undefined,
          badgeColor: 'bg-orange-500'
        }
      ]
    },
    {
      label: 'Inteligência',
      items: [
        {
          title: 'Agentes Sofia',
          href: buildPath('agentes-sofia'),
          icon: Bot,
          permission: 'canManageSystemSettings',
          requireSuperAdmin: true
        },
        {
          title: 'EXA Alerts',
          href: buildPath('exa-alerts'),
          icon: Brain,
          permission: 'canManageSystemSettings',
          requireSuperAdmin: true
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
          title: 'Painéis EXA',
          href: buildPath('paineis-exa'),
          icon: Tv,
          permission: 'canManagePanels',
          badge: offlineCount > 0 ? offlineCount : undefined,
          badgeColor: 'bg-red-500'
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
      label: 'Conteúdo',
      items: [
        {
          title: 'Vídeos Anunciantes',
          href: buildPath('videos'),
          icon: Video,
          permission: 'canManageVideos'
        },
        {
          title: 'Vídeos Site EXA',
          href: buildPath('videos-site'),
          icon: Film,
          permission: 'canManagePortfolio'
        },
        {
          title: 'Ticker',
          href: buildPath('ticker'),
          icon: Images,
          permission: 'canManageHomepageConfig'
        },
        {
          title: 'Editor de Vídeos',
          href: buildPath('editor-video-controle'),
          icon: Clapperboard,
          permission: 'canManageSystemSettings',
          requireSuperAdmin: true,
          badge: 'BETA',
          badgeColor: 'bg-purple-500'
        },
        {
          title: 'Emails',
          href: buildPath('comunicacoes'),
          icon: Mail,
          permission: 'canManageEmails'
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
          title: 'Notificações',
          href: buildPath('notificacoes'),
          icon: Bell,
          permission: 'canManageNotifications'
        },
        {
          title: 'Relatórios Financeiros',
          href: buildPath('relatorios-financeiros'),
          icon: FileBarChart,
          permission: 'canViewFinancialReports'
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
    }
  ];

  // Filter items based on permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const hasPermission = !item.permission || permissions[item.permission as keyof typeof permissions];
      return hasPermission;
    })
  })).filter(group => group.items.length > 0);

  // Get favorite items from all groups
  const favoriteItems = useMemo(() => {
    const allItems = filteredGroups.flatMap(g => g.items);
    return favorites
      .map(href => allItems.find(item => item.href === href))
      .filter(Boolean) as typeof allItems;
  }, [favorites, filteredGroups]);

  const getAdminBadgeColor = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'text-amber-200';
      case 'admin': return 'text-blue-300';
      case 'admin_marketing': return 'text-orange-300';
      case 'admin_financeiro': return 'text-green-300';
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

  const collapsed = isMobile ? false : state === "collapsed";

  return (
    <Sidebar 
      className="h-screen bg-gradient-to-b from-[#1A0A0A] via-[#2D1515] to-[#3D1F1F] border-r border-red-900/20 shadow-2xl overscroll-contain"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : isTablet ? "sidebar" : "sidebar"}
      style={{ 
        backgroundColor: '#1A0A0A',
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <SidebarHeader className={`${collapsed ? 'p-3' : 'p-4 md:p-5'} border-b border-red-900/30 bg-[#1A0A0A]/95 backdrop-blur-sm`}>
        <div className="flex items-center justify-center mb-3">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={collapsed ? "w-10 h-10" : "w-14 h-14 md:w-20 md:h-20"}
          />
        </div>
        
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-xs truncate">
                {userProfile?.email?.split('@')[0] || 'Admin'}
              </div>
              <div className="flex items-center space-x-1 mt-0.5">
                <Crown className={`h-3 w-3 ${getAdminBadgeColor()}`} />
                <span className={`text-[10px] font-medium ${getAdminBadgeColor()} truncate`}>
                  {getAdminTitle()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 rounded-full hover:bg-white/10 touch-target">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white font-semibold text-xs">
                        {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#2D1515] border-red-900/30" align="end">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-white">{userProfile?.email || 'Admin'}</p>
                    <p className="text-xs text-red-200/60">{getAdminTitle()}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-red-900/30" />
                  {isSuperAdmin && (
                    <DropdownMenuItem 
                      onClick={() => navigate(buildPath('configuracoes'))}
                      className="text-red-100/80 hover:text-white hover:bg-red-500/15"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-red-900/30" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/15"
                  >
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
        className={`${collapsed ? 'px-2' : 'px-3'} py-4 space-y-3 overflow-y-auto admin-sidebar-scroll touch-pan-y overscroll-contain`}
        style={{ 
          background: 'linear-gradient(180deg, #1A0A0A 0%, #2D1515 50%, #3D1F1F 100%)',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)'
        }}
      >
        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest mb-2 px-2 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400/70" />
                Favoritos
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {favoriteItems.map((item) => {
                  const isExactMatch = location.pathname === item.href;
                  const isSubRoute = item.href !== basePath && location.pathname.startsWith(item.href + '/');
                  const isActive = isExactMatch || isSubRoute;
                  const Icon = item.icon;
                  const badge = (item as any).badge;
                  const badgeColor = (item as any).badgeColor || 'bg-red-500';

                  return (
                    <SidebarMenuItem key={`fav-${item.href}`}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.href}
                          className={`flex items-center ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2 gap-3'} rounded-lg transition-all duration-200 font-medium group relative h-10 ${
                            isActive 
                              ? "bg-amber-500/10 text-white border-l-[3px] border-amber-500 rounded-l-none" 
                              : "text-amber-100/80 hover:bg-amber-500/10 hover:text-white active:scale-[0.98]"
                          } touch-manipulation`}
                          onClick={() => {
                            if (isMobile || isSidebarMobile) {
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <Icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
                          {!collapsed && (
                            <>
                              <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                              {badge !== undefined && (
                                <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                                  {badge}
                                </span>
                              )}
                              <SidebarFavoritesStar
                                isFavorite={true}
                                onToggle={() => toggleFavorite(item.href)}
                                collapsed={collapsed}
                              />
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] font-bold text-red-300/50 uppercase tracking-widest mb-2 px-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
              {group.items.map((item) => {
                  // Lógica melhorada para evitar seleção dupla
                  // Ex: /super_admin/crm-chat NÃO deve ativar /super_admin/crm
                  const isExactMatch = location.pathname === item.href;
                  const isSubRoute = item.href !== basePath && 
                    location.pathname.startsWith(item.href + '/');
                  const isActive = isExactMatch || isSubRoute;
                  const Icon = item.icon;
                  const badge = (item as any).badge;
                  const badgeColor = (item as any).badgeColor || 'bg-red-500';

                  const linkContent = (
                    <NavLink
                      to={item.href}
                      className={`flex items-center ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2 gap-3'} rounded-lg transition-all duration-200 font-medium group relative h-10 ${
                        isActive 
                          ? "bg-red-500/10 text-white border-l-[3px] border-red-500 rounded-l-none" 
                          : "text-red-100/80 hover:bg-red-500/10 hover:text-white active:scale-[0.98]"
                      } touch-manipulation`}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onClick={() => {
                        if (isMobile || isSidebarMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <Icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 transition-transform duration-200`} />
                        {!collapsed && (
                          <>
                            <span className="text-sm font-medium truncate flex-1">
                              {item.title}
                            </span>
                            {badge !== undefined && (
                              <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                                {badge}
                              </span>
                            )}
                            <SidebarFavoritesStar
                              isFavorite={isFavorite(item.href)}
                              onToggle={() => toggleFavorite(item.href)}
                              collapsed={collapsed}
                            />
                          </>
                        )}
                      {collapsed && badge !== undefined && (
                        <span className={`absolute -top-1 -right-1 ${badgeColor} text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center`}>
                          {typeof badge === 'number' && badge > 9 ? '9+' : badge}
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
                              <TooltipContent side="right" className="bg-[#1A1A1A] text-white border-white/10 font-medium">
                                <div className="flex items-center gap-2">
                                  <p>{item.title}</p>
                                  {badge !== undefined && (
                                    <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                                      {badge}
                                    </span>
                                  )}
                                </div>
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
      
      <SidebarFooter className="p-2 border-t border-white/10 bg-[#0F0F0F]/95 backdrop-blur-sm">
        <ThemeToggle collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default ModernAdminSidebar;
