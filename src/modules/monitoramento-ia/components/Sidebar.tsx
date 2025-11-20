import { NavLink, useNavigate } from 'react-router-dom';
import {
  Database,
  Users,
  Monitor,
  Bell,
  MessageSquare,
  Terminal,
  LayoutDashboard,
  ArrowLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeClasses } from '../hooks/useModuleTheme';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

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
        `fixed top-0 left-0 h-full w-64 ${tc.textPrimary} transition-transform duration-300 ease-in-out z-40 ${tc.border} border-r`,
        theme === 'dark' 
          ? 'bg-gradient-to-b from-[#9C1E1E] via-[#4A0F0F] to-[#0A0A0A]'
          : tc.bgCard,
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className={`p-6 border-b ${tc.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <img 
            src={EXA_LOGO_URL} 
            alt="EXA" 
            className="h-8 w-auto brightness-0 invert"
          />
          <div>
            <h1 className="text-sm font-bold text-white">IA & Monitoramento</h1>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`lg:hidden p-1.5 ${tc.textPrimary} ${tc.bgHover} rounded-lg`}
        >
          <X size={18} />
        </button>
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
