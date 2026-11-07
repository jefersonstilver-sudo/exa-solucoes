// EXA (07/11/2026) — kit visual único do painel administrativo (computador). Pedido do Jeferson: todas as páginas
// no mesmo desenho da página Painéis EXA — vidro, cabeçalho grande, resumo com número e barra, chips, botões retos.
// O kit do celular está em components/admin/celular/kit.tsx. Aqui só o que o computador usa.
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Search } from 'lucide-react';

export const VERMELHO = '#9C1E1E';
export const TINTA = '#17181A';
export const CINZA = '#6A6B70';
export const CINZA_CLARO = '#8A8B90';
export const VERDE = '#1E6B47';
export const AMBAR = '#9A5300';
export const AZUL = '#2B4C8C';
export const ERRO = '#B0261D';

/** Vidro: o mesmo da página Painéis EXA. */
export const vidro =
  'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(70,20,20,0.3)]';

export const ROTULO = 'text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]';
export const CAMPO = 'h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#17181A] outline-none focus:ring-2 focus:ring-[#B4231C]';
export const BOTAO = 'inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(156,30,30,0.8)] transition hover:bg-[#7c1428] disabled:opacity-50';
export const BOTAO2 = `inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-[#17181A] ${vidro} transition hover:bg-white disabled:opacity-50`;
export const BOTAO_FANTASMA = 'inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#6A6B70] transition hover:bg-black/[0.04] hover:text-[#17181A] disabled:opacity-50';

/** Moldura da página: largura, espaçamento e números tabulares. */
export const Pagina: React.FC<{ children: React.ReactNode; larga?: boolean; className?: string }> = ({ children, larga, className = '' }) => (
  <div className={`mx-auto ${larga ? 'max-w-[1600px]' : 'max-w-[1400px]'} space-y-5 text-[#17181A] md:space-y-6 ${className}`} style={{ fontFeatureSettings: '"tnum"' }}>{children}</div>
);

/** Cabeçalho grande: título, uma linha de contexto e as ações à direita. */
export const Cabecalho: React.FC<{ titulo: React.ReactNode; sub?: React.ReactNode; aoVivo?: string | boolean; acoes?: React.ReactNode }> = ({ titulo, sub, aoVivo, acoes }) => (
  <header className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[30px]">{titulo}</h1>
      {aoVivo && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E6B47]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2E9B62]" />{typeof aoVivo === 'string' ? aoVivo : 'ao vivo'}</span>
      )}
      {sub && <span className="text-xs font-bold text-[#6A6B70]">{sub}</span>}
    </div>
    {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
  </header>
);

/** Abas segmentadas (Visão geral · Conexões). */
export const Segmentos: React.FC<{ opcoes: { valor: string; rotulo: React.ReactNode }[]; valor: string; onChange: (v: string) => void }> = ({ opcoes, valor, onChange }) => (
  <div className="inline-flex rounded-xl bg-black/[0.05] p-1" role="tablist">
    {opcoes.map((o) => (
      <button key={o.valor} type="button" role="tab" aria-selected={valor === o.valor} onClick={() => onChange(o.valor)}
        className={`h-8 rounded-lg px-3 text-sm font-bold transition-colors ${valor === o.valor ? 'bg-white shadow-sm' : 'text-[#5E5F63] hover:text-[#17181A]'}`}>{o.rotulo}</button>
    ))}
  </div>
);

/** Resumo: o número principal (com barra de progresso) à esquerda e até 4 contadores à direita, como na página Painéis. */
export interface ContadorResumo { rotulo: string; valor: React.ReactNode; cor?: string; ativo?: boolean; onClick?: () => void; sub?: React.ReactNode }
export const Resumo: React.FC<{
  rotulo: string; valor: React.ReactNode; de?: React.ReactNode; cor?: string; progresso?: number; nota?: React.ReactNode; onClick?: () => void;
  contadores?: ContadorResumo[];
}> = ({ rotulo, valor, de, cor = VERDE, progresso, nota, onClick, contadores = [] }) => (
  <section aria-label="Resumo" className={`${vidro} grid gap-4 rounded-[22px] p-4 md:grid-cols-[1.2fr_2fr] md:items-center md:p-5`}>
    <button type="button" onClick={onClick} className={`text-left ${onClick ? '' : 'cursor-default'}`}>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: cor }}>{rotulo}</span>
      <span className="mt-1 flex items-baseline gap-2">
        <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em]" style={{ color: cor }}>{valor}</span>
        {de && <span className="text-base font-bold text-[#8A8B90]">{de}</span>}
      </span>
      {progresso != null && (
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <span className="block h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, progresso))}%`, background: cor }} />
        </span>
      )}
      {nota && <span className="mt-2 block text-xs font-bold text-[#6A6B70]">{nota}</span>}
    </button>
    {contadores.length > 0 && (
      <div className={`grid gap-2 ${contadores.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : `grid-cols-${contadores.length}`}`}>
        {contadores.map((k) => (
          <button key={k.rotulo} type="button" onClick={k.onClick} className={`rounded-2xl px-3 py-2.5 text-left transition-colors ${k.ativo ? 'bg-white ring-2 ring-[#B4231C]/30' : 'bg-white/70 hover:bg-white'} ${k.onClick ? '' : 'cursor-default'}`}>
            <span className="block text-[11px] font-bold text-[#6A6B70]">{k.rotulo}</span>
            <span className="block text-[26px] font-extrabold leading-tight" style={{ color: k.cor || TINTA }}>{k.valor}</span>
            {k.sub && <span className="block truncate text-[11px] font-semibold text-[#8A8B90]">{k.sub}</span>}
          </button>
        ))}
      </div>
    )}
  </section>
);

