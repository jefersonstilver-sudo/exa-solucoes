import React from 'react';
import {
  LayoutDashboard, 
  ShoppingBag, 
  Building2, 
  MonitorPlay, 
  Settings, 
  Users, 
  Shield,
  ShieldCheck,
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
  FileText,
  Scale,
  BarChart3,
  Landmark,
  Calendar,
  Network,
  Contact,
  LayoutGrid,
  Sunrise,
  TrendingUp,
  Cog,
  MessageCircle,
  CalendarDays,
  Lock,
  Timer,
  User as UserIcon,
  QrCode
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useDynamicModulePermissions, MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { Button } from '@/components/ui/button';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ADMIN_MENU, PAGINAS_OCULTAS, PAGINAS_OCULTAS_ATE, paginasOcultasAtivas, ALWAYS, type AdminMenuItem, type MenuBadgeKey } from './adminMenu';

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
import { useOfflineAlerts } from '@/hooks/useOfflineAlerts';

// Novos hooks para badges dinâmicos
import { usePedidosSemVideo } from '@/hooks/usePedidosSemVideo';
import { usePropostasAguardando } from '@/hooks/usePropostasAguardando';
import { useContratosPendentes } from '@/hooks/useContratosPendentes';
import { useBeneficiosAcaoNecessaria } from '@/hooks/useBeneficiosAcaoNecessaria';
import { usePendingVideosCount } from '@/hooks/usePendingVideosCount';
import { useSindicosNovosCount } from '@/hooks/useSindicosNovosCount';

