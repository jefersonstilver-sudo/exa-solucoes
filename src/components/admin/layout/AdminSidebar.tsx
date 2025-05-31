
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
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const AdminSidebar = () => {
  const { userProfile, session, isSuperAdmin } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  
  console.log('AdminSidebar - Debug:', {
    userEmail: userProfile?.email,
    sessionEmail: session?.user?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    permissions
  });
  
  const navItems = [
    // GESTÃO PRINCIPAL
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/super_admin',
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewDashboard'
    },
    {
      label: 'Pedidos',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/super_admin/pedidos',
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewOrders'
    },
    {
      label: 'Aprovações',
      icon: <CheckSquare className="h-5 w-5" />,
      href: '/super_admin/aprovacoes',
      requireSuperAdmin: false,
      section: 'main',
      permission: 'canViewApprovals'
    },
    
    // ATIVOS
    {
      label: 'Prédios',
      icon: <Building2 className="h-5 w-5" />,
      href: '/super_admin/predios',
      requireSuperAdmin: false,
      section: 'assets',
      permission: 'canManageBuildings'
    },
    {
      label: 'Painéis',
      icon: <MonitorPlay className="h-5 w-5" />,
      href: '/super_admin/paineis',
      requireSuperAdmin: false,
      section: 'assets',
      permission: 'canManagePanels'
    },
    
    // LEADS & CLIENTES
    {
      label: 'Síndicos Interessados',
      icon: <UserCheck className="h-5 w-5" />,
      href: '/super_admin/sindicos-interessados',
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewSindicosInteressados'
    },
    {
      label: 'Leads Produtora',
      icon: <Coffee className="h-5 w-5" />,
      href: '/super_admin/leads-produtora',
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewLeadsProdutora'
    },
    {
      label: 'Leads de Marketing',
      icon: <Megaphone className="h-5 w-5" />,
      href: '/super_admin/leads-campanhas',
      requireSuperAdmin: false,
      section: 'leads',
      permission: 'canViewLeadsCampanhas'
    },
    
    // SISTEMA
    {
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      href: '/super_admin/usuarios',
      requireSuperAdmin: true,
      section: 'system',
      permission: 'canManageUsers'
    },
    {
      label: 'Cupons',
      icon: <Ticket className="h-5 w-5" />,
      href: '/super_admin/cupons',
      requireSuperAdmin: false,
      section: 'system',
      permission: 'canManageCoupons'
    },
    {
      label: 'Homepage Config',
      icon: <Images className="h-5 w-5" />,
      href: '/super_admin/homepage-config',
      requireSuperAdmin: false, // Marketing admin também pode acessar
      section: 'system',
      permission: 'canManageHomepageConfig'
    },
    {
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      href: '/super_admin/configuracoes',
      requireSuperAdmin: true,
      section: 'system',
      permission: 'canManageSystemSettings'
    },
    
    // CONTEÚDO
    {
      label: 'Vídeos',
      icon: <Video className="h-5 w-5" />,
      href: '/super_admin/videos',
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageVideos'
    },
    {
      label: 'Notificações',
      icon: <Bell className="h-5 w-5" />,
      href: '/super_admin/notificacoes',
      requireSuperAdmin: false,
      section: 'content',
      permission: 'canManageNotifications'
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
        return 'Super Admin Access';
      case 'admin':
        return 'Admin Geral Access';
      case 'admin_marketing':
        return 'Admin Marketing Access';
      default:
        return 'Admin Access';
    }
  };
  
  return (
    <aside className="w-64 min-h-screen bg-indexa-purple shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo da INDEXA */}
        <div className="p-6 border-b border-indexa-purple-light">
          <div className="flex items-center justify-center">
            <Link 
              to="/" 
              className="w-16 h-16 flex items-center justify-center hover:opacity-80 transition-opacity duration-200 cursor-pointer"
            >
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                alt="INDEXA Logo" 
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </Link>
          </div>
        </div>

        {/* Status do usuário */}
        {(isSuperAdmin || userInfo.isAdmin || userInfo.isMarketingAdmin) && (
          <div className="p-4 border-b border-indexa-purple-light">
            <div className="flex items-center space-x-2">
              <Crown className={`h-4 w-4 ${getAdminBadgeColor()}`} />
              <span className={`text-xs font-bold ${getAdminBadgeColor()}`}>
                {getAdminTitle()}
              </span>
            </div>
            <div className="text-xs text-white/70 mt-1">
              {userProfile?.email}
            </div>
          </div>
        )}
        
        {/* Navegação organizada por seções */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {Object.entries(groupedItems).map(([sectionKey, items]) => (
            <div key={sectionKey}>
              <h3 className="text-xs font-semibold text-indexa-mint/80 uppercase tracking-wider mb-3 px-2">
                {sections[sectionKey as keyof typeof sections]}
              </h3>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) => cn(
                      "flex items-center px-3 py-2 text-white rounded-lg hover:bg-indexa-purple-light hover:text-white transition-all duration-200 font-medium text-sm",
                      isActive ? "bg-white text-indexa-purple font-bold shadow-sm" : ""
                    )}
                  >
                    <div className="mr-3">
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
        <div className="p-4 border-t border-indexa-purple-light">
          <div className="flex items-center space-x-2 text-white text-sm">
            <Shield className="h-4 w-4" />
            <span>Sistema Seguro</span>
          </div>
          <div className="text-xs text-white/60 mt-1">
            INDEXA Admin v3.0
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
