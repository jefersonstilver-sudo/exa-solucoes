import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Users,
  CheckCircle2,
  TrendingUp,
  Eye,
  Download,
  RefreshCcw,
  X,
  Calendar as CalendarIcon,
  MessageCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

import { useSindicosList, SindicoRow } from '@/hooks/useSindicosList';
import { supabase } from '@/integrations/supabase/client';
import { useSindicosStats } from '@/hooks/useSindicosStats';
import { SindicoStatusBadge, STATUS_OPTIONS } from '@/components/admin/sindicos-interessados/SindicoStatusBadge';
import { SindicoDialog } from '@/components/admin/sindicos-interessados/SindicoDialog';
import { getSignedUrl } from '@/utils/storageSignedUrl';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { glass } from '@/modules/monitoramento-ia/components/paineis/estados';
import ExcluirComMotivo from '@/components/admin/ui/ExcluirComMotivo';
import { differenceInCalendarDays } from 'date-fns';
import { PaginaCelular, TopoCelular, BotaoRedondo, Kpis, BuscaCelular, Pilulas, CartaoCelular, Selo, SELO, Vazio, Carregando } from '@/components/admin/celular/kit';

const SELO_SINDICO: Record<string, keyof typeof SELO> = {
  novo: 'azul', em_contato: 'ambar', contatado: 'ambar', interessado: 'ambar', visita_agendada: 'ambar',
  aprovado: 'verde', instalado: 'verde', recusado: 'vermelho', nao_interessado: 'vermelho', arquivado: 'cinza',
};

