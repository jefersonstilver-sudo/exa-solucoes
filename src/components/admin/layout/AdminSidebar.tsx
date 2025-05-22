
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
  UserCog 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserSession } from '@/hooks/useUserSession';

const AdminSidebar = () => {
  const { user } = useUserSession();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/admin',
      requireSuperAdmin: false,
    },
    {
      label: 'Pedidos',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/admin/pedidos',
      requireSuperAdmin: false,
    },
    {
      label: 'Prédios',
      icon: <Building2 className="h-5 w-5" />,
      href: '/admin/predios',
      requireSuperAdmin: false,
    },
    {
      label: 'Painéis',
      icon: <MonitorPlay className="h-5 w-5" />,
      href: '/admin/paineis',
      requireSuperAdmin: false,
    },
    {
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      href: '/admin/usuarios',
      requireSuperAdmin: true, // Only super admins can manage users
    },
    {
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/configuracoes',
      requireSuperAdmin: true,
    },
    {
      label: 'Setup',
      icon: <Shield className="h-5 w-5" />,
      href: '/admin/setup',
      requireSuperAdmin: true,
    },
  ];
  
  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">INDEXA Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Painel de Administração</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
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
                  "flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : ""
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Ambiente de Produção
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
