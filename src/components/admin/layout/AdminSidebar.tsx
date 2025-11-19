import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  Mail,
  Megaphone,
  LogOut,
  Zap,
  Film
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

const AdminSidebar = () => {
  const { userProfile, session, isSuperAdmin, logout } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const { basePath, buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  
  console.log('AdminSidebar - Debug:', {
    userEmail: userProfile?.email,
    sessionEmail: session?.user?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    permissions
  });

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
  
  const navItems = [
    // GESTÃO PRINCIPAL
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: basePath,
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewDashboard'
    },
    {
      label: 'Pedidos',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: buildPath('pedidos'),
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewOrders'
    },
    {
      label: 'Aprovações',
      icon: <CheckSquare className="h-5 w-5" />,
      href: buildPath('aprovacoes'),
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewApprovals'
    },
    
    // ATIVOS
    {
      label: 'Prédios',
      icon: <Building2 className="h-5 w-5" />,
      href: buildPath('predios'),
      requireSuperAdmin: false,
      section: 'assets',
      permission: 'canManageBuildings'
    },
    {
      label: 'Painéis',
      icon: <MonitorPlay className="h-5 w-5" />,
      href: buildPath('paineis'),
      requireSuperAdmin: false,
      section: 'assets',
      permission: 'canManagePanels'
    },
    
    // LEADS & CLIENTES
    {
      label: 'Síndicos Interessados',
      icon: <UserCheck className="h-5 w-5" />,
      href: buildPath('sindicos-interessados'),
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewSindicosInteressados'
    },
    {
      label: 'Leads Produtora',
      icon: <Coffee className="h-5 w-5" />,
      href: buildPath('leads-produtora'),
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewLeadsProdutora'
    },
    {
      label: 'Leads EXA',
      icon: <Zap className="h-5 w-5" />,
      href: buildPath('leads-exa'),
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewLeadsExa'
    },
    
    // SISTEMA
    {
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      href: buildPath('usuarios'),
      requireSuperAdmin: true,
      section: 'system',
      permission: 'canManageUsers'
    },
    {
      label: 'Cupons',
      icon: <Ticket className="h-5 w-5" />,
      href: buildPath('cupons'),
      requireSuperAdmin: false,
      section: 'system',
      permission: 'canManageCoupons'
    },
    {
      label: 'Homepage Config',
      icon: <Images className="h-5 w-5" />,
      href: buildPath('homepage-config'),
      requireSuperAdmin: false, // Marketing admin também pode acessar
      section: 'system',
      permission: 'canManageHomepageConfig'
    },
    {
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      href: buildPath('configuracoes'),
      requireSuperAdmin: true,
      section: 'system',
      permission: 'canManageSystemSettings'
    },
    {
      label: 'Monitoramento IA',
      icon: <Shield className="h-5 w-5" />,
      href: '/admin/monitoramento-ia',
      requireSuperAdmin: true,
      section: 'system',
      permission: 'canManageSystemSettings'
    },
    
    // CONTEÚDO
    {
      label: 'Vídeos',
      icon: <Video className="h-5 w-5" />,
      href: buildPath('videos'),
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageVideos'
    },
    {
      label: 'Portfólio Produtora',
      icon: <Film className="h-5 w-5" />,
      href: buildPath('portfolio-produtora'),
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManagePortfolio'
    },
    {
      label: 'Logos EXA',
      icon: <Images className="h-5 w-5" />,
      href: buildPath('logos'),
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageHomepageConfig'
    },
    {
      label: 'Notificações',
      icon: <Bell className="h-5 w-5" />,
      href: buildPath('notificacoes'),
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageNotifications'
    },
    {
      label: 'Emails',
      icon: <Mail className="h-5 w-5" />,
      href: buildPath('comunicacoes'),
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageEmails'
    }
  ];

  const sections = {
    main: 'Gestão Principal',
    assets: 'Ativos',
    leads: 'Leads & Clientes', 
    system: 'Sistema',
    content: 'Conteúdo'
  };

  // Filtrar itens baseado nas permissões do usuário
  const filteredNavItems = navItems.filter(item => {
    // Se requer super admin e não é super admin, não mostrar
    if (item.requireSuperAdmin && !isSuperAdmin) {
      return false;
    }
    
    // Verificar permissão específica
    if (item.permission && !permissions[item.permission as keyof typeof permissions]) {
      return false;
    }
    
    return true;
  });

  const groupedItems = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  // Função para obter a cor do badge baseado no tipo de admin
  const getAdminBadgeColor = () => {
    switch (userInfo.role) {
      case 'super_admin':
        return 'text-yellow-400';
      case 'admin':
        return 'text-blue-400';
      case 'admin_marketing':
        return 'text-purple-400';
      default:
        return 'text-indexa-mint';
    }
  };

  const getAdminTitle = () => {
    switch (userInfo.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin Geral';
      case 'admin_marketing':
        return 'Admin Marketing';
      default:
        return 'Admin';
    }
  };
  
  return (
    <aside className="w-80 h-screen bg-gradient-to-b from-[#1e1b4b] via-[#4c1d95] to-[#7c3aed] shadow-xl flex flex-col">
      {/* Logo da EXA no topo */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-center mb-6">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className="w-32 h-32 drop-shadow-lg"
          />
        </div>
        
        {/* Informações do Usuário */}
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
          
          {/* Notificações e Menu do Usuário */}
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
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-gray-900">
                    {userProfile?.email || 'Admin'}
                  </p>
                  <p className="text-xs leading-none text-gray-600">
                    {getAdminTitle()}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {isSuperAdmin && (
                  <DropdownMenuItem 
                    onClick={() => navigate(buildPath('configuracoes'))}
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Navegação organizada por seções */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {Object.entries(groupedItems).map(([sectionKey, items]) => (
          <div key={sectionKey}>
            <h3 className="text-xs font-semibold text-violet-200 uppercase tracking-wider mb-3 px-2">
              {sections[sectionKey as keyof typeof sections]}
            </h3>
            <div className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-3 text-white rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium text-sm group",
                    isActive ? "bg-white text-[#1e1b4b] font-bold shadow-lg" : ""
                  )}
                >
                  <div className="mr-3 transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Footer da sidebar */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-2 text-white text-sm">
          <Shield className="h-4 w-4" />
          <span>Sistema Seguro</span>
        </div>
        <div className="text-xs text-white/60 mt-1">
          EXA Admin v3.0
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
