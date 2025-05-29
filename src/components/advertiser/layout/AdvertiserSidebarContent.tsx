
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Video, 
  Play, 
  Settings, 
  LogOut,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
}

const AdvertiserSidebarContent = ({ onItemClick }: AdvertiserSidebarContentProps) => {
  const { user } = useUserSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao realizar logout');
    }
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/anunciante',
      description: 'Visão geral das suas campanhas'
    },
    {
      icon: ShoppingBag,
      label: 'Meus Pedidos',
      path: '/anunciante/pedidos',
      description: 'Histórico de compras e status'
    },
    {
      icon: Play,
      label: 'Campanhas',
      path: '/anunciante/campanhas',
      description: 'Gerencie suas campanhas ativas'
    },
    {
      icon: Video,
      label: 'Meus Vídeos',
      path: '/anunciante/videos',
      description: 'Upload e gestão de vídeos'
    },
    {
      icon: BarChart3,
      label: 'Relatórios',
      path: '/anunciante/relatorios',
      description: 'Métricas e performance'
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '/anunciante/configuracoes',
      description: 'Dados pessoais e preferências'
    }
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/anunciante') {
      return location.pathname === '/anunciante' || location.pathname === '/anunciante/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#3C1361] to-[#2A0D47] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#00FFAB] rounded-lg flex items-center justify-center">
            <span className="text-[#3C1361] font-bold text-lg">I</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Indexa</h2>
            <p className="text-sm text-gray-300">Portal do Anunciante</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#00FFAB] rounded-full flex items-center justify-center">
            <span className="text-[#3C1361] font-semibold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400">Anunciante</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onItemClick?.();
              }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left",
                isActive 
                  ? "bg-[#00FFAB] text-[#3C1361] shadow-lg" 
                  : "hover:bg-white/10 text-gray-200 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-[#3C1361]" : "text-gray-300 group-hover:text-white"
              )} />
              <div className="flex-1">
                <p className={cn(
                  "font-medium text-sm",
                  isActive ? "text-[#3C1361]" : "text-gray-200 group-hover:text-white"
                )}>
                  {item.label}
                </p>
                <p className={cn(
                  "text-xs",
                  isActive ? "text-[#3C1361]/70" : "text-gray-400 group-hover:text-gray-300"
                )}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-gray-200 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default AdvertiserSidebarContent;
