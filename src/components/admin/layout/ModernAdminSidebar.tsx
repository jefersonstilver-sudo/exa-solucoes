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
    beneficios: 0,
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
      badgePulse: false,
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
                        className={`group relative flex h-10 items-center rounded-xl transition-colors ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                          isActive ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                        } touch-manipulation`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        onClick={() => { if (isMobile || isSidebarMobile) setOpenMobile(false); }}
                      >
                        {isActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E8352B]" />}
                        <Icon className={`${collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-[#FF6B61]' : ''}`} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-[13.5px] font-semibold">{item.title}</span>
                            {badge !== undefined && (
                              <span title={badgeTooltip || item.title} className="min-w-[20px] rounded-full bg-[#E8352B] px-1.5 py-0.5 text-center text-[10.5px] font-extrabold text-white">{badge > 99 ? '99+' : badge}</span>
                            )}
                          </>
                        )}
                        {collapsed && badge !== undefined && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E8352B] px-1 text-[9px] font-extrabold text-white">{badge > 9 ? '9+' : badge}</span>
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
                              <TooltipContent side="right" className="border-white/10 bg-[#17181A] font-medium text-white">
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
      className="h-screen border-r border-white/[0.06] bg-[#17181A] bg-[radial-gradient(60%_30%_at_0%_0%,rgba(232,53,43,0.18),rgba(232,53,43,0)_70%)] overscroll-contain"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : isTablet ? "sidebar" : "sidebar"}
      style={{ 
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.25)'
      }}
    >
      {/* Cabeçalho: só a marca e quem está logado (07/11/2026: barra escura neutra, vermelho só nos destaques) */}
      <SidebarHeader className={`${collapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <UnifiedLogo size="custom" linkTo="/" variant="light" className={collapsed ? 'h-8 w-8' : 'h-9 w-9'} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold leading-none tracking-[-0.02em] text-white">EXA Mídia</div>
              <div className="mt-1 truncate text-[11px] font-semibold text-white/45">{getAdminTitle()}</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent 
        className={`${collapsed ? 'px-2' : 'px-3'} space-y-3 overflow-y-auto py-2 admin-sidebar-scroll touch-pan-y overscroll-contain`}
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
                <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/30">
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
      
      <SidebarFooter className="mt-auto border-t border-white/[0.06] p-3">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <button onClick={() => navigate(buildPath('meu-perfil'))} className="flex-shrink-0" aria-label="Meu perfil">
            <Avatar className="h-9 w-9 ring-1 ring-white/15">
              <AvatarFallback className="bg-white/10 text-sm font-bold text-white">{userProfile?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
          </button>
          {!collapsed && (
            <>
              <button onClick={() => navigate(buildPath('meu-perfil'))} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-bold text-white">{userProfile?.email?.split('@')[0] || 'Admin'}</p>
                <p className="truncate text-[11px] text-white/40">Meu perfil</p>
              </button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default ModernAdminSidebar;
