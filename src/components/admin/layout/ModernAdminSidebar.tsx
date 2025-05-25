
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
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indexa-purple rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">INDEXA</h2>
            <p className="text-xs text-gray-600">Super Admin</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                          ? 'bg-indexa-purple text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-indexa-purple'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indexa-purple'}`} />
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
