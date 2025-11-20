import { NavLink, useNavigate } from 'react-router-dom';
import {
  Database,
  Users,
  Monitor,
  Bell,
  MessageSquare,
  Terminal,
  Sparkles,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeClasses } from '../hooks/useModuleTheme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
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

export const Sidebar = ({ isOpen, onClose, theme }: SidebarProps) => {
  const navigate = useNavigate();
  const tc = getThemeClasses(theme);
  
  return (
    <aside
      className={cn(
        `fixed top-0 left-0 h-full w-64 ${tc.bgCard} ${tc.textPrimary} transition-transform duration-300 ease-in-out z-40`,
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className={`p-6 border-b ${tc.border}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#9C1E1E] rounded-lg flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${tc.textPrimary}`}>IA & Monitoramento</h1>
            <p className={`text-xs ${tc.textMuted}`}>EXA Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 pb-32">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                tc.bgHover,
                isActive
                  ? `${tc.bgAccent} text-white font-medium`
                  : tc.textSecondary
              )
            }
          >
            <item.icon size={20} />
            <span className="text-sm">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Botão Sair do Módulo */}
      <div className="absolute bottom-16 left-0 right-0 px-4">
        <button
          onClick={() => navigate('/admin')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${tc.bgCard} ${tc.border} border ${tc.textPrimary} rounded-lg ${tc.bgHover} hover:${tc.borderAccent} transition-colors`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Sair do Módulo</span>
        </button>
      </div>

      {/* Footer */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${tc.border}`}>
        <p className={`text-xs ${tc.textMuted} text-center`}>
          Módulo Administrativo v1.0
        </p>
      </div>
    </aside>
  );
};
