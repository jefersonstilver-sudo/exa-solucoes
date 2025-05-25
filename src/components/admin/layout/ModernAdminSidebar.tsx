
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
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-3 p-4">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODEzNjM2MCwiZXhwIjoxNzc5NjcyMzYwfQ.lJuvOzeGcyQSF2sNqu1GyxuZpgwpBUGt9HsIbKrGakg" 
            alt="INDEXA" 
            className="h-8 w-auto"
          />
          <div>
            <h2 className="text-sm font-semibold">INDEXA</h2>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
              <Crown className="h-3 w-3" />
              <span>Super Admin</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.requireSuperAdmin && !isSuperAdmin) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => 
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center space-x-2 p-4 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Sistema Seguro</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ModernAdminSidebar;
