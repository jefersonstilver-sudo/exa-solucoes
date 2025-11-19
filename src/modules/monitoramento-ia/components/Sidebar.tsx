import { NavLink } from 'react-router-dom';
import {
  Database,
  Users,
  Monitor,
  Bell,
  MessageSquare,
  Terminal,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/monitoramento-ia/dashboard',
  },
  {
    title: 'Base da Agente',
    icon: Database,
    path: '/admin/monitoramento-ia/base-agente',
  },
  {
    title: 'Diretores Autorizados',
    icon: Users,
    path: '/admin/monitoramento-ia/diretores',
  },
  {
    title: 'Painéis',
    icon: Monitor,
    path: '/admin/monitoramento-ia/paineis',
  },
  {
    title: 'Alertas de Painéis',
    icon: Bell,
    path: '/admin/monitoramento-ia/alertas',
  },
  {
    title: 'Conversas Analisadas',
    icon: MessageSquare,
    path: '/admin/monitoramento-ia/conversas',
  },
  {
    title: 'Console da IA',
    icon: Terminal,
    path: '/admin/monitoramento-ia/console-ia',
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-64 bg-[#0A0A0A] text-white transition-transform duration-300 ease-in-out z-40',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD000] rounded-lg flex items-center justify-center">
            <Sparkles className="text-[#0A0A0A]" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">IA & Monitoramento</h1>
            <p className="text-xs text-white/60">EXA Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-white/5',
                isActive
                  ? 'bg-[#FFD000] text-[#0A0A0A] font-medium'
                  : 'text-white/80'
              )
            }
          >
            <item.icon size={20} />
            <span className="text-sm">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          Módulo Administrativo v1.0
        </p>
      </div>
    </aside>
  );
};
