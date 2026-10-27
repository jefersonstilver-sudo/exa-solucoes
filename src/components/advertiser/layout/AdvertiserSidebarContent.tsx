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
 * EXA 2.0 — barra lateral do anunciante: clara, limpa e responsiva.
 * Mesma linguagem da página do pedido (fundo #f3f1f2, vermelho #9C1E1E só como destaque).
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
        'flex h-screen flex-col overflow-hidden border-r border-[#ebe6e7] bg-white transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-72'
      )}
    >
      {/* Marca */}
      <div className={cn('flex items-center gap-3 border-b border-[#f1eded]', isCollapsed ? 'justify-center px-3 py-5' : 'px-5 py-5')}>
        <Link to={`/anunciante/pedidos${preservedSearch}`} onClick={onItemClick} className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#9C1E1E] shadow-sm">
            <img src={exaLogo} alt="EXA" className="h-5 w-auto" />
          </span>
          {!isCollapsed && (
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-[#1b1719]">Área do anunciante</span>
              <span className="block text-[11.5px] font-medium text-[#8b8285]">EXA Mídia</span>
            </span>
          )}
        </Link>
      </div>

      {/* Conta */}
      <div className={cn('border-b border-[#f1eded]', isCollapsed ? 'flex flex-col items-center gap-2 px-2 py-4' : 'px-4 py-4')}>
        <div className={cn('flex items-center', isCollapsed ? 'flex-col gap-2' : 'gap-3 rounded-2xl bg-[#f7f4f5] p-3')}>
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#1b1719] text-sm font-bold text-white" title={empresa || nome}>
            {inicial}
          </span>
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold text-[#1b1719]">{empresa || nome}</span>
              {empresa && <span className="block truncate text-[12px] text-[#8b8285]">{nome}</span>}
            </span>
          )}
          <span className={cn('flex-none [&_button]:text-[#554e50] [&_svg]:text-[#554e50]')}>
            <NotificationCenter />
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className={cn('flex-1 overflow-y-auto', isCollapsed ? 'space-y-1 p-2' : 'space-y-1 p-3')}>
        {ITENS.map((it) => {
          const on = ativo(it.href);
          return (
            <Link
              key={it.href}
              to={`${it.href}${preservedSearch}`}
              onClick={onItemClick}
              title={isCollapsed ? it.title : undefined}
              className={cn(
                'group relative flex items-center rounded-xl text-[14px] font-semibold transition-colors',
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5',
                on ? 'bg-[#9C1E1E]/[0.08] text-[#9C1E1E]' : 'text-[#554e50] hover:bg-[#f5f1f2] hover:text-[#1b1719]'
              )}
            >
              {on && !isCollapsed && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#9C1E1E]" />}
              <it.icon className={cn('h-[18px] w-[18px] flex-none', on ? 'text-[#9C1E1E]' : 'text-[#8b8285] group-hover:text-[#1b1719]')} />
              {!isCollapsed && <span>{it.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Ajuda + sair */}
      <div className={cn('space-y-1 border-t border-[#f1eded]', isCollapsed ? 'p-2' : 'p-3')}>
        <a
          href="https://wa.me/5545991415920"
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? 'Falar com a Sofia' : undefined}
          className={cn('flex items-center rounded-xl text-[13.5px] font-semibold text-[#13a24a] hover:bg-[#13a24a]/[0.07]', isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5')}
        >
          <MessageCircle className="h-[18px] w-[18px] flex-none" />
          {!isCollapsed && <span>Falar com a Sofia</span>}
        </a>
        <button
          onClick={sair}
          title={isCollapsed ? 'Sair' : undefined}
          className={cn('flex w-full items-center rounded-xl text-[13.5px] font-semibold text-[#8b8285] hover:bg-[#f5f1f2] hover:text-[#1b1719]', isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5')}
        >
          <LogOut className="h-[18px] w-[18px] flex-none" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdvertiserSidebarContent;
