
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Building,
  MonitorPlay,
  CheckSquare,
  Video,
  Ticket,
  Settings,
  Bell,
  Images
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ModernAdminSidebar = () => {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/super_admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Usuários',
      href: '/super_admin/usuarios',
      icon: Users
    },
    {
      title: 'Pedidos',
      href: '/super_admin/pedidos',
      icon: Package
    },
    {
      title: 'Aprovações',
      href: '/super_admin/aprovacoes',
      icon: CheckSquare
    },
    {
      title: 'Gestão de Vídeos',
      href: '/super_admin/videos',
      icon: Video
    },
    {
      title: 'Prédios',
      href: '/super_admin/predios',
      icon: Building
    },
    {
      title: 'Painéis',
      href: '/super_admin/paineis',
      icon: MonitorPlay
    },
    {
      title: 'Homepage Imagens',
      href: '/super_admin/homepage-imagens',
      icon: Images,
      requireSuperAdmin: true
    },
    {
      title: 'Cupons',
      href: '/super_admin/cupons',
      icon: Ticket
    },
    {
      title: 'Notificações',
      href: '/super_admin/notifications',
      icon: Bell
    },
    {
      title: 'Configurações',
      href: '/super_admin/configuracoes',
      icon: Settings
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-gradient-to-b from-[#3C1361] to-[#2A0D47] border-r border-purple-800/30 w-64 min-h-screen">
      <div className="p-6">
        {/* Logo da Indexa - mesma da página principal */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center">
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
              alt="Indexa Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </div>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            // Verificar se é um item que requer Super Admin
            if (item.requireSuperAdmin && !isSuperAdmin) {
              return null;
            }
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(item.href, item.exact)
                    ? 'bg-[#00FFAB] text-[#3C1361] shadow-lg font-semibold'
                    : 'text-purple-100 hover:text-white hover:bg-white/10 hover:translate-x-1'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
