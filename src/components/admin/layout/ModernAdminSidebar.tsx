
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Package, 
  Settings,
  Video,
  ShoppingBag
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { usePendingVideosCount } from '@/hooks/usePendingVideosCount';

const ModernAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingCount } = usePendingVideosCount();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/super_admin",
      description: "Visão geral do sistema"
    },
    {
      title: "Pedidos",
      icon: ShoppingBag,
      url: "/super_admin/pedidos",
      description: "Gerenciar pedidos"
    },
    {
      title: "Aprovações",
      icon: Video,
      url: "/super_admin/aprovacoes",
      description: "Aprovar vídeos dos clientes",
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      title: "Prédios",
      icon: Building2,
      url: "/super_admin/predios",
      description: "Gerenciar prédios"
    },
    {
      title: "Painéis",
      icon: Package,
      url: "/super_admin/paineis",
      description: "Gerenciar painéis"
    },
    {
      title: "Usuários",
      icon: Users,
      url: "/super_admin/usuarios",
      description: "Gerenciar usuários"
    },
    {
      title: "Configurações",
      icon: Settings,
      url: "/super_admin/configuracoes",
      description: "Configurações do sistema"
    }
  ];

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-indexa-purple">
      <SidebarHeader className="p-6 border-b border-white/20 bg-indexa-purple">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-indexa-purple" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">INDEXA MEDIA</h2>
            <p className="text-xs text-white/80">Super Admin</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 bg-indexa-purple">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigate(item.url)}
                      className={`
                        w-full justify-start px-3 py-2 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-white text-indexa-purple shadow-md' 
                          : 'text-white hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-indexa-purple' : 'text-white'}`} />
                        <div className="flex-1">
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ModernAdminSidebar;
