
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
    <aside className="w-64 min-h-screen bg-indexa-purple shadow-lg">
      <div className="flex flex-col h-full">
        {/* Header da sidebar */}
        <div className="p-6 border-b border-indexa-purple-light">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-indexa-purple font-bold text-lg">I</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">INDEXA</h1>
              <p className="text-indexa-mint text-xs">ADMIN PANEL</p>
            </div>
          </div>
        </div>
        
        {/* Status do usuário */}
        {isSuperAdmin && (
          <div className="p-4 bg-indexa-purple-light/20">
            <div className="flex items-center space-x-2 text-indexa-mint">
              <Crown className="h-4 w-4" />
              <span className="text-sm font-semibold">Super Admin</span>
            </div>
          </div>
        )}
        
        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            if (item.requireSuperAdmin && !isSuperAdmin) {
              return null;
            }
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 text-white/80 rounded-lg hover:bg-indexa-purple-light hover:text-white transition-all duration-200",
                  isActive ? "bg-white text-indexa-purple font-semibold shadow-sm" : ""
                )}
              >
                <div className="mr-3">
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer da sidebar */}
        <div className="p-4 border-t border-indexa-purple-light">
          <div className="flex items-center space-x-2 text-white/60 text-sm">
            <Shield className="h-4 w-4" />
            <span>Sistema Seguro</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