const onlyDigits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SindicosInteressados: React.FC = () => {
  const {
    rows,
    loading,
    filters,
    setFilters,
    clearFilters,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
    refetch,
  } = useSindicosList();

  const { stats } = useSindicosStats();

  const [selected, setSelected] = useState<SindicoRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const celular = useIsMobile();
  const { basePath } = useAdminBasePath();

  const openDetails = (s: SindicoRow) => {
    setSelected(s);
    setDialogOpen(true);
  };

  const downloadPdf = async (s: SindicoRow) => {
    if (!s.aceite_pdf_url) {
      toast.error('PDF não disponível');
      return;
    }
    setDownloadingId(s.id);
    const url = await getSignedUrl('termos-sindicos', s.aceite_pdf_url, 3600);
    setDownloadingId(null);
    if (!url) {
      toast.error('Não foi possível gerar o link');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `termo-${s.protocolo ?? s.id}.pdf`;
    a.click();
  };

  const dateRangeLabel = (() => {
    if (filters.startDate && filters.endDate) {
      return `${format(filters.startDate, 'dd/MM')} – ${format(filters.endDate, 'dd/MM')}`;
    }
    if (filters.startDate) return `Desde ${format(filters.startDate, 'dd/MM')}`;
    if (filters.endDate) return `Até ${format(filters.endDate, 'dd/MM')}`;
    return 'Período';
  })();

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    !!filters.startDate ||
    !!filters.endDate;

  if (celular) {
    const rotuloStatus = (v: string) => STATUS_OPTIONS.find((o) => o.value === v)?.label || v;
    return (
      <PaginaCelular>
        <TopoCelular
          titulo="Síndicos"
          sub="Cadastros de /interessesindico"
          acoes={<BotaoRedondo rotulo="Atualizar" onClick={refetch} disabled={loading}><RefreshCcw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} /></BotaoRedondo>}
        />
        <Kpis
          colunas={4}
          itens={[
            { rotulo: 'Total', valor: stats.total, onClick: () => setFilters({ status: 'all' }), ativo: filters.status === 'all' },
            { rotulo: 'Novos', valor: stats.novos, cor: '#2B4C8C', onClick: () => setFilters({ status: 'novo' }), ativo: filters.status === 'novo' },
            { rotulo: 'Contato', valor: stats.emContato, cor: '#9A5300' },
            { rotulo: 'Aprovados', valor: stats.aprovados, cor: '#1E6B47' },
          ]}
        />
        <BuscaCelular valor={filters.search} onChange={(v) => setFilters({ search: v })} placeholder="Prédio, síndico ou protocolo" />
        <Pilulas
          valor={filters.status}
          onChange={(v) => setFilters({ status: v })}
          opcoes={[{ valor: 'all', rotulo: 'Todos' }, ...STATUS_OPTIONS.map((o) => ({ valor: o.value, rotulo: o.label }))]}
        />
        {loading ? <Carregando /> : rows.length === 0 ? (
          <Vazio icone={<Building2 className="h-6 w-6" />} titulo={totalCount === 0 ? 'Nenhum cadastro ainda' : 'Nada com esses filtros'} />
        ) : (
          <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
            {rows.map((r) => {
              const wpp = onlyDigits(r.sindico_whatsapp ?? r.celular);
              const cor = SELO[SELO_SINDICO[r.status] || 'cinza'];
              const unid = r.quantidade_unidades_total ?? r.numero_unidades;
              return (
                <div key={r.id} className="flex items-center gap-2 pr-2">
                  <button type="button" onClick={() => openDetails(r)} className="min-w-0 flex-1 px-4 py-3 text-left active:bg-black/[0.03]">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold">{r.nome_predio || 'Prédio sem nome'}</span>
                      <Selo fundo={cor.fundo} cor={cor.cor}>{rotuloStatus(r.status)}</Selo>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#5E5F63]">
                      {r.sindico_nome ?? r.nome_completo ?? 'Síndico não informado'}{unid ? ` · ${unid} unid.` : ''}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#8A8B90]">
                      {format(new Date(r.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}{r.endereco_cidade ? ` · ${r.endereco_cidade}` : ''}{r.protocolo ? ` · ${r.protocolo}` : ''}
                    </span>
                  </button>
                  {wpp && (
                    <a href={`https://wa.me/${wpp}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp do síndico"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EAF5EF] text-[#1E6B47] active:scale-95">
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              );
            })}
          </CartaoCelular>
        )}
        {totalCount > pageSize && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-11 flex-1 rounded-2xl border border-black/[0.08] bg-white text-[14px] font-bold disabled:opacity-40">Anterior</button>
            <span className="px-2 text-[13px] font-bold text-[#6A6B70]">{page}/{totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-11 flex-1 rounded-2xl border border-black/[0.08] bg-white text-[14px] font-bold disabled:opacity-40">Próxima</button>
          </div>
        )}
        <SindicoDialog sindico={selected} open={dialogOpen} onOpenChange={setDialogOpen} onUpdated={refetch} />
      </PaginaCelular>
    );
  }

  // ===== Desktop (07/11/2026): "Síndicos · leads", no padrão da página Painéis EXA =====
  const ETAPAS: { v: string; r: string; cor: string; fundo: string; inclui: string[] }[] = [
    { v: 'novo', r: 'Novo', cor: '#2B4C8C', fundo: '#EAF0FA', inclui: ['novo'] },
    { v: 'em_contato', r: 'Em contato', cor: '#9A5300', fundo: '#FFF4E5', inclui: ['em_contato', 'contatado', 'interessado'] },
    { v: 'visita_agendada', r: 'Visita', cor: '#7A3E9D', fundo: '#F3EBF9', inclui: ['visita_agendada'] },
    { v: 'aprovado', r: 'Aprovado', cor: '#1E6B47', fundo: '#EAF5EF', inclui: ['aprovado', 'instalado'] },
    { v: 'perdido', r: 'Perdido', cor: '#8A8B90', fundo: 'rgba(23,24,26,0.05)', inclui: ['recusado', 'nao_interessado', 'arquivado'] },
  ];
  const etapaDe = (st: string) => ETAPAS.find((e) => e.inclui.includes(st)) || ETAPAS[0];
  const rotuloStatusDesk = (v: string) => STATUS_OPTIONS.find((o) => o.value === v)?.label || v;
  const total = totalCount;
  const porEtapa = (e: typeof ETAPAS[number]) => (e.v === 'novo' ? stats.novos : e.v === 'em_contato' ? stats.emContato : e.v === 'aprovado' ? stats.aprovados : rows.filter((r) => e.inclui.includes(r.status)).length);
  const mudarStatus = async (r: SindicoRow, status: string) => {
    const { error } = await supabase.from('sindicos_interessados').update({ status }).eq('id', r.id);
    if (error) { toast.error('Não salvou: ' + error.message); return; }
    toast.success(`${r.nome_predio || 'Lead'}: ${rotuloStatusDesk(status)}`); refetch();
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-[#17181A] md:space-y-6" style={{ fontFeatureSettings: '"tnum"' }}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[30px]">Síndicos</h1>
          <span className="text-xs font-bold text-[#6A6B70]">leads de prédios: site (/interessesindico), Sofia e Nando</span>
        </div>
        <button type="button" onClick={refetch} disabled={loading} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${glass} hover:bg-white`}>
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </header>

      {/* Funil */}
      <section aria-label="Funil" className={`${glass} grid gap-4 rounded-[22px] p-4 md:grid-cols-[1.1fr_2.4fr] md:items-center md:p-5`}>
        <button type="button" onClick={() => setFilters({ status: 'all' })} className="text-left">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#2B4C8C]">Leads de síndicos</span>
          <span className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-[#2B4C8C]">{total}</span>
            <span className="text-base font-bold text-[#8A8B90]">no funil · {stats.novos} sem contato</span>
          </span>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-black/[0.06]">
            <span className="block h-full rounded-full bg-[#1E6B47] transition-all" style={{ width: total ? `${(stats.aprovados / total) * 100}%` : '0%' }} />
          </span>
          <span className="mt-1.5 block text-xs font-bold text-[#6A6B70]">{stats.aprovados} aprovado{stats.aprovados === 1 ? '' : 's'} de {total}</span>
        </button>
        <div className="grid grid-cols-5 gap-2">
          {ETAPAS.map((e) => (
            <button key={e.v} type="button" onClick={() => setFilters({ status: filters.status === e.v ? 'all' : e.v })}
              className={`rounded-2xl px-3 py-2.5 text-left transition-colors ${filters.status === e.v ? 'bg-white ring-2 ring-[#B4231C]/30' : 'bg-white/70 hover:bg-white'}`}>
              <span className="block text-[11px] font-bold text-[#6A6B70]">{e.r}</span>
              <span className="block text-[26px] font-extrabold leading-tight" style={{ color: e.cor }}>{porEtapa(e)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Busca */}
      <section aria-label="Buscar" className={`${glass} flex flex-col gap-2 rounded-[18px] p-3 md:flex-row md:items-center`}>
        <label className="relative flex-1 md:min-w-[260px]">
          <span className="sr-only">Buscar</span>
          <Input value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} placeholder="Buscar prédio, síndico, bairro ou protocolo"
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4231C]" />
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 rounded-xl border-black/10 bg-white text-sm font-semibold"><CalendarIcon className="mr-2 h-4 w-4" />{dateRangeLabel}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="range" selected={{ from: filters.startDate, to: filters.endDate }} onSelect={(r: any) => setFilters({ startDate: r?.from, endDate: r?.to })} numberOfMonths={2} locale={ptBR} />
          </PopoverContent>
        </Popover>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-[#B0261D] hover:bg-white"><X className="h-4 w-4" /> Limpar</button>
        )}
      </section>

      {/* Leads */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#6A6B70]"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className={`${glass} rounded-[22px] p-10 text-center`}>
          <Building2 className="mx-auto h-7 w-7 text-[#8A8B90]" />
          <p className="mt-2 text-[15px] font-bold">{total === 0 ? 'Nenhum lead de síndico ainda' : 'Nada com esses filtros'}</p>
          <p className="text-sm text-[#6A6B70]">Os cadastros do site, os síndicos que falam com a Sofia e os que o Nando registra aparecem aqui.</p>
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const wpp = onlyDigits(r.sindico_whatsapp ?? r.celular);
            const et = etapaDe(r.status);
            const unid = r.quantidade_unidades_total ?? r.numero_unidades;
            const dias = differenceInCalendarDays(new Date(), new Date(r.created_at));
            const sindico = r.sindico_nome ?? r.nome_completo ?? 'Síndico não informado';
            const endereco = [r.endereco_logradouro || r.endereco, r.endereco_numero].filter(Boolean).join(', ');
            const perdido = et.v === 'perdido';
            return (
              <article key={r.id} className={`${glass} flex flex-col gap-3 rounded-[22px] p-4 ${perdido ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => openDetails(r)} className="min-w-0 text-left">
                    <span className="block truncate text-[17px] font-extrabold tracking-[-0.02em]">{r.nome_predio || 'Prédio sem nome'}</span>
                    <span className="block truncate text-[12.5px] font-semibold text-[#6A6B70]">{[endereco, r.endereco_bairro, r.endereco_cidade].filter(Boolean).join(' · ') || 'Endereço não informado'}</span>
                  </button>
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-bold" style={{ background: et.fundo, color: et.cor }}>{rotuloStatusDesk(r.status)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-[#45464A]">
                  {unid ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5">{unid} unidades</span> : null}
                  {r.quantidade_andares ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5">{r.quantidade_andares} andares</span> : null}
                  {r.quantidade_elevadores_sociais ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5">{r.quantidade_elevadores_sociais} elevador{r.quantidade_elevadores_sociais === 1 ? '' : 'es'}</span> : null}
                  {r.tipo_predio ? <span className="rounded-full bg-black/[0.05] px-2 py-0.5 capitalize">{r.tipo_predio}</span> : null}
                  <span className="rounded-full bg-black/[0.05] px-2 py-0.5">{r.protocolo ? 'site' : 'sem protocolo'} · {dias === 0 ? 'hoje' : `há ${dias} d`}</span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
                  <div className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold">{sindico}</span>
                    <span className="block truncate text-[12px] text-[#6A6B70]">{wpp ? `+${wpp}` : 'sem WhatsApp'}{r.sindico_email || r.email ? ` · ${r.sindico_email || r.email}` : ''}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {wpp && (
                      <Link to={`${basePath}/crm-evolution/conversas/sofia?telefone=${wpp}&nome=${encodeURIComponent(sindico)}`} title="Conversa na Sofia"
                        className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF5EF] text-[#1E6B47] hover:bg-[#dff0e6]"><MessageCircle className="h-4 w-4" /></Link>
                    )}
                    <button type="button" onClick={() => openDetails(r)} title="Ver ficha" className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 ring-1 ring-black/[0.08] hover:bg-white"><Eye className="h-4 w-4" /></button>
                    {r.aceite_pdf_url && (
                      <button type="button" onClick={() => downloadPdf(r)} disabled={downloadingId === r.id} title="Termo assinado (PDF)" className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 ring-1 ring-black/[0.08] hover:bg-white">
                        {downloadingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </button>
                    )}
                    <ExcluirComMotivo tabela="sindicos_interessados" ids={[r.id]} nome={r.nome_predio || 'lead'} onFeito={refetch} />
                  </div>
                </div>
                <select value={r.status} onChange={(e) => mudarStatus(r, e.target.value)} aria-label="Etapa do lead"
                  className="h-9 w-full rounded-xl border border-black/10 bg-white px-2.5 text-[12.5px] font-semibold">
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </article>
            );
          })}
        </section>
      )}

      {totalCount > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={`h-10 rounded-xl px-4 text-sm font-bold ${glass} disabled:opacity-40`}>Anterior</button>
          <span className="px-2 text-sm font-bold text-[#6A6B70]">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={`h-10 rounded-xl px-4 text-sm font-bold ${glass} disabled:opacity-40`}>Próxima</button>
        </div>
      )}

      <SindicoDialog sindico={selected} open={dialogOpen} onOpenChange={setDialogOpen} onUpdated={refetch} />
    </div>
  );
};

export default SindicosInteressados;
