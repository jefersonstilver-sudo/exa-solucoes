import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ShoppingBag, User, LogOut, Receipt, MessageCircle } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import exaLogo from '@/assets/exa-logo.png';

/**
 * EXA 2.0 — barra lateral do anunciante: vermelho EXA profundo, com luz suave no topo (sem degradê para o preto),
 * itens em vidro fosco e item ativo em pílula branca. Responsiva: recolhe para ícones e vira gaveta no celular.
 */
interface AdvertiserSidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

const ITENS = [
  { title: 'Meus pedidos', href: '/anunciante/pedidos', icon: ShoppingBag },
  { title: 'Faturas', href: '/anunciante/faturas', icon: Receipt },
  { title: 'Meu perfil', href: '/anunciante/configuracoes', icon: User },
];

const AdvertiserSidebarContent = ({ onItemClick, isCollapsed = false }: AdvertiserSidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserSession();
  const empresa = String((user as any)?.empresa_nome || '').trim();
  const nome = String(user?.nome || user?.email?.split('@')[0] || 'Anunciante').trim();
  const inicial = (empresa || nome).charAt(0).toUpperCase() || 'A';
  const preservedSearch = location.search.includes('impersonate=') || location.search.includes('embedded=') ? location.search : '';

  const sair = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Você saiu da sua conta');
      navigate('/');
    } catch {
      toast.error('Não foi possível sair agora');
    }
  };

  const ativo = (href: string) =>
    href === '/anunciante/pedidos'
      ? location.pathname.startsWith('/anunciante/pedidos') || location.pathname.startsWith('/anunciante/pedido/')
      : location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col overflow-hidden text-white transition-all duration-300',
        'bg-[#8a1a1e] bg-[radial-gradient(140%_70%_at_0%_0%,#b2272d_0%,rgba(178,39,45,0)_60%),radial-gradient(120%_60%_at_100%_100%,#6d1317_0%,rgba(109,19,23,0)_70%)]',
        isCollapsed ? 'w-[72px]' : 'w-72'
      )}
    >
      {/* brilho fino na borda direita */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/25 via-white/5 to-transparent" />

      {/* Marca */}
      <div className={cn('flex items-center', isCollapsed ? 'justify-center px-3 pb-4 pt-6' : 'px-6 pb-5 pt-7')}>
        <Link to={`/anunciante/pedidos${preservedSearch}`} onClick={onItemClick} className="flex items-center gap-3">
          <img src={exaLogo} alt="EXA" className={cn('w-auto drop-shadow-sm', isCollapsed ? 'h-6' : 'h-8')} />
          {!isCollapsed && (
            <span className="border-l border-white/20 pl-3 text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-white/70">
              Área do<br />anunciante
            </span>
          )}
        </Link>
      </div>

      {/* Conta */}
      <div className={cn(isCollapsed ? 'flex flex-col items-center gap-2 px-2 pb-4' : 'px-4 pb-5')}>
        <div className={cn('flex items-center', isCollapsed ? 'flex-col gap-2' : 'gap-3 rounded-2xl bg-white/[0.09] p-3 ring-1 ring-inset ring-white/[0.12] backdrop-blur-sm')}>
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#8a1a1e] shadow-sm" title={empresa || nome}>
            {inicial}
          </span>
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold text-white">{empresa || nome}</span>
              {empresa && <span className="block truncate text-[12px] text-white/60">{nome}</span>}
            </span>
          )}
          <span className="flex-none [&_button:hover]:bg-white/10 [&_button]:text-white/80 [&_svg]:text-white/80">
            <NotificationCenter />
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className={cn('flex-1 overflow-y-auto', isCollapsed ? 'space-y-1.5 p-2' : 'space-y-1 px-3 py-1')}>
        {!isCollapsed && <div className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/45">Menu</div>}
        {ITENS.map((it) => {
          const on = ativo(it.href);
          return (
            <Link
              key={it.href}
              to={`${it.href}${preservedSearch}`}
              onClick={onItemClick}
              title={isCollapsed ? it.title : undefined}
              className={cn(
                'group relative flex items-center rounded-xl text-[14px] font-semibold transition-all duration-200',
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5',
                on ? 'bg-white text-[#8a1a1e] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)]' : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <it.icon className={cn('h-[18px] w-[18px] flex-none transition-transform group-hover:scale-105', on ? 'text-[#8a1a1e]' : 'text-white/70 group-hover:text-white')} />
              {!isCollapsed && <span>{it.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Ajuda + sair */}
      <div className={cn('space-y-1 border-t border-white/10', isCollapsed ? 'p-2' : 'p-3')}>
        <a
          href="https://wa.me/5545991415920"
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? 'Falar com a Sofia' : undefined}
          className={cn('flex items-center rounded-xl text-[13.5px] font-semibold text-white hover:bg-white/10', isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5')}
        >
          <span className="relative flex-none">
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#34d27b] ring-2 ring-[#8a1a1e]" />
          </span>
          {!isCollapsed && <span>Falar com a Sofia</span>}
        </a>
        <button
          onClick={sair}
          title={isCollapsed ? 'Sair' : undefined}
          className={cn('flex w-full items-center rounded-xl text-[13.5px] font-semibold text-white/60 hover:bg-white/10 hover:text-white', isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5')}
        >
          <LogOut className="h-[18px] w-[18px] flex-none" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdvertiserSidebarContent;
