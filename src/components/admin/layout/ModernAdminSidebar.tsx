
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Building2,
  ShoppingCart,
  CheckSquare,
  Monitor,
  Settings,
  Ticket,
  Crown,
  Shield
} from 'lucide-react';

const ModernAdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/super_admin/',
      active: location.pathname === '/super_admin/' || location.pathname === '/super_admin'
    },
    {
      label: 'Usuários',
      icon: Users,
      href: '/super_admin/usuarios',
      active: location.pathname.includes('/usuarios')
    },
    {
      label: 'Prédios',
      icon: Building2,
      href: '/super_admin/predios',
      active: location.pathname.includes('/predios')
    },
    {
      label: 'Painéis',
      icon: Monitor,
      href: '/super_admin/paineis',
      active: location.pathname.includes('/paineis')
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      href: '/super_admin/pedidos',
      active: location.pathname.includes('/pedidos')
    },
    {
      label: 'Aprovações',
      icon: CheckSquare,
      href: '/super_admin/aprovacoes',
      active: location.pathname.includes('/aprovacoes')
    },
    {
      label: 'Cupons',
      icon: Ticket,
      href: '/super_admin/cupons',
      active: location.pathname.includes('/cupons')
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/super_admin/configuracoes',
      active: location.pathname.includes('/configuracoes')
    }
  ];

  return (
    <div className="w-64 h-full bg-gradient-to-b from-indexa-purple via-indexa-purple-dark to-indexa-purple shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Logo INDEXA no topo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-center">
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
              alt="INDEXA Logo"
              className="h-12 w-auto brightness-0 invert"
            />
          </div>
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-indexa-mint text-sm font-medium">
              <Crown className="h-4 w-4" />
              <span>Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 rounded-xl text-white transition-all duration-200 font-medium relative overflow-hidden",
                  item.active 
                    ? "bg-white/20 shadow-lg backdrop-blur-sm border-l-4 border-indexa-mint" 
                    : "hover:bg-white/10 hover:backdrop-blur-sm hover:transform hover:scale-105"
                )}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                <div className={cn(
                  "mr-3 transition-colors duration-200",
                  item.active ? "text-indexa-mint" : "text-white group-hover:text-indexa-mint"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "transition-colors duration-200",
                  item.active ? "text-white font-semibold" : "text-white/90 group-hover:text-white"
                )}>
                  {item.label}
                </span>
                
                {/* Indicador ativo */}
                {item.active && (
                  <div className="ml-auto w-2 h-2 bg-indexa-mint rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer da sidebar */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2 text-indexa-mint text-sm">
            <Shield className="h-4 w-4" />
            <span>Sistema Seguro</span>
          </div>
          <div className="text-center mt-2 text-white/60 text-xs">
            INDEXA MEDIA v3.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
