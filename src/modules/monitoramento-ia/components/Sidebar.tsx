import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Bell,
  MessageSquare,
  Users,
  Terminal,
  Bot,
  Home,
  ArrowLeft,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/monitoramento-ia/dashboard',
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
    title: 'Diretores Autorizados',
    icon: Users,
    path: '/admin/monitoramento-ia/diretores',
  },
  {
    title: 'Console da IA',
    icon: Terminal,
    path: '/admin/monitoramento-ia/console-ia',
  },
  { divider: true },
  { sectionTitle: '🤖 AGENTES INTELIGENTES' },
  {
    title: 'Painel Unificado',
    icon: Bot,
    path: '/admin/monitoramento-ia/agentes',
    badge: 'NOVO'
  },
];

export const Sidebar = ({ isOpen, onClose, theme, collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  
  return (
    <aside
      className={cn(
        `fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-40 border-r`,
        collapsed ? 'w-16' : 'w-64',
        theme === 'dark' 
          ? 'bg-gradient-to-b from-[#9C1E1E] via-[#4A0F0F] to-[#0A0A0A] border-[#2A2A2A] text-white'
          : 'bg-[#9C1E1E] border-[#8A1A1A] text-white',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center",
        collapsed ? 'justify-center' : 'justify-between',
        theme === 'dark' ? 'border-[#2A2A2A]' : 'border-[#8A1A1A]'
      )}>
        {!collapsed && (
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
        )}
        
        {collapsed && (
          <img 
            src={EXA_LOGO_URL} 
            alt="EXA" 
            className="h-6 w-auto brightness-0 invert"
          />
        )}

        {/* Toggle Button - Desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:block p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
          title={collapsed ? 'Expandir sidebar' : 'Retrair sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Close Button - Mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "p-2 space-y-1 pb-32 overflow-y-auto max-h-[calc(100vh-240px)]",
        "custom-scrollbar"
      )}>
        {menuItems.map((item, index) => {
          // Divisor
          if ('divider' in item && item.divider) {
            return (
              <div key={`divider-${index}`} className={cn(
                "my-4 border-t opacity-20",
                collapsed ? 'mx-2' : 'mx-4',
                theme === 'dark' ? 'border-white/20' : 'border-white/30'
              )} />
            );
          }
          
          // Section Title
          if ('sectionTitle' in item && item.sectionTitle) {
            if (collapsed) return null; // Hide section titles when collapsed
            return (
              <div key={`section-${index}`} className="px-4 py-2 mt-4">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  {item.sectionTitle}
                </p>
              </div>
            );
          }
          
          // Menu Item normal
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white font-medium shadow-lg'
                      : 'bg-white/20 text-white font-medium shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm">{item.title}</span>
                  {item.badge && (
                    <span className={cn(
                      "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded",
                      theme === 'dark'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-green-600 text-white'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 border-t",
        theme === 'dark' ? 'border-[#2A2A2A] bg-[#0A0A0A]/50' : 'border-[#8A1A1A] bg-[#8A1A1A]/30'
      )}>
        <button
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 p-4 text-white/70 hover:text-white hover:bg-white/5 transition-colors",
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Voltar ao início' : undefined}
        >
          <Home size={20} />
          {!collapsed && <span className="text-sm">Voltar ao Início</span>}
        </button>
      </div>
    </aside>
  );
};
