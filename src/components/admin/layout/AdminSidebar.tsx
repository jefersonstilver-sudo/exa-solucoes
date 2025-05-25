
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
        {/* Status do usuário */}
        {isSuperAdmin && (
          <div className="p-6 border-b border-indexa-purple-light">
            <div className="flex items-center space-x-2 text-indexa-mint">
              <Crown className="h-5 w-5" />
              <span className="text-sm font-bold">Super Admin Access</span>
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
                  "flex items-center px-4 py-3 text-white rounded-lg hover:bg-indexa-purple-light hover:text-white transition-all duration-200 font-medium",
                  isActive ? "bg-white text-indexa-purple font-bold shadow-sm" : ""
                )}
              >
                <div className="mr-3">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer da sidebar */}
        <div className="p-4 border-t border-indexa-purple-light">
          <div className="flex items-center space-x-2 text-white text-sm">
            <Shield className="h-4 w-4" />
            <span>Sistema Seguro</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
