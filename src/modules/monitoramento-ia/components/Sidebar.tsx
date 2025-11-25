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
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useOfflineAlerts } from '../hooks/useOfflineAlerts';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title?: string;
  icon?: any;
  path?: string;
  badge?: string;
  divider?: boolean;
  sectionTitle?: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/monitoramento-ia/dashboard',
  },
  { divider: true },
  { sectionTitle: 'AGENTES' },
  {
    title: 'Agentes',
    icon: Bot,
    path: '/admin/monitoramento-ia/agentes',
  },
  {
    title: 'CRM & Conversas',
    icon: MessageSquare,
    path: '/admin/monitoramento-ia/crm',
  },
  {
    title: 'Relatórios',
    icon: LayoutDashboard,
    path: '/admin/monitoramento-ia/relatorios'
  },
  { divider: true },
  { sectionTitle: 'PAINÉIS' },
  {
    title: 'Monitoramento',
    icon: Monitor,
    path: '/admin/monitoramento-ia/paineis',
  },
  {
    title: 'Alertas',
    icon: Bell,
    path: '/admin/monitoramento-ia/alertas',
  },
];

export const Sidebar = ({ isOpen, onClose, theme, collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadCount();
  const { totalOffline } = useOfflineAlerts();
  
  return (
    <aside
      className={cn(
        `fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-40 border-r relative flex flex-col`,
        collapsed ? 'w-16' : 'w-64',
        'bg-[#3A0808] border-[#9C1E1E]/50 text-white shadow-2xl',
        // Desktop only by default
        'hidden lg:flex',
        'lg:translate-x-0',
        // Mobile drawer (only show when isOpen)
        isOpen && 'max-lg:flex max-lg:translate-x-0'
      )}
    >
      {/* Botão flutuante glass na borda - SEMPRE VISÍVEL */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-50 
          backdrop-blur-xl bg-white/20 border border-white/30 
          rounded-full p-2 shadow-lg hover:scale-110 transition-all hover:bg-white/30"
        title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      {/* Header - Glassmorphism com logo reorganizado */}
      <div className={cn(
        "p-5 border-b flex items-center justify-center relative",
        'border-white/10'
      )}>
        {!collapsed && (
          <div className="flex flex-col items-center gap-2 w-full">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA" 
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="text-sm font-semibold tracking-wider uppercase text-white/80">
              Monitoramento
            </p>
          </div>
        )}
        
        {collapsed && (
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA" 
              className="h-10 w-10 object-contain brightness-0 invert"
            />
          </div>
        )}

        {/* Close Button - Mobile (posição absoluta) */}
        {!collapsed && (
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 top-4 p-1.5 rounded-lg transition-colors text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        )}
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
                "my-4 border-t opacity-20 border-white/20",
                collapsed ? 'mx-2' : 'mx-4'
              )} />
            );
          }
          
          // Section Title
          if ('sectionTitle' in item && item.sectionTitle) {
            if (collapsed) return null; // Hide section titles when collapsed
            return (
              <div key={`section-${index}`} className="px-4 py-2 mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-[#9C1E1E] text-white font-medium shadow-lg glow-exa'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <div className="relative">
                <item.icon size={20} className="flex-shrink-0" />
                
                {/* Badge compacto quando collapsed - OFFLINE */}
                {collapsed && item.path === '/admin/monitoramento-ia/paineis' && totalOffline > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-500/80 ring-2 ring-red-400/50">
                    {totalOffline}
                  </span>
                )}
                
                {/* Badge compacto quando collapsed - CRM */}
                {collapsed && item.path === '/admin/monitoramento-ia/crm' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <>
                  <span className="text-sm">{item.title}</span>
                  
                  {/* Badge de painéis OFFLINE - apenas para Monitoramento */}
                  {item.path === '/admin/monitoramento-ia/paineis' && totalOffline > 0 && (
                    <span className={cn(
                      "ml-auto text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                      "bg-red-600 text-white",
                      "animate-[pulse_1s_ease-in-out_infinite] shadow-lg shadow-red-500/80",
                      "ring-2 ring-red-400/50 ring-offset-1 ring-offset-transparent"
                    )}>
                      <AlertTriangle className="w-3 h-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
                      {totalOffline}
                    </span>
                  )}
                  
                  {/* Badge de mensagens não lidas - apenas para CRM */}
                  {item.path === '/admin/monitoramento-ia/crm' && unreadCount > 0 && (
                    <span className={cn(
                      "ml-auto text-xs font-bold px-2 py-1 rounded-full",
                      "bg-red-500 text-white",
                      "animate-pulse shadow-lg shadow-red-500/50"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                  {/* Badge padrão (NOVO, BETA) - só mostra se não tiver badges dinâmicos */}
                  {item.badge && 
                   !(item.path === '/admin/monitoramento-ia/crm' && unreadCount > 0) && 
                   !(item.path === '/admin/monitoramento-ia/paineis' && totalOffline > 0) && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
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
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0A0A]/80 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 p-4 transition-colors text-white/70 hover:text-white hover:bg-white/5",
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
