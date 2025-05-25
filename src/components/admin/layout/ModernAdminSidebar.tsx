
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
import { useAuth } from '@/hooks/useAuth';

const ModernAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingCount } = usePendingVideosCount();
  const { userProfile } = useAuth();

  const getRoleText = (role: string | null | undefined) => {
    switch (role) {
      case 'super_admin':
        return 'Administrador Master';
      case 'admin':
        return 'Administrador';
      case 'client':
        return 'Área do Anunciante';
      default:
        return 'Usuário';
    }
  };

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
    <Sidebar className="border-r border-gray-200 bg-gradient-to-b from-indexa-purple to-indexa-purple/95 shadow-xl">
      <SidebarHeader className="p-6 border-b border-white/20 bg-indexa-purple/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
              alt="Indexa Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">INDEXA</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-white/90 font-medium">
                {getRoleText(userProfile?.role)}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 bg-indexa-purple">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4 px-2">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigate(item.url)}
                      className={`
                        w-full justify-start px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02]
                        ${isActive 
                          ? 'bg-white text-indexa-purple shadow-lg transform scale-[1.02]' 
                          : 'text-white hover:bg-white/15 hover:text-white hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className={`
                          p-1.5 rounded-lg transition-colors duration-300
                          ${isActive ? 'bg-indexa-purple/10' : 'group-hover:bg-white/10'}
                        `}>
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-indexa-purple' : 'text-white'}`} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full shadow-lg animate-pulse">
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
