// EXA (07/11/2026) — Contratos refeita no kit de vidro: Anunciantes (contratos_legais, ClickSign) e Prédios (comodato, predio_contratos
// via exa2-contratos-predio). Sem "workspace jurídico com IA". Pedidos sem contrato aparecem como pendência.
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Scale, Building2, PenTool, FileText, Send, Eye, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignatariosExaManager } from '@/components/admin/contracts/SignatariosExaManager';
import { Pagina, Cabecalho, Segmentos, Busca, Pilulas, Kpi, Chip, TOM, Avatar, Carregando, Vazio, BOTAO, BOTAO2, vidro } from '@/components/admin/ui/exa';
import { formatCurrency } from '@/utils/formatters';

type Status = 'rascunho' | 'enviado' | 'visualizado' | 'assinado' | 'recusado' | 'expirado' | 'cancelado';
const STATUS: Record<Status, { l: string; tom: keyof typeof TOM; I: React.ElementType }> = {
  rascunho: { l: 'rascunho', tom: 'cinza', I: FileText }, enviado: { l: 'enviado', tom: 'azul', I: Send }, visualizado: { l: 'visto', tom: 'ambar', I: Eye },
  assinado: { l: 'assinado', tom: 'verde', I: CheckCircle2 }, recusado: { l: 'recusado', tom: 'vermelho', I: AlertTriangle }, expirado: { l: 'expirado', tom: 'vermelho', I: AlertTriangle }, cancelado: { l: 'cancelado', tom: 'cinza', I: FileText },
};
interface Contrato {
  id: string; numero_contrato: string; tipo_contrato: string; status: Status; cliente_nome: string; cliente_razao_social: string | null; cliente_telefone: string | null; cliente_cnpj: string | null;
  valor_mensal: number | null; valor_total: number | null; plano_meses: number | null; total_paineis: number | null; data_inicio: string | null; data_fim: string | null;
  proposta_id: string | null; pedido_id: string | null; clicksign_envelope_id: string | null; clicksign_download_url: string | null;
  enviado_em: string | null; visualizado_em: string | null; assinado_em: string | null; created_at: string; updated_at: string | null; modalidade_proposta: string | null; tipo_produto: string | null;
}
const dia = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

const useContratos = () => useQuery({
  queryKey: ['contratos-legais-lista'],
  staleTime: 30_000,
  queryFn: async (): Promise<Contrato[]> => {
    const { data, error } = await supabase.from('contratos_legais').select('id, numero_contrato, tipo_contrato, status, cliente_nome, cliente_razao_social, cliente_telefone, cliente_cnpj, valor_mensal, valor_total, plano_meses, total_paineis, data_inicio, data_fim, proposta_id, pedido_id, clicksign_envelope_id, clicksign_download_url, enviado_em, visualizado_em, assinado_em, created_at, updated_at, modalidade_proposta, tipo_produto').neq('tipo_contrato', 'comodato').order('updated_at', { ascending: false, nullsFirst: false }).limit(1000);
    if (error) throw error;
    return (data || []) as Contrato[];
  },
});
const usePedidosSemContrato = () => useQuery({
  queryKey: ['pedidos-sem-contrato'],
  staleTime: 60_000,
  queryFn: async () => {
    const [{ data: peds }, { data: com }] = await Promise.all([
      supabase.from('pedidos').select('id, client_name, nome_pedido, status, valor_total, plano_meses, created_at').in('status', ['aguardando_contrato', 'aguardando_video', 'video_enviado', 'video_aprovado', 'ativo']).order('created_at', { ascending: false }),
      supabase.from('contratos_legais').select('pedido_id').not('pedido_id', 'is', null),
    ]);
    const tem = new Set((com || []).map((c: any) => c.pedido_id));
    return ((peds || []) as any[]).filter((p) => !tem.has(p.id) && !/not[ií]cias|curiosidades|conta interna/i.test(`${p.nome_pedido} ${p.client_name}`));
  },
});
const usePredios = () => useQuery({
  queryKey: ['contratos-predios-resumo'],
  staleTime: 60_000,
  queryFn: async () => {
    const [{ data: bs }, resumo] = await Promise.all([
      supabase.from('buildings').select('id, nome, endereco, bairro, status, nome_sindico, contato_sindico_telefone').eq('status', 'ativo').order('nome'),
      supabase.functions.invoke('exa2-contratos-predio', { body: { acao: 'resumo' } }).then((r) => (r.data as any)?.predios || {}, () => ({})),
    ]);
    return ((bs || []) as any[]).map((b) => ({ ...b, contrato: !!resumo[b.id]?.contrato, pedido: resumo[b.id]?.pedido || null }));
  },
});

const ContratosPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [seg, setSeg] = useState<'anunciantes' | 'predios'>(() => { try { return (localStorage.getItem('contratos_seg') as any) || 'anunciantes'; } catch { return 'anunciantes'; } });
  const [filtro, setFiltro] = useState('abertos');
  const [busca, setBusca] = useState('');
  const [signatarios, setSignatarios] = useState(false);
  const contratos = useContratos();
  const semContrato = usePedidosSemContrato();
  const predios = usePredios();
  const mudarSeg = (v: string) => { setSeg(v as any); try { localStorage.setItem('contratos_seg', v); } catch { /* sem armazenamento */ } };

  const q = busca.trim().toLowerCase();
  const lista = useMemo(() => {
    const ordem: Record<string, number> = { visualizado: 0, enviado: 1, rascunho: 2, recusado: 3, expirado: 3, assinado: 4, cancelado: 5 };
    return (contratos.data || [])
      .filter((c) => filtro === 'todos' ? true : filtro === 'abertos' ? ['enviado', 'visualizado'].includes(c.status) : c.status === filtro)
      .filter((c) => !q || [c.cliente_nome, c.cliente_razao_social, c.numero_contrato, c.cliente_cnpj, c.cliente_telefone].some((s) => String(s || '').toLowerCase().includes(q)))
      .sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9) || new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  }, [contratos.data, filtro, q]);
  const n = (s: string) => s === 'todos' ? (contratos.data || []).length : s === 'abertos' ? (contratos.data || []).filter((c) => ['enviado', 'visualizado'].includes(c.status)).length : (contratos.data || []).filter((c) => c.status === s).length;
  const assinadosMRR = (contratos.data || []).filter((c) => c.status === 'assinado').reduce((a, c) => a + (c.valor_mensal || 0), 0);

  const prediosLista = useMemo(() => (predios.data || []).filter((b) => !q || [b.nome, b.endereco, b.bairro, b.nome_sindico].some((s) => String(s || '').toLowerCase().includes(q))).filter((b) => filtro === 'todos' ? true : filtro === 'com' ? b.contrato : filtro === 'pedido' ? !!b.pedido : !b.contrato && !b.pedido), [predios.data, q, filtro]);
  const nP = (s: string) => (predios.data || []).filter((b) => s === 'todos' ? true : s === 'com' ? b.contrato : s === 'pedido' ? !!b.pedido : !b.contrato && !b.pedido).length;
  const PEDIDO: Record<string, string> = { aguardando_dados: 'pedido ao Nando', agendado: 'envio agendado', enviando: 'enviando', enviado: 'em assinatura', erro: 'erro no envio' };

  return (
    <Pagina>
      <Cabecalho
        titulo="Contratos"
        sub={seg === 'anunciantes' ? 'Contratos dos anunciantes assinados pela ClickSign. Pedidos no ar sem contrato aparecem como pendência.' : 'Comodato do painel em cada prédio: quem tem, quem está assinando e quem ainda falta (o Nando pede ao síndico).'}
        acoes={(
          <>
            <button type="button" className={BOTAO2} onClick={() => setSignatarios(true)}><PenTool className="h-4 w-4" /> Signatários EXA</button>
            {seg === 'anunciantes'
              ? <button type="button" className={BOTAO} onClick={() => navigate(buildPath('juridico/novo'))}><Plus className="h-4 w-4" /> Novo contrato</button>
              : <button type="button" className={BOTAO} onClick={() => navigate(buildPath('predios'))}><Building2 className="h-4 w-4" /> Pedir pelo prédio</button>}
          </>
        )}
      />

      <Segmentos valor={seg} onChange={(v) => { mudarSeg(v); setFiltro(v === 'anunciantes' ? 'abertos' : 'sem'); }} opcoes={[{ valor: 'anunciantes', rotulo: 'Anunciantes' }, { valor: 'predios', rotulo: 'Prédios (comodato)' }]} />

      {seg === 'anunciantes' ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Kpi rotulo="Aguardando assinatura" valor={n('abertos')} sub="enviados ou vistos" cor={n('abertos') ? '#9A5300' : '#17181A'} icone={Send} onClick={() => setFiltro('abertos')} />
            <Kpi rotulo="Assinados" valor={n('assinado')} sub={`${formatCurrency(assinadosMRR)}/mês`} cor="#1E6B47" icone={CheckCircle2} onClick={() => setFiltro('assinado')} />
            <Kpi rotulo="Rascunhos" valor={n('rascunho')} sub="nunca enviados" cor="#6A6B70" icone={FileText} onClick={() => setFiltro('rascunho')} />
            <Kpi rotulo="Pedidos sem contrato" valor={semContrato.data?.length ?? '—'} sub="no ar ou em produção" cor={semContrato.data?.length ? '#B0261D' : '#1E6B47'} icone={AlertTriangle} onClick={() => setFiltro('sem_contrato')} />
          </div>
          <Busca valor={busca} onChange={setBusca} placeholder="Cliente, número do contrato, CNPJ ou telefone">
            <Pilulas valor={filtro} onChange={setFiltro} opcoes={[
              { valor: 'abertos', rotulo: 'Em assinatura', n: n('abertos') }, { valor: 'assinado', rotulo: 'Assinados', n: n('assinado') }, { valor: 'rascunho', rotulo: 'Rascunhos', n: n('rascunho') },
              { valor: 'sem_contrato', rotulo: 'Pedidos sem contrato', n: semContrato.data?.length }, { valor: 'todos', rotulo: 'Todos', n: n('todos') },
            ]} />
          </Busca>

          {filtro === 'sem_contrato' ? (
            semContrato.isLoading ? <Carregando /> : !semContrato.data?.length ? <Vazio icone={<CheckCircle2 className="h-5 w-5" />} titulo="Todo pedido no ar tem contrato" /> : (
              <div className={`${vidro} overflow-hidden rounded-[22px]`}>
                <ul className="divide-y divide-black/[0.06]">
                  {semContrato.data.filter((p: any) => !q || `${p.client_name} ${p.nome_pedido}`.toLowerCase().includes(q)).map((p: any) => (
                    <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4">
                      <Avatar nome={p.client_name} tamanho={38} cor="#9A5300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold">{p.client_name}</span>
                        <span className="block truncate text-[12.5px] text-[#6A6B70]">{p.nome_pedido} · {p.status.replace(/_/g, ' ')} · {formatCurrency(p.valor_total || 0)}{p.plano_meses > 1 ? ` em ${p.plano_meses} meses` : ''} · {dia(p.created_at)}</span>
                      </span>
                      <button type="button" className={`${BOTAO2} h-9`} onClick={() => navigate(buildPath(`juridico/novo?pedido=${p.id}`))}><Plus className="h-4 w-4" /> Gerar contrato</button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ) : contratos.isLoading ? <Carregando /> : !lista.length ? <Vazio icone={<Scale className="h-5 w-5" />} titulo="Nenhum contrato aqui" /> : (
            <div className={`${vidro} overflow-hidden rounded-[22px]`}>
              <ul className="divide-y divide-black/[0.06]">
                {lista.map((c) => {
                  const st = STATUS[c.status] || STATUS.rascunho;
                  const apagado = ['cancelado', 'expirado', 'recusado'].includes(c.status);
                  const nome = c.cliente_razao_social || c.cliente_nome;
                  return (
                    <li key={c.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4 ${apagado ? 'opacity-60' : ''}`}>
                      <button type="button" onClick={() => navigate(buildPath(`juridico/${c.id}`))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <Avatar nome={nome} tamanho={40} cor={TOM[st.tom].cor} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate text-[14px] font-bold">{nome}</span>
                            <Chip {...TOM[st.tom]}>{st.l}</Chip>
                            {c.status === 'enviado' && !c.clicksign_envelope_id && <Chip {...TOM.vermelho} title="Marcado como enviado mas sem envelope na ClickSign">sem envelope</Chip>}
                            {c.proposta_id && <Chip {...TOM.cinza}>da proposta</Chip>}
                            {c.modalidade_proposta === 'permuta' && <Chip {...TOM.roxo}>permuta</Chip>}
                          </span>
                          <span className="block truncate text-[12.5px] text-[#6A6B70]">
                            {c.numero_contrato} · {formatCurrency(c.valor_mensal || 0)}/mês{c.plano_meses ? ` · ${c.plano_meses} ${c.plano_meses === 1 ? 'mês' : 'meses'}` : ''}{c.total_paineis ? ` · ${c.total_paineis} painéis` : ''}
                            {c.assinado_em ? ` · assinado ${dia(c.assinado_em)}` : c.visualizado_em ? ` · visto ${dia(c.visualizado_em)}` : c.enviado_em ? ` · enviado ${dia(c.enviado_em)}` : ` · criado ${dia(c.created_at)}`}
                          </span>
                        </span>
                      </button>
                      <span className="hidden w-[120px] text-right text-[12px] text-[#8A8B90] lg:block">{c.data_inicio ? `${dia(c.data_inicio)} → ${dia(c.data_fim)}` : ''}</span>
                      {c.clicksign_download_url && c.status === 'assinado' && (
                        <a href={c.clicksign_download_url} target="_blank" rel="noreferrer" title="Baixar PDF assinado" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#1E6B47] hover:bg-[#EAF5EF]"><ExternalLink className="h-4 w-4" /></a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Kpi rotulo="Com contrato" valor={nP('com')} sub="comodato assinado ou anexado" cor="#1E6B47" icone={CheckCircle2} onClick={() => setFiltro('com')} />
            <Kpi rotulo="Em andamento" valor={nP('pedido')} sub="pedido ao Nando ou em assinatura" cor="#9A5300" icone={Send} onClick={() => setFiltro('pedido')} />
            <Kpi rotulo="Sem contrato" valor={nP('sem')} sub="prédios ativos sem comodato" cor={nP('sem') ? '#B0261D' : '#17181A'} icone={AlertTriangle} onClick={() => setFiltro('sem')} />
            <Kpi rotulo="Prédios" valor={nP('todos')} sub="ativos na rede" icone={Building2} onClick={() => setFiltro('todos')} />
          </div>
          <Busca valor={busca} onChange={setBusca} placeholder="Prédio, endereço, bairro ou síndico">
            <Pilulas valor={filtro} onChange={setFiltro} opcoes={[{ valor: 'sem', rotulo: 'Sem contrato', n: nP('sem') }, { valor: 'pedido', rotulo: 'Em andamento', n: nP('pedido') }, { valor: 'com', rotulo: 'Com contrato', n: nP('com') }, { valor: 'todos', rotulo: 'Todos', n: nP('todos') }]} />
          </Busca>
          {predios.isLoading ? <Carregando /> : !prediosLista.length ? <Vazio icone={<Building2 className="h-5 w-5" />} titulo="Nenhum prédio aqui" /> : (
            <div className={`${vidro} overflow-hidden rounded-[22px]`}>
              <ul className="divide-y divide-black/[0.06]">
                {prediosLista.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4">
                    <button type="button" onClick={() => navigate(buildPath(`predios?busca=${encodeURIComponent(b.nome)}&aba=contrato`))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Avatar nome={b.nome} tamanho={40} cor={b.contrato ? '#1E6B47' : b.pedido ? '#9A5300' : '#B0261D'} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="truncate text-[14px] font-bold">{b.nome}</span>
                          {b.contrato ? <Chip {...TOM.verde}>com contrato</Chip> : b.pedido ? <Chip {...TOM.ambar}>{PEDIDO[b.pedido] || b.pedido}</Chip> : <Chip {...TOM.vermelho}>sem contrato</Chip>}
                        </span>
                        <span className="block truncate text-[12.5px] text-[#6A6B70]">{[b.endereco, b.bairro, b.nome_sindico ? `síndico ${b.nome_sindico}` : ''].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Dialog open={signatarios} onOpenChange={setSignatarios}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Signatários da EXA</DialogTitle></DialogHeader>
          <SignatariosExaManager />
        </DialogContent>
      </Dialog>
    </Pagina>
  );
};

export default ContratosPage;
