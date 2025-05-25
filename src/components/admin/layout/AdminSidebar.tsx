
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
    <aside className="w-72 min-h-screen bg-gradient-to-b from-indexa-purple-dark via-indexa-purple-dark to-black/90 border-r border-indexa-mint/10 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col h-full">
        {/* Header da sidebar com branding premium */}
        <div className="p-6 border-b border-indexa-mint/20 bg-indexa-purple-dark/50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indexa-mint via-indexa-mint-light to-indexa-mint rounded-xl flex items-center justify-center shadow-xl shadow-indexa-mint/40">
                <Database className="h-6 w-6 text-indexa-purple-dark" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indexa-mint rounded-full border-2 border-indexa-purple-dark animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">MASTER CONTROL</h1>
              <p className="text-xs text-indexa-mint font-bold flex items-center uppercase tracking-widest">
                <Shield className="h-3 w-3 mr-1" />
                Ultra Secure
              </p>
            </div>
          </div>
        </div>
        
        {/* Status premium */}
        <div className="px-6 py-4 bg-indexa-mint/5 border-b border-indexa-mint/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-indexa-mint">
              <Activity className="h-3 w-3 animate-pulse" />
              <span className="font-bold">SISTEMA ATIVO</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-white/60">
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
                  "group flex items-center px-4 py-4 text-white/80 rounded-xl hover:bg-indexa-mint/10 hover:text-white transition-all duration-300 relative overflow-hidden border border-transparent hover:border-indexa-mint/20",
                  isActive ? "bg-gradient-to-r from-indexa-mint/20 to-indexa-mint/10 text-white border-indexa-mint/30 shadow-lg shadow-indexa-mint/20" : ""
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Glow effect para item ativo */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/10 via-indexa-mint/5 to-transparent rounded-xl"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center w-full">
                      {/* Ícone com efeito especial */}
                      <div className={cn(
                        "transition-all duration-300 p-2 rounded-lg mr-4",
                        isActive ? "text-indexa-mint bg-indexa-mint/10" : "text-white/60 group-hover:text-indexa-mint group-hover:bg-indexa-mint/5"
                      )}>
                        {item.icon}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1">
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300">
                          {item.description}
                        </p>
                      </div>
                      
                      {/* Indicador ativo */}
                      {isActive && (
                        <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse shadow-lg shadow-indexa-mint/50"></div>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer premium da sidebar */}
        <div className="p-6 border-t border-indexa-mint/20 bg-indexa-purple-dark/50">
          {/* Status de segurança */}
          <div className="bg-indexa-mint/10 backdrop-blur-sm rounded-xl p-4 border border-indexa-mint/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indexa-mint">
                <Shield className="h-4 w-4 animate-pulse" />
                <span className="font-bold text-xs tracking-wide">ULTRA SEGURO</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-indexa-mint animate-pulse"></div>
            </div>
            <div className="text-xs text-white/70">
              Ambiente: <span className="text-indexa-mint font-bold">PRODUÇÃO</span>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/40">
              © 2024 <span className="text-indexa-mint font-bold">INDEXA MEDIA</span>
            </p>
            <p className="text-xs text-white/30 mt-1">
              Super Admin Panel
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
