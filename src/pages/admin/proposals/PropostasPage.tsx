// EXA (07/11/2026) — Propostas refeita a pedido do Jeferson: sem painel de vendedores, sem Eduardo/Bruno;
// as propostas abertas são leads com funil próprio (Rascunho → Enviada → Vista → Aceita → Convertida);
// as convertidas ficam cinza no fim; marcar várias e excluir com motivo (log). Toda proposta nova vira contato (NovaPropostaPage).
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Copy, ExternalLink, MessageCircle, Eye, Trash2, X, CheckSquare, Square, RefreshCw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Pagina, Cabecalho, Busca, Pilulas, Kpi, Chip, TOM, Avatar, Carregando, Vazio, BOTAO, BOTAO2, vidro } from '@/components/admin/ui/exa';
import { ExcluirComMotivo } from '@/components/admin/ui/ExcluirComMotivo';
import { ProposalPreviewModal } from '@/components/admin/proposals/ProposalPreviewModal';
import { formatCurrency } from '@/utils/formatters';

type Etapa = 'rascunho' | 'enviada' | 'vista' | 'aceita' | 'convertida' | 'perdida';
const ETAPA_DE = (s: string): Etapa =>
  ['convertida', 'paga'].includes(s) ? 'convertida'
    : s === 'aceita' ? 'aceita'
    : ['visualizada', 'visualizando'].includes(s) ? 'vista'
    : ['enviada', 'atualizada'].includes(s) ? 'enviada'
    : ['expirada', 'recusada', 'cancelada'].includes(s) ? 'perdida'
    : 'rascunho';
const ETAPAS: { v: Etapa | 'abertas' | 'todas'; l: string; tom: keyof typeof TOM }[] = [
  { v: 'abertas', l: 'Abertas', tom: 'cinza' },
  { v: 'rascunho', l: 'Rascunho', tom: 'cinza' },
  { v: 'enviada', l: 'Enviada', tom: 'azul' },
  { v: 'vista', l: 'Vista pelo cliente', tom: 'ambar' },
  { v: 'aceita', l: 'Aceita', tom: 'verde' },
  { v: 'convertida', l: 'Convertida', tom: 'verde' },
  { v: 'perdida', l: 'Perdida', tom: 'vermelho' },
  { v: 'todas', l: 'Todas', tom: 'cinza' },
];
const TOM_ETAPA: Record<Etapa, keyof typeof TOM> = { rascunho: 'cinza', enviada: 'azul', vista: 'ambar', aceita: 'verde', convertida: 'verde', perdida: 'vermelho' };
const ROTULO_ETAPA: Record<Etapa, string> = { rascunho: 'rascunho', enviada: 'enviada', vista: 'vista', aceita: 'aceita', convertida: 'convertida', perdida: 'perdida' };

interface Proposta {
  id: string; number: string; titulo: string | null; client_name: string; client_company_name: string | null; client_phone: string | null; client_email: string | null;
  client_logo_url: string | null; total_panels: number; fidel_monthly_value: number; cash_total_value: number; duration_months: number; status: string;
  created_at: string; updated_at: string | null; sent_at: string | null; expires_at: string | null; view_count: number | null; last_viewed_at: string | null;
  total_time_spent_seconds: number | null; converted_order_id: string | null; seller_name: string | null; seller_phone: string | null; seller_email: string | null;
  modalidade_proposta: string | null; valor_total_permuta: number | null; tipo_produto: string | null; selected_buildings: any[]; discount_percent: number;
  total_impressions_month: number; payment_type: string | null; custom_installments: any; is_custom_days: boolean | null; custom_days: number | null; metadata: any;
}

const fone = (t?: string | null) => {
  const d = String(t || '').replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return t || '';
};
const ha = (iso?: string | null) => {
  if (!iso) return '';
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400e3);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : d < 30 ? `há ${d} dias` : new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
const valorDe = (p: Proposta) => (p.modalidade_proposta === 'permuta' ? p.valor_total_permuta || 0 : p.fidel_monthly_value || 0);
const LINK = (id: string) => `https://www.examidia.com.br/propostacomercial/${id}`;

const usePropostas = () => useQuery({
  queryKey: ['propostas-lista'],
  staleTime: 30_000,
  refetchInterval: 60_000,
  queryFn: async (): Promise<Proposta[]> => {
    const { data, error } = await supabase.from('proposals').select('*').neq('status', 'modelo').order('updated_at', { ascending: false, nullsFirst: false }).limit(1000);
    if (error) throw error;
    return (data || []) as Proposta[];
  },
});

const PropostasPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { data, isLoading, refetch, isFetching } = usePropostas();
  const [etapa, setEtapa] = useState<string>(() => { try { return localStorage.getItem('propostas_etapa') || 'abertas'; } catch { return 'abertas'; } });
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Proposta | null>(null);
  useEffect(() => { try { localStorage.setItem('propostas_etapa', etapa); } catch { /* sem armazenamento */ } setSel(new Set()); }, [etapa]);

  const todas = useMemo(() => (data || []).map((p) => ({ p, e: ETAPA_DE(p.status) })), [data]);
  const n = (v: string) => v === 'todas' ? todas.length : v === 'abertas' ? todas.filter((x) => ['enviada', 'vista', 'aceita'].includes(x.e)).length : todas.filter((x) => x.e === v).length;
  const q = busca.trim().toLowerCase();
  const visiveis = useMemo(() => {
    const ordem: Record<Etapa, number> = { aceita: 0, vista: 1, enviada: 2, rascunho: 3, perdida: 4, convertida: 5 };
    return todas
      .filter((x) => etapa === 'todas' ? true : etapa === 'abertas' ? ['enviada', 'vista', 'aceita'].includes(x.e) : x.e === etapa)
      .filter((x) => !q || [x.p.client_name, x.p.client_company_name, x.p.number, x.p.titulo, x.p.client_phone, x.p.client_email].some((s) => String(s || '').toLowerCase().includes(q)))
      .sort((a, b) => (ordem[a.e] - ordem[b.e]) || (new Date(b.p.updated_at || b.p.created_at).getTime() - new Date(a.p.updated_at || a.p.created_at).getTime()));
  }, [todas, etapa, q]);

  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const abertas = todas.filter((x) => ['enviada', 'vista', 'aceita'].includes(x.e));
  const abertasValor = abertas.reduce((a, x) => a + valorDe(x.p), 0);
  const convMes = todas.filter((x) => x.e === 'convertida' && new Date(x.p.updated_at || x.p.created_at) >= inicioMes).length;
  const enviadasMes = todas.filter((x) => x.e !== 'rascunho' && new Date(x.p.created_at) >= inicioMes).length;
  const vistasSemResposta = todas.filter((x) => x.e === 'vista' && x.p.last_viewed_at && Date.now() - new Date(x.p.last_viewed_at).getTime() > 3 * 86400e3).length;

  const alternar = (id: string) => setSel((s) => { const c = new Set(s); if (c.has(id)) c.delete(id); else c.add(id); return c; });
  const todosSel = visiveis.length > 0 && visiveis.every((x) => sel.has(x.p.id));
  const copiar = (p: Proposta) => { navigator.clipboard.writeText(LINK(p.id)); toast.success('Link da proposta copiado.'); };
  const sofia = (p: Proposta) => navigate(buildPath(`crm-evolution/conversas/sofia?telefone=${String(p.client_phone || '').replace(/\D/g, '')}&nome=${encodeURIComponent(p.client_name || '')}`));

  return (
    <Pagina>
      <Cabecalho
        titulo="Propostas"
        sub="Cada proposta aberta é um lead no funil. As convertidas ficam cinza no fim. Toda proposta nova já entra em Contatos."
        acoes={(
          <>
            <button type="button" className={BOTAO2} onClick={() => refetch()} title="Atualizar"><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
            <button type="button" className={BOTAO} onClick={() => navigate(buildPath('propostas/nova'))}><Plus className="h-4 w-4" /> Nova proposta</button>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Abertas" valor={abertas.length} sub={`${formatCurrency(abertasValor)}/mês em jogo`} icone={FileText} cor="#2B4C8C" onClick={() => setEtapa('abertas')} />
        <Kpi rotulo="Vistas sem resposta" valor={vistasSemResposta} sub="vistas há mais de 3 dias" cor={vistasSemResposta ? '#9A5300' : '#17181A'} onClick={() => setEtapa('vista')} />
        <Kpi rotulo="Convertidas no mês" valor={convMes} sub={`${enviadasMes} enviadas no mês`} cor="#1E6B47" onClick={() => setEtapa('convertida')} />
        <Kpi rotulo="Rascunhos" valor={n('rascunho')} sub="ainda não enviadas" cor="#6A6B70" onClick={() => setEtapa('rascunho')} />
      </div>

      <Busca valor={busca} onChange={setBusca} placeholder="Cliente, empresa, número ou telefone">
        <Pilulas valor={etapa} onChange={setEtapa} opcoes={ETAPAS.map((e) => ({ valor: e.v, rotulo: e.l, n: n(e.v) }))} />
      </Busca>

      {isLoading ? <Carregando /> : !visiveis.length ? <Vazio icone={<FileText className="h-5 w-5" />} titulo="Nenhuma proposta aqui" texto={q ? 'Tente outra busca.' : 'Nada nesta etapa.'} /> : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <div className="flex items-center gap-2 border-b border-black/[0.06] bg-white/50 px-3 py-2 md:px-4">
            <button type="button" onClick={() => setSel(todosSel ? new Set() : new Set(visiveis.map((x) => x.p.id)))} className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-[12.5px] font-bold text-[#45464A] hover:bg-black/[0.04]">
              {todosSel ? <CheckSquare className="h-[18px] w-[18px] text-[#9C1E1E]" /> : <Square className="h-[18px] w-[18px]" />} {todosSel ? 'Desmarcar todas' : 'Marcar todas'}
            </button>
            <span className="text-[12px] text-[#8A8B90]">{visiveis.length} proposta{visiveis.length === 1 ? '' : 's'}</span>
            {sel.size > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-[#9C1E1E]">{sel.size} marcada{sel.size === 1 ? '' : 's'}</span>
                <ExcluirComMotivo tabela="proposals" ids={[...sel]} nome={`proposta ${visiveis.find((x) => sel.has(x.p.id))?.p.number || ''}`} onFeito={() => { setSel(new Set()); refetch(); }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#B0261D] px-3 text-[13px] font-bold text-white hover:bg-[#8f1e17]">
                  <Trash2 className="h-4 w-4" /> Excluir {sel.size}
                </ExcluirComMotivo>
                <button type="button" onClick={() => setSel(new Set())} className={`${BOTAO2} h-9`} aria-label="Limpar seleção"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>
          <ul className="divide-y divide-black/[0.06]">
            {visiveis.map(({ p, e }) => {
              const marcado = sel.has(p.id);
              const apagada = e === 'convertida' || e === 'perdida';
              const nome = p.client_company_name || p.client_name;
              return (
                <li key={p.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors md:px-4 ${marcado ? 'bg-[#FDECEC]/60' : 'hover:bg-white/70'} ${apagada ? 'opacity-60 grayscale-[0.6]' : ''}`}>
                  <button type="button" onClick={() => alternar(p.id)} aria-pressed={marcado} aria-label={marcado ? 'Desmarcar' : 'Marcar'} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#6A6B70] hover:bg-black/[0.04]">
                    {marcado ? <CheckSquare className="h-[18px] w-[18px] text-[#9C1E1E]" /> : <Square className="h-[18px] w-[18px]" />}
                  </button>
                  <button type="button" onClick={() => navigate(buildPath(`propostas/${p.id}`))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar nome={nome} foto={p.client_logo_url} tamanho={40} cor={TOM[TOM_ETAPA[e]].cor} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-[14px] font-bold">{nome}</span>
                        <Chip {...TOM[TOM_ETAPA[e]]}>{ROTULO_ETAPA[e]}</Chip>
                        {p.modalidade_proposta === 'permuta' && <Chip {...TOM.roxo}>permuta</Chip>}
                        {p.tipo_produto === 'vertical_premium' && <Chip {...TOM.cinza}>vertical</Chip>}
                      </span>
                      <span className="block truncate text-[12.5px] text-[#6A6B70]">
                        {p.number}{p.titulo ? ` · ${p.titulo}` : ''}{p.client_company_name && p.client_name !== p.client_company_name ? ` · ${p.client_name}` : ''}{p.client_phone ? ` · ${fone(p.client_phone)}` : ''}
                      </span>
                    </span>
                  </button>
                  <div className="hidden items-center gap-4 text-right lg:flex">
                    <span className="w-[110px]">
                      <span className="block text-[13px] font-bold tabular-nums" style={{ color: e === 'convertida' ? '#1E6B47' : '#17181A' }}>{p.modalidade_proposta === 'permuta' ? formatCurrency(p.valor_total_permuta || 0) : `${formatCurrency(p.fidel_monthly_value || 0)}/mês`}</span>
                      <span className="block text-[11.5px] text-[#8A8B90]">{p.total_panels || p.selected_buildings?.length || 0} prédio{(p.total_panels || 0) === 1 ? '' : 's'} · {p.duration_months || 1} {p.duration_months === 1 ? 'mês' : 'meses'}</span>
                    </span>
                    <span className="w-[96px]">
                      <span className="block text-[12.5px] font-semibold text-[#45464A]"><Eye className="mr-1 inline h-3.5 w-3.5 text-[#8A8B90]" />{p.view_count || 0} {p.view_count === 1 ? 'vez' : 'vezes'}</span>
                      <span className="block text-[11.5px] text-[#8A8B90]">{p.last_viewed_at ? `vista ${ha(p.last_viewed_at)}` : p.sent_at ? `enviada ${ha(p.sent_at)}` : `criada ${ha(p.created_at)}`}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => setPreview(p)} title="Ver proposta" className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]"><Eye className="h-4 w-4" /></button>
                    <button type="button" onClick={() => navigate(buildPath(`propostas/${p.id}/editar`))} title="Editar" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => copiar(p)} title="Copiar link" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Copy className="h-4 w-4" /></button>
                    <a href={LINK(p.id)} target="_blank" rel="noreferrer" title="Abrir como o cliente vê" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><ExternalLink className="h-4 w-4" /></a>
                    <button type="button" onClick={() => sofia(p)} disabled={!p.client_phone} title="Abrir no WhatsApp da Sofia" className="grid h-9 w-9 place-items-center rounded-xl text-[#1E6B47] hover:bg-[#EAF5EF] disabled:opacity-30"><MessageCircle className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {preview && (
        <ProposalPreviewModal open={!!preview} onClose={() => setPreview(null)} proposal={preview as any} sellerName={preview.seller_name || undefined} sellerPhone={preview.seller_phone || undefined} sellerEmail={preview.seller_email || undefined} />
      )}
    </Pagina>
  );
};

export default PropostasPage;