/** Indicador pequeno (KPI) em linha de 4 a 7. */
export const Kpi: React.FC<{ rotulo: string; valor: React.ReactNode; sub?: React.ReactNode; cor?: string; icone?: React.ElementType; to?: string; onClick?: () => void }> = ({ rotulo, valor, sub, cor = TINTA, icone: I, to, onClick }) => {
  const grande = String(valor).length > 9;
  const inner = (
    <>
      {I && <I className="absolute right-3.5 top-3.5 h-4 w-4 text-black/20" aria-hidden="true" />}
      <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">{rotulo}</span>
      <span className={`mt-1 block font-extrabold leading-none tracking-[-0.03em] tabular-nums ${grande ? 'text-[20px] xl:text-[24px]' : 'text-[26px]'}`} style={{ color: cor }}>{valor}</span>
      {sub && <span className="mt-1.5 block truncate text-[12px] font-semibold text-[#8A8B90]">{sub}</span>}
    </>
  );
  const cls = `relative block w-full overflow-hidden rounded-2xl bg-white/80 px-4 py-3.5 text-left ring-1 ring-black/[0.05] ${to || onClick ? 'transition hover:bg-white' : ''}`;
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
};

/** Cartão de vidro genérico. */
export const Cartao: React.FC<React.HTMLAttributes<HTMLDivElement> & { apagado?: boolean }> = ({ className = '', apagado, ...p }) => (
  <div className={`${vidro} rounded-[22px] p-4 md:p-5 ${apagado ? 'opacity-60 grayscale-[0.5]' : ''} ${className}`} {...p} />
);

/** Seção com título em caixa alta e ação à direita. */
export const Secao: React.FC<{ titulo: React.ReactNode; acao?: { rotulo: string; to?: string; onClick?: () => void }; children: React.ReactNode; className?: string }> = ({ titulo, acao, children, className = '' }) => (
  <section className={`${vidro} rounded-[22px] p-4 md:p-5 ${className}`}>
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className={ROTULO}>{titulo}</h2>
      {acao && (acao.to
        ? <Link to={acao.to} className="inline-flex h-8 items-center gap-1 text-[13px] font-bold text-[#9C1E1E]">{acao.rotulo} <ChevronRight className="h-3.5 w-3.5" /></Link>
        : <button type="button" onClick={acao.onClick} className="inline-flex h-8 items-center gap-1 text-[13px] font-bold text-[#9C1E1E]">{acao.rotulo} <ChevronRight className="h-3.5 w-3.5" /></button>)}
    </div>
    {children}
  </section>
);

/** Chip de estado. */
export const Chip: React.FC<{ children: React.ReactNode; fundo?: string; cor?: string; ponto?: string; className?: string; title?: string }> = ({ children, fundo = 'rgba(23,24,26,0.05)', cor = '#45464A', ponto, className = '', title }) => (
  <span title={title} className={`inline-flex h-6 max-w-full items-center gap-1.5 truncate rounded-full px-2.5 text-[11px] font-bold ${className}`} style={{ background: fundo, color: cor }}>
    {ponto && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ponto }} />}{children}
  </span>
);
export const TOM = {
  verde: { fundo: '#EAF5EF', cor: '#1E6B47', ponto: '#2E9B62' },
  ambar: { fundo: '#FFF4E5', cor: '#9A5300', ponto: '#E08A00' },
  vermelho: { fundo: '#FDECEC', cor: '#B0261D', ponto: '#D93025' },
  azul: { fundo: '#EAF0FA', cor: '#2B4C8C', ponto: '#3E6BC4' },
  roxo: { fundo: '#F3EBF9', cor: '#7A3E9D', ponto: '#9B5DC4' },
  cinza: { fundo: 'rgba(23,24,26,0.05)', cor: '#45464A', ponto: '#8A8B90' },
} as const;

