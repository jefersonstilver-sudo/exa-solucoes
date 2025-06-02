
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Play,
  Video,
  BarChart3,
  Settings
} from 'lucide-react';

const ModernAdvertiserSidebar = () => {
  const location = useLocation();

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/anunciante',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Meus Pedidos',
      href: '/anunciante/pedidos',
      icon: ShoppingBag
    },
    {
      title: 'Campanhas',
      href: '/anunciante/campanhas',
      icon: Play
    },
    {
      title: 'Meus Vídeos',
      href: '/anunciante/videos',
      icon: Video
    },
    {
      title: 'Relatórios',
      href: '/anunciante/relatorios',
      icon: BarChart3
    },
    {
      title: 'Configurações',
      href: '/anunciante/configuracoes',
      icon: Settings
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href || location.pathname === '/anunciante/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-gradient-to-b from-[#3C1361] to-[#2A0D47] border-r border-purple-800/30 w-64 min-h-screen">
      <div className="p-6">
        {/* Logo da Indexa - agora clicável */}
        <div className="flex items-center justify-center mb-8">
          <Link 
            to="/" 
            className="w-20 h-20 flex items-center justify-center hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
              alt="Indexa Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </Link>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
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
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ModernAdvertiserSidebar;
