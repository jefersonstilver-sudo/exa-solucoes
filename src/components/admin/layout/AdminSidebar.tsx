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
  Crown,
  Video,
  Images
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
      label: 'Aprovações',
      icon: <Video className="h-5 w-5" />,
      href: '/super_admin/aprovacoes',
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
      label: 'Homepage Imagens',
      icon: <Images className="h-5 w-5" />,
      href: '/super_admin/homepage-imagens',
      requireSuperAdmin: true,
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
        {/* Logo da INDEXA - mesma da página principal */}
        <div className="p-6 border-b border-indexa-purple-light">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                alt="INDEXA Logo" 
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </div>
          </div>
        </div>

        {/* Status do usuário */}
        {isSuperAdmin && (
          <div className="p-4 border-b border-indexa-purple-light">
            <div className="flex items-center space-x-2 text-indexa-mint">
              <Crown className="h-4 w-4" />
              <span className="text-xs font-bold">Super Admin Access</span>
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