/** Barra de busca + filtros (recolhíveis no celular). */
export const Busca: React.FC<{ valor: string; onChange: (v: string) => void; placeholder?: string; children?: React.ReactNode }> = ({ valor, onChange, placeholder = 'Buscar', children }) => (
  <section aria-label="Buscar e filtrar" className={`${vidro} flex flex-col gap-2 rounded-[18px] p-3 md:flex-row md:flex-wrap md:items-center`}>
    <label className="relative flex-1 md:min-w-[260px]">
      <span className="sr-only">Buscar</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A6B70]" />
      <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${CAMPO} pl-9`} />
    </label>
    {children}
  </section>
);

/** Pílulas de filtro (Todos · Ativos · …). */
export const Pilulas: React.FC<{ opcoes: { valor: string; rotulo: string; n?: number }[]; valor: string; onChange: (v: string) => void }> = ({ opcoes, valor, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {opcoes.map((o) => (
      <button key={o.valor} type="button" onClick={() => onChange(o.valor)}
        className={`h-9 rounded-xl px-3 text-[13px] font-bold transition-colors ${valor === o.valor ? 'bg-[#17181A] text-white' : 'bg-white/70 text-[#45464A] hover:bg-white'}`}>
        {o.rotulo}{o.n != null && <span className={`ml-1.5 ${valor === o.valor ? 'text-white/60' : 'text-[#8A8B90]'}`}>{o.n}</span>}
      </button>
    ))}
  </div>
);

/** Lista de linhas num cartão (divisórias finas). */
export const Lista: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <ul className={`divide-y divide-black/[0.06] ${className}`}>{children}</ul>
);

export const Vazio: React.FC<{ icone?: React.ReactNode; titulo: string; texto?: React.ReactNode; acao?: React.ReactNode }> = ({ icone, titulo, texto, acao }) => (
  <div className={`${vidro} rounded-[22px] p-10 text-center`}>
    {icone && <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#8A8B90] ring-1 ring-black/[0.06]">{icone}</div>}
    <p className="text-[15px] font-bold">{titulo}</p>
    {texto && <p className="mt-0.5 text-sm text-[#6A6B70]">{texto}</p>}
    {acao && <div className="mt-4 flex justify-center">{acao}</div>}
  </div>
);

export const Carregando: React.FC<{ texto?: string }> = ({ texto = 'Carregando…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6A6B70]"><Loader2 className="h-4 w-4 animate-spin" /> {texto}</div>
);

/** Tabela leve de vidro (cabeçalho em caixa alta, linhas clicáveis). */
export const Tabela: React.FC<{ cabecalho: React.ReactNode[]; children: React.ReactNode; className?: string }> = ({ cabecalho, children, className = '' }) => (
  <div className={`${vidro} overflow-hidden rounded-[22px] ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left">{cabecalho.map((c, i) => <th key={i} className="whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#6A6B70]">{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-black/[0.06]">{children}</tbody>
      </table>
    </div>
  </div>
);

/** Paginação simples. */
export const Paginacao: React.FC<{ pagina: number; total: number; onChange: (p: number) => void }> = ({ pagina, total, onChange }) => total <= 1 ? null : (
  <div className="flex items-center justify-center gap-2">
    <button type="button" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} className={`${BOTAO2} disabled:opacity-40`}>Anterior</button>
    <span className="px-2 text-sm font-bold text-[#6A6B70]">{pagina} / {total}</span>
    <button type="button" disabled={pagina >= total} onClick={() => onChange(pagina + 1)} className={`${BOTAO2} disabled:opacity-40`}>Próxima</button>
  </div>
);

/** Interruptor. */
export const Interruptor: React.FC<{ on: boolean; onChange: (v: boolean) => void; rotulo?: string; desabilitado?: boolean }> = ({ on, onChange, rotulo, desabilitado }) => (
  <button type="button" role="switch" aria-checked={on} disabled={desabilitado} onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#17181A] disabled:opacity-50">
    <span className={`relative h-6 w-11 flex-none rounded-full transition ${on ? 'bg-[#2E9B62]' : 'bg-[#d9d2d4]'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
    {rotulo}
  </button>
);

/** Iniciais do nome, para avatar. */
export const iniciais = (nome?: string | null) => String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';
export const Avatar: React.FC<{ nome?: string | null; foto?: string | null; tamanho?: number; cor?: string }> = ({ nome, foto, tamanho = 36, cor = VERMELHO }) => (
  foto ? <img src={foto} alt="" className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />
    : <span className="grid shrink-0 place-items-center rounded-full text-[12px] font-extrabold" style={{ width: tamanho, height: tamanho, background: `${cor}1A`, color: cor }}>{iniciais(nome)}</span>
);
