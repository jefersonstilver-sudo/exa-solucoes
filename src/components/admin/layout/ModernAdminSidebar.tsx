
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Building2, 
  MonitorPlay, 
  Settings, 
  Users,
  Shield,
  Crown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const ModernAdminSidebar = () => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';
  
  const navItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/super_admin',
      requireSuperAdmin: false,
    },
    {
      title: 'Pedidos',
      icon: ShoppingBag,
      href: '/super_admin/pedidos',
      requireSuperAdmin: false,
    },
    {
      title: 'Prédios',
      icon: Building2,
      href: '/super_admin/predios',
      requireSuperAdmin: false,
    },
    {
      title: 'Painéis',
      icon: MonitorPlay,
      href: '/super_admin/paineis',
      requireSuperAdmin: false,
    },
    {
      title: 'Usuários',
      icon: Users,
      href: '/super_admin/usuarios',
      requireSuperAdmin: true,
    },
    {
      title: 'Configurações',
      icon: Settings,
      href: '/super_admin/configuracoes',
      requireSuperAdmin: true,
    },
  ];
  
  return (
    <Sidebar className="indexa-sidebar-gradient shadow-2xl">
      <SidebarHeader className="border-b border-white/10 bg-black/10">
        <div className="flex items-center justify-center p-6">
          <div className="text-white text-2xl font-bold tracking-wider">
            INDEXA
          </div>
        </div>
        {isSuperAdmin && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center space-x-2 text-xs bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 backdrop-blur-sm text-yellow-200 px-3 py-2 rounded-lg border border-yellow-300/30">
              <Crown className="h-3 w-3 text-yellow-300" />
              <span className="font-medium">Super Admin</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="bg-gradient-to-b from-transparent to-black/10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 font-medium">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.requireSuperAdmin && !isSuperAdmin) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild className="data-[active=true]:indexa-sidebar-active hover:indexa-sidebar-hover text-white/90 hover:text-white transition-all duration-300">
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium ${
                            isActive 
                              ? "bg-gradient-to-r from-emerald-400/20 to-emerald-300/20 text-emerald-200 border-l-2 border-emerald-300" 
                              : "hover:bg-white/10"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-white/10 bg-black/10">
        <div className="flex items-center space-x-2 p-4 text-xs text-white/70">
          <Shield className="h-3 w-3 text-emerald-300" />
          <span>Sistema Seguro</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ModernAdminSidebar;
