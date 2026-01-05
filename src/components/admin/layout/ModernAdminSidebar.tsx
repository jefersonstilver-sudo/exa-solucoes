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
  LayoutGrid
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

// Novos hooks para badges dinâmicos
import { usePedidosSemVideo } from '@/hooks/usePedidosSemVideo';
import { usePropostasAguardando } from '@/hooks/usePropostasAguardando';
import { useContratosPendentes } from '@/hooks/useContratosPendentes';
import { useBeneficiosAcaoNecessaria } from '@/hooks/useBeneficiosAcaoNecessaria';
import { usePendingVideosCount } from '@/hooks/usePendingVideosCount';
export function ModernAdminSidebar() {
  const { state, open, setOpen, setOpenMobile, isMobile: isSidebarMobile } = useSidebar();
  const location = useLocation();
  const { userProfile, session, isSuperAdmin, logout } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const { basePath, buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsiveLayout();

  // Badges dinâmicos existentes
  const { unreadCount } = useUnreadCount();
  const { pendentesCount: escalacoesPendentes } = useEscalacoesPendentes();
  const { offlineCount } = useOfflineAlerts();
  
  // Novos badges dinâmicos
  const { count: pedidosSemVideo } = usePedidosSemVideo();
  const { count: propostasAguardando } = usePropostasAguardando();
  const { count: contratosPendentes } = useContratosPendentes();
  const { count: beneficiosAcao } = useBeneficiosAcaoNecessaria();
  const { pendingCount: videosParaAprovar } = usePendingVideosCount();
  

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

  // 7 SEÇÕES REORGANIZADAS conforme especificação - com moduleKey para permissões dinâmicas
  const navigationGroups = [
    {
      label: 'Gestão Principal',
      items: [
        {
          title: 'Dashboard',
          href: basePath,
          icon: LayoutDashboard,
          moduleKey: MODULE_KEYS.dashboard
        },
        {
          title: 'Posições',
          href: buildPath('posicoes'),
          icon: BarChart3,
          moduleKey: MODULE_KEYS.posicoes,
          badgeTooltip: 'Controle de estoque de posições disponíveis'
        },
        {
          title: 'Agenda Técnica',
          href: buildPath('sync-notion'),
          icon: Building2,
          moduleKey: MODULE_KEYS.sync_notion,
        },
        {
          title: 'Agenda',
          href: buildPath('agenda'),
          icon: Calendar,
          moduleKey: MODULE_KEYS.agenda,
          badge: '📅',
          badgeColor: 'bg-blue-600'
        },
        {
          title: 'Pedidos',
          href: buildPath('pedidos'),
          icon: ShoppingBag,
          moduleKey: MODULE_KEYS.pedidos,
          badge: pedidosSemVideo > 0 ? pedidosSemVideo : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Pedidos ativos aguardando envio de vídeo'
        },
        {
          title: 'Produtos',
          href: buildPath('produtos'),
          icon: MonitorPlay,
          moduleKey: MODULE_KEYS.produtos
        },
        {
          title: 'Propostas',
          href: buildPath('propostas'),
          icon: FileText,
          moduleKey: MODULE_KEYS.propostas,
          badge: propostasAguardando > 0 ? propostasAguardando : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Propostas enviadas aguardando resposta do cliente'
        },
        {
          title: 'Jurídico',
          href: buildPath('juridico'),
          icon: Scale,
          moduleKey: MODULE_KEYS.juridico,
          badge: contratosPendentes > 0 ? contratosPendentes : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Contratos enviados aguardando assinatura'
        },
        {
          title: 'Assinaturas',
          href: buildPath('assinaturas'),
          icon: CreditCard,
          moduleKey: MODULE_KEYS.assinaturas
        },
        {
          title: 'Aprovações',
          href: buildPath('aprovacoes'),
          icon: CheckSquare,
          moduleKey: MODULE_KEYS.aprovacoes,
          badge: videosParaAprovar > 0 ? videosParaAprovar : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Vídeos aguardando aprovação do cliente'
        },
        {
          title: 'Cupons',
          href: buildPath('cupons'),
          icon: Ticket,
          moduleKey: MODULE_KEYS.cupons
        },
        {
          title: 'Benefícios Prestadores',
          href: buildPath('beneficio-prestadores'),
          icon: Gift,
          moduleKey: MODULE_KEYS.beneficios,
          badge: beneficiosAcao > 0 ? beneficiosAcao : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgePulse: beneficiosAcao > 0,
          badgeTooltip: 'Benefícios com ação necessária'
        }
      ]
    },
    {
      label: 'CRM',
      items: [
        {
          title: 'Contatos',
          href: buildPath('contatos'),
          icon: Contact,
          moduleKey: MODULE_KEYS.contatos
        },
        {
          title: 'Kanban',
          href: buildPath('contatos-kanban'),
          icon: LayoutGrid,
          moduleKey: MODULE_KEYS.contatos_kanban
        },
        {
          title: 'CRM Site',
          href: buildPath('crm'),
          icon: UsersRound,
          moduleKey: MODULE_KEYS.crm_site
        },
        {
          title: 'CRM Chat',
          href: buildPath('crm-chat'),
          icon: MessageSquare,
          moduleKey: MODULE_KEYS.crm_chat,
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Mensagens não lidas'
        },
        {
          title: 'Escalações',
          href: buildPath('escalacoes'),
          icon: AlertTriangle,
          moduleKey: MODULE_KEYS.escalacoes,
          badge: escalacoesPendentes > 0 ? escalacoesPendentes : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Escalações pendentes de resolução'
        },
        {
          title: 'Processos',
          href: buildPath('processos'),
          icon: Network,
          moduleKey: MODULE_KEYS.processos,
          badge: '🆕',
          badgeColor: 'bg-indigo-600'
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
          moduleKey: MODULE_KEYS.agentes_sofia
        },
        {
          title: 'EXA Alerts',
          href: buildPath('exa-alerts'),
          icon: Brain,
          moduleKey: MODULE_KEYS.exa_alerts
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
          moduleKey: MODULE_KEYS.predios
        },
        {
          title: 'Painéis EXA',
          href: buildPath('paineis-exa'),
          icon: Tv,
          moduleKey: MODULE_KEYS.paineis,
          badge: offlineCount > 0 ? offlineCount : undefined,
          badgeColor: 'bg-[#9C1E1E]',
          badgeTooltip: 'Painéis offline'
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
          moduleKey: MODULE_KEYS.sindicos
        },
        {
          title: 'Leads EXA',
          href: buildPath('leads-exa'),
          icon: Zap,
          moduleKey: MODULE_KEYS.leads
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
          moduleKey: MODULE_KEYS.videos_anunciantes
        },
        {
          title: 'Vídeos Site EXA',
          href: buildPath('videos-site'),
          icon: Film,
          moduleKey: MODULE_KEYS.videos_site
        },
        {
          title: 'Ticker',
          href: buildPath('ticker'),
          icon: Images,
          moduleKey: MODULE_KEYS.ticker
        },
        {
          title: 'Editor de Vídeos',
          href: buildPath('editor-video-controle'),
          icon: Clapperboard,
          moduleKey: MODULE_KEYS.editor_videos,
          badge: 'BETA',
          badgeColor: 'bg-[#9C1E1E]'
        },
        {
          title: 'Emails',
          href: buildPath('comunicacoes'),
          icon: Mail,
          moduleKey: MODULE_KEYS.emails
        }
      ]
    },
    {
      label: 'Financeiro MP',
      items: [
        {
          title: 'Financeiro Completo',
          href: buildPath('financeiro-mp'),
          icon: Landmark,
          moduleKey: MODULE_KEYS.financeiro_mp,
          badgeTooltip: 'Módulo integrado Mercado Pago com anti-fraude'
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
          moduleKey: MODULE_KEYS.usuarios
        },
        {
          title: 'Notificações',
          href: buildPath('notificacoes'),
          icon: Bell,
          moduleKey: MODULE_KEYS.notificacoes
        },
        {
          title: 'Relatórios Financeiros',
          href: buildPath('relatorios-financeiros'),
          icon: FileBarChart,
          moduleKey: MODULE_KEYS.relatorios
        },
        {
          title: 'Segurança',
          href: buildPath('seguranca'),
          icon: Shield,
          moduleKey: MODULE_KEYS.seguranca
        },
        {
          title: 'Configurações',
          href: buildPath('configuracoes'),
          icon: Settings,
          moduleKey: MODULE_KEYS.configuracoes
        }
      ]
    }
  ];

  // Filter items based on DYNAMIC MODULE PERMISSIONS from database
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Master account always has access
      if (isMasterAccount) return true;
      
      // Check dynamic permission from database
      return hasModuleAccess(item.moduleKey);
    })
  })).filter(group => group.items.length > 0);

  // Get favorite items from all groups

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
      className="h-screen bg-gradient-to-b from-[#3D0C0C]/95 via-[#2A0808]/95 to-[#1A0505]/95 backdrop-blur-2xl border-r border-red-500/20 shadow-2xl overscroll-contain"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : isTablet ? "sidebar" : "sidebar"}
      style={{ 
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      {/* Header com glassmorphism */}
      <SidebarHeader className={`${collapsed ? 'p-3' : 'p-4 md:p-5'} border-b border-red-500/20 bg-red-950/30 backdrop-blur-xl`}>
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
            <div className="text-white font-medium text-sm">
              Painel Administrativo
            </div>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Crown className={`h-3 w-3 ${getAdminBadgeColor()}`} />
              <span className={`text-[10px] font-medium ${getAdminBadgeColor()}`}>
                {getAdminTitle()}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent 
        className={`${collapsed ? 'px-2' : 'px-3'} py-4 space-y-3 overflow-y-auto admin-sidebar-scroll touch-pan-y overscroll-contain bg-red-950/20 backdrop-blur-xl`}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)'
        }}
      >

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
                  const badgePulse = (item as any).badgePulse || false;
                  const badgeTooltip = (item as any).badgeTooltip;

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
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`${badgeColor} text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center cursor-help shadow-sm ${badgePulse ? 'animate-pulse ring-2 ring-red-300/50' : ''}`}>
                                      {badge}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#1A1A1A] text-white border-white/10 text-xs max-w-[200px]">
                                    {badgeTooltip || item.title}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </>
                        )}
                      {collapsed && badge !== undefined && (
                        <span className={`absolute -top-1 -right-1 ${badgeColor} text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${badgePulse ? 'animate-pulse ring-2 ring-red-300/50' : ''}`}>
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
                                <div className="flex flex-col gap-1">
                                  <p className="font-semibold">{item.title}</p>
                                  {badge !== undefined && badgeTooltip && (
                                    <p className="text-[10px] text-white/70">{badgeTooltip}</p>
                                  )}
                                  {badge !== undefined && (
                                    <span className={`${badgeColor} text-white text-[11px] font-bold px-2 py-0.5 rounded-full w-fit shadow-sm`}>
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
      
      {/* Footer com perfil do usuário - estilo glassmorphism */}
      <SidebarFooter className="p-3 border-t border-red-500/20 bg-red-950/30 backdrop-blur-xl">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Avatar className="h-9 w-9 ring-2 ring-red-500/30">
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white font-semibold text-sm">
              {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-[10px] text-white/50">
                {getAdminTitle()}
              </p>
            </div>
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
                <TooltipContent side="top" className="bg-[#1A1A1A] text-white border-white/10">
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
              <TooltipContent side="right" className="bg-[#1A1A1A] text-white border-white/10">
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
