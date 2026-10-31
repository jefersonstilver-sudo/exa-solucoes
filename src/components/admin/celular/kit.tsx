/**
 * Peças do painel admin no celular — mesma linguagem do Dashboard e dos Painéis EXA:
 * fundo areia, cartões de vidro, Manrope, vermelho EXA, toques de 44px, nada saindo da tela.
 */
import React from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

export const vidro =
  'bg-white/75 backdrop-blur-xl backdrop-saturate-150 border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(70,20,20,0.3)]';

export const VERMELHO = '#9C1E1E';

/** Página inteira no celular: sangra até as bordas do <main> (que tem p-3) e pinta o fundo. */
export const PaginaCelular: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn('-m-3 min-h-full bg-[#F4F1EC] px-4 pb-6 pt-3 text-[#17181A]', className)}
    style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
  >
    {children}
  </div>
);

/** Título grande + ações em botões redondos (nunca estoura a largura). */
export const TopoCelular: React.FC<{ titulo: string; sub?: React.ReactNode; acoes?: React.ReactNode }> = ({ titulo, sub, acoes }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div className="min-w-0">
      {sub && <div className="truncate text-[13px] font-semibold text-[#6A6B70]">{sub}</div>}
      <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{titulo}</h1>
    </div>
    {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
  </div>
);

/** Botão redondo de ação (atualizar, filtros…). */
export const BotaoRedondo: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string; ativo?: boolean }> = ({ rotulo, ativo, className, children, ...p }) => (
  <button
    type="button"
    aria-label={rotulo}
    title={rotulo}
    className={cn(vidro, 'relative grid h-11 w-11 place-items-center rounded-full text-[#45464A] active:scale-95 disabled:opacity-50', ativo && 'text-[#9C1E1E]', className)}
    {...p}
  >
    {children}
  </button>
);

/** Ação principal (Novo prédio, Novo usuário…): pílula vermelha compacta. */
export const BotaoPrincipal: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...p }) => (
  <button
    type="button"
    className={cn('inline-flex h-11 items-center gap-1.5 rounded-full bg-[#9C1E1E] px-4 text-[14px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(156,30,30,0.8)] active:scale-[.97] disabled:opacity-60', className)}
    {...p}
  >
    {children}
  </button>
);

export type Kpi = { rotulo: string; valor: React.ReactNode; cor?: string; ativo?: boolean; onClick?: () => void };

/** Números do topo: 2, 3 ou 4 por linha, tocáveis quando filtram a lista. */
export const Kpis: React.FC<{ itens: Kpi[]; colunas?: 2 | 3 | 4 }> = ({ itens, colunas = 3 }) => (
  <div className={cn('mb-3 grid gap-2', colunas === 2 ? 'grid-cols-2' : colunas === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
    {itens.map((k) => {
      const Tag: any = k.onClick ? 'button' : 'div';
      return (
        <Tag
          key={k.rotulo}
          type={k.onClick ? 'button' : undefined}
          onClick={k.onClick}
          className={cn(vidro, 'min-w-0 rounded-[18px] py-2.5 text-left', colunas === 4 ? 'px-2.5' : 'px-3', k.onClick && 'active:scale-[.98]', k.ativo && 'ring-2 ring-[#9C1E1E]/60')}
        >
          <div className={cn('truncate font-extrabold leading-none tracking-[-0.02em]', colunas === 4 ? 'text-[20px]' : 'text-[22px]')} style={{ color: k.cor || '#17181A' }}>{k.valor}</div>
          <div className={cn('mt-1 font-bold leading-tight text-[#6A6B70]', colunas === 4 ? 'text-[10.5px] tracking-[-0.01em]' : 'truncate text-[11.5px]')}>{k.rotulo}</div>
        </Tag>
      );
    })}
  </div>
);

export const BuscaCelular: React.FC<{ valor: string; onChange: (v: string) => void; placeholder?: string; className?: string }> = ({ valor, onChange, placeholder = 'Buscar', className }) => (
  <label className={cn(vidro, 'mb-3 flex h-12 items-center gap-2 rounded-2xl px-3.5', className)}>
    <Search className="h-[18px] w-[18px] shrink-0 text-[#8A8B90]" />
    <input
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode="search"
      className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#9A9BA0]"
    />
    {valor && (
      <button type="button" onClick={() => onChange('')} aria-label="Limpar busca" className="grid h-8 w-8 place-items-center rounded-full text-[#8A8B90] active:bg-black/5">
        <X className="h-4 w-4" />
      </button>
    )}
  </label>
);

export type Pilula = { valor: string; rotulo: string; n?: number };

/** Filtro em pílulas que rolam para o lado (sem barra de rolagem visível). */
export const Pilulas: React.FC<{ opcoes: Pilula[]; valor: string; onChange: (v: string) => void; className?: string }> = ({ opcoes, valor, onChange, className }) => (
  <div className={cn('-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
    {opcoes.map((o) => {
      const on = o.valor === valor;
      return (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-bold transition-colors',
            on ? 'bg-[#17181A] text-white' : 'bg-white/80 text-[#45464A] border border-black/[0.06]'
          )}
        >
          {o.rotulo}
          {typeof o.n === 'number' && <span className={cn('text-[12px] font-extrabold', on ? 'text-white/70' : 'text-[#9A9BA0]')}>{o.n}</span>}
        </button>
      );
    })}
  </div>
);

export const CartaoCelular: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...p }) => (
  <div className={cn(vidro, 'rounded-[22px]', className)} {...p} />
);

