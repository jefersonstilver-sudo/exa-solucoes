import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, LogOut, MessageCircle, MoreHorizontal, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { useLogoEmpresa } from '@/hooks/exa2/useLogoEmpresa';
import LogoSelo from '@/components/exa2/LogoSelo';
import { useCorNavegador } from '@/lib/corNavegador';
import NotificationCenter from '@/components/admin/layout/NotificationCenter';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Área do anunciante no celular — "cara de app":
 *  - topo fino com a marca EXA (no pedido: seta de voltar + marca no centro), notificações e o selo da empresa;
 *  - barra inferior com Pedidos · Sofia · Perfil · Mais (sem gaveta lateral vermelha).
 * O topo respeita o entalhe do iPhone (safe-area) e a barra some com o teclado aberto.
 */

const SOFIA_WA = 'https://wa.me/5545991415920';

const useConta = () => {
  const { user } = useUserSession();
  const empresa = String((user as any)?.empresa_nome || '').trim();
  const nome = String(user?.nome || user?.email?.split('@')[0] || 'Anunciante').trim();
  const inicial = (empresa || nome).charAt(0).toUpperCase() || 'A';
  const logo = useLogoEmpresa((user as any)?.id, (user as any)?.avatar_url || null);
  return { user, empresa, nome, inicial, logo, email: String((user as any)?.email || '') };
};

const usePreservar = () => {
  const { search } = useLocation();
  return search.includes('impersonate=') || search.includes('embedded=') ? search : '';
};

const Selo: React.FC<{ logo: string | null; inicial: string; className?: string }> = ({ logo, inicial, className }) =>
  logo ? (
    <LogoSelo src={logo} fallback={inicial} className={cn('h-9 w-9 ring-1 ring-black/[0.06]', className)} rounded="rounded-full" pad="p-1" />
  ) : (
    <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#9C1E1E] text-[13px] font-extrabold text-white', className)}>{inicial}</span>
  );

export const AnuncianteAppTopo: React.FC = () => {
  useCorNavegador({ topo: '#FFFFFF' }); // no navegador do celular, a faixa de cima acompanha o topo branco
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const preservar = usePreservar();
  const { logo, inicial } = useConta();
  const noPedido = /\/anunciante\/pedido(-classico)?\//.test(pathname);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const f = () => setRolou(window.scrollY > 4);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <header
      className={cn(
        'pwa-topo sticky top-0 z-40 bg-[#f3f1f2]/95 backdrop-blur-xl backdrop-saturate-150 transition-shadow',
        rolou && 'shadow-[0_1px_0_rgba(27,23,25,0.06)]'
      )}
    >
      <div className="relative flex h-14 items-center justify-between gap-2 px-3">
        {noPedido ? (
          <button
            type="button"
            onClick={() => navigate(`/anunciante/pedidos${preservar}`)}
            className="-ml-1 flex h-10 items-center gap-0.5 rounded-full pl-1.5 pr-3 text-[15px] font-semibold text-[#9C1E1E] active:bg-black/[0.04]"
            aria-label="Voltar para os pedidos"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.4} /> Pedidos
          </button>
        ) : (
          <Link to={`/anunciante/pedidos${preservar}`} className="flex items-center pl-1" aria-label="EXA, meus pedidos">
            <img src="/site/exa-preto.svg" alt="EXA" className="h-[22px] w-auto" />
          </Link>
        )}

        {noPedido && (
          <img src="/site/exa-preto.svg" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 h-[18px] w-auto -translate-x-1/2 opacity-90" />
        )}

        {/* gap maior: o número de notificações ("50") ficava em cima do selo da empresa */}
        <div className="flex items-center gap-2.5">
          <span className="[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full">
            <NotificationCenter />
          </span>
          <Link to={`/anunciante/configuracoes${preservar}`} aria-label="Meu perfil" className="rounded-full p-0.5 active:scale-95">
            <Selo logo={logo} inicial={inicial} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export const AnuncianteNavInferior: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const preservar = usePreservar();
  const [mais, setMais] = useState(false);
  const conta = useConta();

  const sair = async () => {
    setMais(false);
    try {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Não foi possível sair agora');
    }
  };

  const pedidosAtivo = pathname.startsWith('/anunciante/pedido');
  const perfilAtivo = pathname.startsWith('/anunciante/configuracoes') || pathname.startsWith('/anunciante/perfil');
  const item = 'relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors';
  const cor = (on: boolean) => (on ? 'text-[#9C1E1E]' : 'text-[#8b8285] active:text-[#1b1719]');
  const Marca = ({ on }: { on: boolean }) => (on ? <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#9C1E1E]" /> : null);

  return (
    <>
      <nav
        className="exa-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.05] bg-white backdrop-saturate-150 shadow-[0_-10px_30px_-22px_rgba(70,20,20,0.4)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Menu principal"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
          <NavLink to={`/anunciante/pedidos${preservar}`} className={cn(item, cor(pedidosAtivo))}>
            <Marca on={pedidosAtivo} />
            <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={pedidosAtivo ? 2.3 : 1.9} />
            Pedidos
          </NavLink>
          <a href={SOFIA_WA} target="_blank" rel="noopener noreferrer" className={cn(item, cor(false))}>
            <span className="relative">
              <MessageCircle className="h-[22px] w-[22px]" strokeWidth={1.9} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#25D366] ring-2 ring-white" />
            </span>
            Sofia
          </a>
          <NavLink to={`/anunciante/configuracoes${preservar}`} className={cn(item, cor(perfilAtivo))}>
            <Marca on={perfilAtivo} />
            <User className="h-[22px] w-[22px]" strokeWidth={perfilAtivo ? 2.3 : 1.9} />
            Perfil
          </NavLink>
          <button type="button" onClick={() => setMais(true)} className={cn(item, cor(mais))}>
            <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.9} />
            Mais
          </button>
        </div>
      </nav>

      <Sheet open={mais} onOpenChange={setMais}>
        <SheetContent side="bottom" className="rounded-t-[26px] border-0 [&>button.absolute]:hidden px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
          <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-black/10" aria-hidden="true" />
          <SheetTitle className="sr-only">Mais opções</SheetTitle>
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f7f5f6] p-3">
            <Selo logo={conta.logo} inicial={conta.inicial} className="h-11 w-11" />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold text-[#1b1719]">{conta.empresa || conta.nome}</div>
              <div className="truncate text-[12.5px] text-[#8b8285]">{conta.email}</div>
            </div>
          </div>
          <div className="divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-[#f7f5f6]">
            {[
              { i: FileText, t: 'Termos de uso', to: '/termos-uso' },
              { i: ShieldCheck, t: 'Política de privacidade', to: '/politica-privacidade' },
            ].map(({ i: I, t, to }) => (
              <Link key={to} to={to} onClick={() => setMais(false)} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium text-[#1b1719] active:bg-black/[0.03]">
                <I className="h-5 w-5 text-[#8b8285]" /> {t}
              </Link>
            ))}
          </div>
          <button type="button" onClick={sair} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fdf1f2] py-3.5 text-[15px] font-bold text-[#C7141A] active:bg-[#fbe4e6]">
            <LogOut className="h-5 w-5" /> Sair da conta
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
};
