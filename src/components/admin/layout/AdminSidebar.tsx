
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
  Zap,
  Activity,
  Database
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
      description: 'Visão geral'
    },
    {
      label: 'Pedidos',
      icon: <ShoppingBag className="h-5 w-5" />,
      href: '/super_admin/pedidos',
      requireSuperAdmin: false,
      description: 'Gestão de vendas'
    },
    {
      label: 'Prédios',
      icon: <Building2 className="h-5 w-5" />,
      href: '/super_admin/predios',
      requireSuperAdmin: false,
      description: 'Localizações'
    },
    {
      label: 'Painéis',
      icon: <MonitorPlay className="h-5 w-5" />,
      href: '/super_admin/paineis',
      requireSuperAdmin: false,
      description: 'Equipamentos'
    },
    {
      label: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      href: '/super_admin/usuarios',
      requireSuperAdmin: true,
      description: 'Controle de acesso'
    },
    {
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      href: '/super_admin/configuracoes',
      requireSuperAdmin: true,
      description: 'Sistema'
    },
  ];
  
  return (
    <aside className="w-72 min-h-screen bg-white border-r border-gray-200 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Header da sidebar com branding premium */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indexa-purple via-indexa-purple-dark to-indexa-purple rounded-xl flex items-center justify-center shadow-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indexa-mint rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-black text-indexa-purple tracking-tight">MASTER CONTROL</h1>
              <p className="text-xs text-indexa-mint font-bold flex items-center uppercase tracking-widest">
                <Shield className="h-3 w-3 mr-1" />
                Ultra Secure
              </p>
            </div>
          </div>
        </div>
        
        {/* Status premium */}
        <div className="px-6 py-4 bg-green-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <Activity className="h-3 w-3 animate-pulse" />
              <span className="font-bold">SISTEMA ATIVO</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Zap className="h-3 w-3" />
              <span>v3.0</span>
            </div>
          </div>
        </div>
        
        {/* Navegação premium */}
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
                  "group flex items-center px-4 py-4 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-indexa-purple transition-all duration-300 relative overflow-hidden border border-transparent hover:border-gray-200",
                  isActive ? "bg-indexa-purple/10 text-indexa-purple border-indexa-purple/20 shadow-sm" : ""
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Glow effect para item ativo */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indexa-purple/5 via-indexa-mint/5 to-transparent rounded-xl"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center w-full">
                      {/* Ícone com efeito especial */}
                      <div className={cn(
                        "transition-all duration-300 p-2 rounded-lg mr-4",
                        isActive ? "text-indexa-purple bg-indexa-purple/10" : "text-gray-500 group-hover:text-indexa-purple group-hover:bg-indexa-purple/5"
                      )}>
                        {item.icon}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1">
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        <p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
                          {item.description}
                        </p>
                      </div>
                      
                      {/* Indicador ativo */}
                      {isActive && (
                        <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse shadow-sm"></div>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer premium da sidebar */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {/* Status de segurança */}
          <div className="bg-indexa-purple/5 rounded-xl p-4 border border-indexa-purple/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indexa-purple">
                <Shield className="h-4 w-4 animate-pulse" />
                <span className="font-bold text-xs tracking-wide">ULTRA SEGURO</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="text-xs text-gray-600">
              Ambiente: <span className="text-indexa-purple font-bold">PRODUÇÃO</span>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              © 2024 <span className="text-indexa-purple font-bold">INDEXA MEDIA</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Super Admin Panel
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