/** Linha tocável de lista (abre o detalhe). */
export const LinhaCelular: React.FC<{
  onClick?: () => void;
  inicio?: React.ReactNode;
  titulo: React.ReactNode;
  direita?: React.ReactNode;
  linha2?: React.ReactNode;
  linha3?: React.ReactNode;
  seta?: boolean;
}> = ({ onClick, inicio, titulo, direita, linha2, linha3, seta = true }) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/[0.03]">
      {inicio}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{titulo}</span>
          {direita}
        </span>
        {linha2 && <span className="mt-0.5 block truncate text-[13px] text-[#5E5F63]">{linha2}</span>}
        {linha3 && <span className="mt-1 flex flex-wrap items-center gap-1.5">{linha3}</span>}
      </span>
      {seta && onClick && <ChevronRight className="h-4 w-4 shrink-0 text-[#C9C1C3]" />}
    </Tag>
  );
};

/** Selo pequeno (status). */
export const Selo: React.FC<{ fundo: string; cor: string; ponto?: string; children: React.ReactNode }> = ({ fundo, cor, ponto, children }) => (
  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold" style={{ background: fundo, color: cor }}>
    {ponto && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ponto }} />}
    {children}
  </span>
);

export const SELO = {
  verde: { fundo: '#EAF5EF', cor: '#1E6B47', ponto: '#2E9B62' },
  vermelho: { fundo: '#FCE9E7', cor: '#B0261D', ponto: '#D93A2B' },
  ambar: { fundo: '#FCF1DF', cor: '#9A5300', ponto: '#E08A1E' },
  azul: { fundo: '#EEF2FB', cor: '#2B4C8C', ponto: '#4A6FC0' },
  cinza: { fundo: '#EFEDEA', cor: '#5E5F63', ponto: '#9A9BA0' },
  roxo: { fundo: '#F2ECFA', cor: '#5B3A8C', ponto: '#8B63C7' },
} as const;

export const Vazio: React.FC<{ icone?: React.ReactNode; titulo: string; texto?: string }> = ({ icone, titulo, texto }) => (
  <CartaoCelular className="px-6 py-10 text-center">
    {icone && <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#8A8B90]">{icone}</div>}
    <div className="text-[15px] font-bold">{titulo}</div>
    {texto && <p className="mt-1 text-[13px] text-[#6A6B70]">{texto}</p>}
  </CartaoCelular>
);

export const Carregando: React.FC<{ linhas?: number }> = ({ linhas = 5 }) => (
  <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
    {Array.from({ length: linhas }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-black/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-black/[0.07]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-black/[0.05]" />
        </div>
      </div>
    ))}
  </CartaoCelular>
);

/* ---------- Folha de baixo (filtros e ações) ---------- */

export const FolhaCelular: React.FC<{ aberta: boolean; onFechar: () => void; titulo: string; children: React.ReactNode }> = ({ aberta, onFechar, titulo, children }) => (
  <Drawer open={aberta} onOpenChange={(v) => { if (!v) onFechar(); }}>
    <DrawerContent className="max-h-[88dvh] rounded-t-[26px] bg-[#F7F5F2]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <DrawerTitle className="px-5 pt-3 text-[18px] font-extrabold tracking-[-0.01em] text-[#17181A]">{titulo}</DrawerTitle>
      <DrawerDescription className="sr-only">{titulo}</DrawerDescription>
      <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3">{children}</div>
    </DrawerContent>
  </Drawer>
);

/** Item de ação dentro da folha. */
export const AcaoFolha: React.FC<{ icone?: React.ReactNode; rotulo: string; onClick: () => void; perigo?: boolean; disabled?: boolean }> = ({ icone, rotulo, onClick, perigo, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn('flex h-[52px] w-full items-center gap-3 rounded-2xl px-4 text-left text-[15.5px] font-bold active:bg-black/[0.05] disabled:opacity-50', perigo ? 'text-[#B0261D]' : 'text-[#17181A]')}
  >
    {icone && <span className="grid h-5 w-5 place-items-center">{icone}</span>}
    {rotulo}
  </button>
);

/** Grupo de opções de filtro dentro da folha. */
export const GrupoFiltro: React.FC<{ titulo: string; opcoes: Pilula[]; valor: string; onChange: (v: string) => void }> = ({ titulo, opcoes, valor, onChange }) => (
  <div className="mb-4">
    <div className="mb-2 px-1 text-[12px] font-extrabold uppercase tracking-[0.07em] text-[#6A6B70]">{titulo}</div>
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const on = o.valor === valor;
        return (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)}
            className={cn('h-10 rounded-full px-4 text-[14px] font-bold', on ? 'bg-[#17181A] text-white' : 'bg-white text-[#45464A] border border-black/[0.08]')}>
            {o.rotulo}{typeof o.n === 'number' ? ` · ${o.n}` : ''}
          </button>
        );
      })}
    </div>
  </div>
);
