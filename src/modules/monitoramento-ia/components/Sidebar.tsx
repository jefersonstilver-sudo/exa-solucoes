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
import { useUnreadCount } from '../hooks/useUnreadCount';

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
  
  return (
    <aside
      className={cn(
        `fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-40 border-r`,
        collapsed ? 'w-16' : 'w-64',
        theme === 'dark' 
          ? 'bg-gradient-to-b from-[#6B1010] via-[#4A0A0A] to-[#2D0606] border-[#9C1E1E]/40 text-white shadow-2xl'
          : 'bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 border-[#9C1E1E]/20 text-[#0A0A0A] backdrop-blur-xl shadow-lg',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header - Glassmorphism com logo reorganizado */}
      <div className={cn(
        "p-5 border-b flex items-center justify-center relative",
        theme === 'dark' ? 'border-white/10' : 'border-[#9C1E1E]/15'
      )}>
        {!collapsed && (
          <div className="flex flex-col items-center gap-2 w-full">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA" 
              className={cn(
                "h-12 w-auto",
                theme === 'dark' ? 'brightness-0 invert' : ''
              )}
            />
            <p className={cn(
              "text-sm font-semibold tracking-wider uppercase",
              theme === 'dark' ? 'text-white/80' : 'text-[#0A0A0A]/70'
            )}>Monitoramento</p>
          </div>
        )}
        
        {collapsed && (
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA" 
              className={cn(
                "h-10 w-10 object-contain",
                theme === 'dark' ? 'brightness-0 invert' : ''
              )}
            />
          </div>
        )}

        {/* Toggle Button - Desktop (posição absoluta) */}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:block absolute right-4 top-4 p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-white hover:bg-white/10' 
                : 'text-[#9C1E1E] hover:bg-[#9C1E1E]/10'
            )}
            title="Retrair sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:block p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-white hover:bg-white/10' 
                : 'text-[#9C1E1E] hover:bg-[#9C1E1E]/10'
            )}
            title="Expandir sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Close Button - Mobile (posição absoluta) */}
        {!collapsed && (
          <button
            onClick={onClose}
            className={cn(
              "lg:hidden absolute right-4 top-4 p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-white hover:bg-white/10' 
                : 'text-[#9C1E1E] hover:bg-[#9C1E1E]/10'
            )}
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
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  theme === 'dark' ? 'text-white/60' : 'text-[#0A0A0A]/50'
                )}>
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
                      ? 'bg-[#9C1E1E] text-white font-medium shadow-lg glow-exa'
                      : 'bg-[#9C1E1E] text-white font-medium shadow-lg glow-exa'
                    : theme === 'dark'
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-[#0A0A0A]/70 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm">{item.title}</span>
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
                  {/* Badge padrão (NOVO, BETA) - só mostra se não tiver unread */}
                  {item.badge && !(item.path === '/admin/monitoramento-ia/crm' && unreadCount > 0) && (
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
        theme === 'dark' 
          ? 'border-white/10 bg-[#0A0A0A]/80 backdrop-blur-sm' 
          : 'border-[#9C1E1E]/15 bg-white/80 backdrop-blur-sm'
      )}>
        <button
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 p-4 transition-colors",
            collapsed ? 'justify-center' : '',
            theme === 'dark'
              ? 'text-white/70 hover:text-white hover:bg-white/5'
              : 'text-[#0A0A0A]/70 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
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