export function ModernAdminSidebar() {
  const { state, open, setOpen, setOpenMobile, isMobile: isSidebarMobile } = useSidebar();
  const location = useLocation();
  const { userProfile, session, isSuperAdmin, logout } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const { basePath, buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsiveLayout();

  // Badges dinâmicos existentes
  const { offlineCount } = useOfflineAlerts();
  
  // Novos badges dinâmicos
  const { count: pedidosSemVideo } = usePedidosSemVideo();
  const { count: propostasAguardando } = usePropostasAguardando();
  const { count: contratosPendentes } = useContratosPendentes();
  const { count: beneficiosAcao } = useBeneficiosAcaoNecessaria();
  const { pendingCount: videosParaAprovar } = usePendingVideosCount();
  const { count: sindicosNovos } = useSindicosNovosCount();

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

  // Dynamic module permissions hook
  const { hasModuleAccess, isMasterAccount, isLoading: permissionsLoading } = useDynamicModulePermissions();

  // Menu único (adminMenu.ts) — o mesmo do "Mais" no celular
  const badgeValues: Record<MenuBadgeKey, number> = {
    offline: offlineCount,
    propostas: propostasAguardando,
    pedidosSemVideo,
    contratos: contratosPendentes,
    beneficios: beneficiosAcao,
    aprovacoes: videosParaAprovar,
    sindicosNovos,
  };

  const toNavItem = (item: AdminMenuItem) => {
    const value = item.badge ? badgeValues[item.badge] : 0;
    return {
      title: item.title,
      href: item.absolute ? item.path : (item.path ? buildPath(item.path) : basePath),
      icon: item.icon,
      moduleKey: item.moduleKey,
      badge: value > 0 ? value : undefined,
      badgeTooltip: item.badgeTooltip,
      badgePulse: item.badge === 'beneficios' && value > 0,
      superAdminOnly: item.superAdminOnly,
    };
  };

  const navigationGroups = ADMIN_MENU.map(group => ({
    label: group.label,
    icon: group.icon,
    items: group.items.map(toNavItem),
  }));

  const [ocultasAbertas, setOcultasAbertas] = React.useState(false);
  const mostrarOcultas = isMasterAccount && paginasOcultasAtivas();
  const paginasOcultas = mostrarOcultas
    ? PAGINAS_OCULTAS.filter(p => !p.superAdminOnly || isSuperAdmin).map(toNavItem)
    : [];

  // Filter items based on DYNAMIC MODULE PERMISSIONS from database
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.moduleKey === ALWAYS) return true;
      if (isMasterAccount) return true;
      return hasModuleAccess(item.moduleKey);
    })
  })).filter(group => group.items.length > 0);

  const getAdminBadgeColor = () => {
    switch (userInfo.role) {
      case 'super_admin': return 'text-[#9C1E1E]';
      case 'admin': return 'text-blue-600';
      case 'admin_marketing': return 'text-orange-600';
      case 'admin_financeiro': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAdminTitle = () => {
    if (userInfo.role === 'super_admin') return 'CEO / Diretoria';
    // Priority: department name > role label
    const dept = userProfile?.departamento;
    const deptName = typeof dept === 'object' && dept?.name ? dept.name : (typeof dept === 'string' ? dept : null);
    if (deptName) return deptName;
    // Fallback for roles without department
    if (userInfo.role === 'admin') return 'Coordenação';
    switch (userInfo.role) {
      case 'admin_marketing': return 'Marketing';
      case 'admin_financeiro': return 'Financeiro';
      case 'comercial': return 'Comercial';
      default: return 'Admin';
    }
  };

  const collapsed = isMobile ? false : state === "collapsed";

  const renderItem = (item: ReturnType<typeof toNavItem>) => {
                    const isExactMatch = location.pathname === item.href;
                    const isSubRoute = item.href !== basePath && 
                      location.pathname.startsWith(item.href + '/');
                    const isActive = isExactMatch || isSubRoute;
                    const Icon = item.icon;
                    const { badge, badgePulse, badgeTooltip } = item;

                    const linkContent = (
                      <NavLink
                        to={item.href}
                        className={`flex items-center ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2 gap-3'} rounded-xl transition-all duration-300 font-medium group relative h-10 ${
                          isActive 
                            ? "bg-white/20 text-white shadow-lg shadow-black/10 backdrop-blur-sm border border-white/20" 
                            : "text-white/70 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm active:scale-[0.98]"
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
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center cursor-help shadow-lg backdrop-blur-sm ${badgePulse ? 'animate-pulse ring-2 ring-white/30' : ''}`}>
                                      {badge}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#2D0A0A] text-white border-white/10 text-xs max-w-[200px] backdrop-blur-lg">
                                    {badgeTooltip || item.title}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </>
                        )}
                        {collapsed && badge !== undefined && (
                          <span className={`absolute -top-1 -right-1 bg-white/30 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm ${badgePulse ? 'animate-pulse ring-2 ring-white/30' : ''}`}>
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
                              <TooltipContent side="right" className="bg-[#2D0A0A] text-white border-white/10 font-medium backdrop-blur-lg">
                                  <div className="flex flex-col gap-1">
                                    <p className="font-semibold">{item.title}</p>
                                    {badge !== undefined && badgeTooltip && (
                                      <p className="text-[10px] text-white/70">{badgeTooltip}</p>
                                    )}
                                    {badge !== undefined && (
                                      <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full w-fit">
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
  };

  return (
    <Sidebar 
      className="h-screen bg-gradient-to-b from-[#7D1818] via-[#9C1E1E] to-[#5C1515] border-r border-white/10 shadow-2xl overscroll-contain backdrop-blur-xl"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : isTablet ? "sidebar" : "sidebar"}
      style={{ 
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        boxShadow: '4px 0 30px rgba(156, 30, 30, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
    >
      {/* Header - Red Glass Elevado */}
      <SidebarHeader className={`${collapsed ? 'p-3' : 'p-4 md:p-5'} border-b border-white/10 bg-white/5 backdrop-blur-sm`}>
        <div className="flex items-center justify-center mb-3">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={collapsed ? "w-10 h-10" : "w-14 h-14 md:w-20 md:h-20"}
          />
        </div>
        
        {!collapsed && (
          <div className="text-center">
            <div className="text-white/90 font-semibold text-sm tracking-wide">
              {userProfile?.departamento?.name ? `Painel ${userProfile.departamento.name}` : 'Painel Administrativo'}
            </div>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Crown className="h-3 w-3 text-amber-300" />
              <span className="text-[10px] font-medium text-amber-300/90">
                {getAdminTitle()}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent 
        className={`${collapsed ? 'px-2' : 'px-3'} py-4 space-y-2 overflow-y-auto admin-sidebar-scroll touch-pan-y overscroll-contain`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' /* EXA-MOBILE-FIX */
        }}
      >
        {filteredGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2 flex items-center gap-2">
                  <GroupIcon className="h-3 w-3" />
                  {group.label}
                </SidebarGroupLabel>
              )}
              
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {group.items.map(renderItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
        {paginasOcultas.length > 0 && !collapsed && (
          <SidebarGroup>
            <button
              type="button"
              onClick={() => setOcultasAbertas(v => !v)}
              className="w-full text-left text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 flex items-center justify-between hover:text-white/70"
              aria-expanded={ocultasAbertas}
            >
              <span>Páginas antigas</span>
              <span className="normal-case tracking-normal font-medium">{ocultasAbertas ? 'fechar' : `até ${PAGINAS_OCULTAS_ATE.split('-').reverse().slice(0, 2).join('/')}`}</span>
            </button>
            {ocultasAbertas && (
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 opacity-80">
                  {paginasOcultas.map(renderItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>
      
      {/* Footer - Red Glass */}
      <SidebarFooter className="mt-auto p-3 border-t border-white/10 bg-black/10 backdrop-blur-sm">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <button
            onClick={() => navigate(buildPath('meu-perfil'))}
            className="flex-shrink-0"
          >
            <Avatar className="h-9 w-9 ring-2 ring-white/30 shadow-lg cursor-pointer hover:ring-amber-300/50 transition-all">
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm backdrop-blur-sm">
                {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
          </button>
          
          {!collapsed && (
            <button
              onClick={() => navigate(buildPath('meu-perfil'))}
              className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-[10px] text-white/50">
                {getAdminTitle()} · Meu Perfil
              </p>
            </button>
          )}
          
          {!collapsed && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSignOut}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#2D0A0A] text-white border-white/10 backdrop-blur-lg">
                  Sair
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {collapsed && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 mt-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#2D0A0A] text-white border-white/10 backdrop-blur-lg">
                Sair
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default ModernAdminSidebar;
