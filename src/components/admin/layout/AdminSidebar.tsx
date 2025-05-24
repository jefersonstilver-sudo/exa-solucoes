
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const AdminSidebar = () => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';
  
  console.log('🔧 AdminSidebar - Estado de autenticação:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isSuperAdmin
  });
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/super_admin',
      requireSuperAdmin: false,
    },
    {
      label: 'Pedidos',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/super_admin/pedidos',
      requireSuperAdmin: false,
    },
    {
      label: 'Prédios',
      icon: <Building2 className="h-5 w-5" />,
      href: '/super_admin/predios',
      requireSuperAdmin: false,
    },
    {
      label: 'Painéis',
      icon: <MonitorPlay className="h-5 w-5" />,
      href: '/super_admin/paineis',
      requireSuperAdmin: false,
    },
    {
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      href: '/super_admin/usuarios',
      requireSuperAdmin: true,
    },
    {
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      href: '/super_admin/configuracoes',
      requireSuperAdmin: true,
    },
  ];
  
  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Header with enhanced branding */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-slate-900" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">INDEXA</h1>
              <p className="text-xs text-amber-400 font-medium flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Master Control
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation with enhanced styling */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            // Skip items that require super admin if user isn't a super admin
            if (item.requireSuperAdmin && !isSuperAdmin) {
              return null;
            }
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 text-slate-300 rounded-lg hover:bg-slate-700/50 hover:text-white transition-all duration-200 group relative overflow-hidden",
                  isActive ? "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 border border-amber-500/30 shadow-lg" : ""
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Subtle glow effect for active items */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg"></div>
                    )}
                    <div className="relative z-10 flex items-center w-full">
                      <div className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-amber-400" : "text-slate-400 group-hover:text-white"
                      )}>
                        {item.icon}
                      </div>
                      <span className="ml-3 font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Status footer with enhanced info */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="font-medium">Sistema Ativo</span>
            </div>
            <div className="text-xs text-slate-500">
              v2.0.1
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Ambiente: <span className="text-amber-400 font-medium">PRODUÇÃO</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
