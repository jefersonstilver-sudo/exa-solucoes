import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Video, 
  BarChart3, 
  User,
  LogOut,
  Crown
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
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
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export function NewModernAdvertiserSidebar() {
  const { state, open, setOpen } = useSidebar();
  const location = useLocation();
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsiveLayout();

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

  const navigationGroups = [
    {
      label: 'Gestão Principal',
      items: [
        {
          title: 'Dashboard',
          href: '/anunciante',
          icon: Home,
          exact: true
        },
        {
          title: 'Meus Pedidos',
          href: '/anunciante/pedidos',
          icon: ShoppingBag
        }
      ]
    },
    {
      label: 'Conteúdo',
      items: [
        {
          title: 'Relatório',
          href: '/anunciante/videos',
          icon: Video
        },
        {
          title: 'Minhas Campanhas',
          href: '/anunciante/campanhas',
          icon: BarChart3
        }
      ]
    },
    {
      label: 'Configurações',
      items: [
        {
          title: 'Perfil',
          href: '/anunciante/perfil',
          icon: User
        }
      ]
    }
  ];

  const collapsed = isMobile ? false : state === "collapsed";

  return (
    <Sidebar 
      className="h-screen bg-gradient-to-b from-[#180A0A] via-[#3B1E1E] to-[#9C1E1E] border-r border-white/20 shadow-2xl"
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "sidebar" : "sidebar"}
      style={{ backgroundColor: '#180A0A' }}
    >
      <SidebarHeader className={`${collapsed ? 'p-3' : 'p-4 md:p-6'} border-b border-white/20 bg-[#180A0A]`}>
        <div className="flex items-center justify-center mb-3 md:mb-4">
          <UnifiedLogo 
            size="custom" 
            linkTo="/" 
            variant="light"
            className={collapsed ? "w-12 h-12 md:w-14 md:h-14" : "w-16 h-16 md:w-24 md:h-24"}
          />
        </div>
        
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-xs md:text-sm truncate">
                {userProfile?.email?.split('@')[0] || 'Anunciante'}
              </div>
              <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                <Crown className="h-3 w-3 text-[#00FFAB]" />
                <span className="text-[10px] md:text-xs font-medium text-[#00FFAB] truncate">
                  Portal do Anunciante
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/20 touch-target">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white text-[#9C1E1E] font-semibold text-xs">
                        {userProfile?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{userProfile?.email || 'Anunciante'}</p>
                    <p className="text-xs text-muted-foreground">Portal do Anunciante</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent 
        className={`${collapsed ? 'px-2' : 'px-3 md:px-4'} py-4 md:py-6 space-y-4 md:space-y-6 overflow-y-auto admin-sidebar-scroll`}
        style={{ 
          background: 'linear-gradient(180deg, #180A0A 0%, #3B1E1E 50%, #9C1E1E 100%)',
          backgroundColor: '#180A0A'
        }}
      >
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] md:text-xs font-semibold text-red-200 uppercase tracking-wider mb-2 md:mb-3 px-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.href
                    : location.pathname.startsWith(item.href) && item.href !== '/anunciante';
                  const Icon = item.icon;

                  const linkContent = (
                    <NavLink
                      to={item.href}
                      className={`flex flex-row items-center ${collapsed ? 'px-3 py-3 gap-0 justify-center' : 'px-4 py-4 gap-3'} rounded-xl transition-all duration-200 font-medium group touch-target ${
                        isActive 
                          ? "bg-white !text-[#9C1E1E] font-bold shadow-lg hover:!bg-white hover:!text-[#9C1E1E]" 
                          : "text-white hover:bg-white/20 hover:text-white"
                      }`}
                      onClick={() => {
                        if (isMobile) {
                          setOpen(false);
                        }
                      }}
                    >
                      <Icon className={`${collapsed ? 'h-5 w-5' : isMobile ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
                      {!collapsed && (
                        <span className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold truncate`}>
                          {item.title}
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
                              <TooltipContent side="right" className="bg-white text-[#9C1E1E] font-semibold">
                                <p>{item.title}</p>
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
      
      <SidebarFooter className={`${collapsed ? 'p-2' : 'p-3 md:p-4'} border-t border-white/20 bg-[#9C1E1E]`}>
        {!collapsed && (
          <>
            <div className="flex items-center space-x-2 text-white text-xs md:text-sm">
              <Crown className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="text-xs truncate whitespace-nowrap">Portal Seguro</span>
            </div>
            <div className="text-[10px] md:text-xs text-white/60 mt-0.5 truncate">
              EXA Anunciante v3.0
            </div>
          </>
        )}
        {collapsed && (
          <Crown className="h-4 w-4 text-white mx-auto" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default NewModernAdvertiserSidebar;
