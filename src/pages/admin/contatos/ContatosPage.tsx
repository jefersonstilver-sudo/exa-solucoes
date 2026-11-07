// EXA (07/11/2026) — Contatos refeita a pedido do Jeferson: Clientes (contas com pedido) separados dos Leads (tabela contacts),
// busca única, seleção de vários e exclusão com motivo (log de auditoria). Kanban, pontuação e bloqueios saíram do menu.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, ShoppingBag, Users, UserRound, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useQuery } from '@tanstack/react-query';
import { Pagina, Cabecalho, Busca, Pilulas, Kpi, Chip, TOM, Avatar, Carregando, Vazio, BOTAO, BOTAO2, vidro } from '@/components/admin/ui/exa';
import { ExcluirComMotivo } from '@/components/admin/ui/ExcluirComMotivo';
import { usePedidosAtraso, ehContaInterna, ehEditorial } from '@/hooks/usePedidosAtraso';
import { formatCurrency } from '@/utils/formatters';
import type { Contact } from '@/types/contatos';

type Aba = 'clientes' | 'leads' | 'outros';
const INATIVOS = ['cancelado', 'cancelado_automaticamente', 'finalizado'];

interface Cliente {
  id: string; nome: string; empresa: string; telefone: string; email: string | null;
  pedidos: number; noAr: number; bloqueados: number; receita: number; ultimo: string | null; fim: string | null; interna: boolean; pedidoIds: string[];
}

const fone = (t?: string | null) => {
  const d = String(t || '').replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return t || '';
};
const quando = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

const CATEGORIA: Record<string, { rotulo: string; tom: keyof typeof TOM }> = {
  lead: { rotulo: 'Lead', tom: 'azul' }, anunciante: { rotulo: 'Anunciante', tom: 'verde' },
  sindico_exa: { rotulo: 'Síndico EXA', tom: 'roxo' }, sindico_lead: { rotulo: 'Síndico (lead)', tom: 'azul' },
  parceiro_exa: { rotulo: 'Parceiro', tom: 'verde' }, parceiro_lead: { rotulo: 'Parceiro (lead)', tom: 'azul' },
  prestador_elevador: { rotulo: 'Empresa de elevador', tom: 'ambar' }, eletricista: { rotulo: 'Eletricista', tom: 'ambar' },
  provedor: { rotulo: 'Provedor', tom: 'ambar' }, equipe_exa: { rotulo: 'Equipe EXA', tom: 'cinza' }, outros: { rotulo: 'Outros', tom: 'cinza' },
};
const TEMPERATURA: Record<string, keyof typeof TOM> = { quente: 'vermelho', morno: 'ambar', frio: 'azul' };
const ORIGEM: Record<string, string> = {
  conversa_whatsapp_sofia: 'Sofia', conversa_whatsapp_vendedor: 'WhatsApp', conversa_whatsapp_exa_alert: 'Notificações', proposta_comercial: 'Proposta', proposta: 'Proposta',
  cadastro_manual: 'Manual', checkout_site: 'Site', pedido_criado: 'Pedido', indicacao: 'Indicação', importacao: 'Importação',
};
const ehLead = (c: Contact) => ['lead', 'sindico_lead', 'parceiro_lead'].includes(c.categoria);

const useClientes = () => useQuery({
  queryKey: ['contatos-clientes'],
  staleTime: 60_000,
  queryFn: async (): Promise<Cliente[]> => {
    const [{ data: peds }, { data: marcas }] = await Promise.all([
      supabase.from('pedidos').select('id, client_id, client_name, nome_pedido, status, valor_total, valor_mensal, plano_meses, created_at, data_fim').limit(2000),
      (supabase as any).from('marcas_clientes').select('user_id, empresa').limit(2000).then((r: any) => r, () => ({ data: [] })),
    ]);
    const ids = [...new Set((peds || []).map((p: any) => p.client_id).filter(Boolean))];
    const { data: us } = ids.length ? await (supabase as any).from('users').select('id, nome, empresa_nome, telefone, email, financeiro_whatsapp').in('id', ids) : { data: [] };
    const uMap = new Map<string, any>((us || []).map((u: any) => [u.id, u]));
    const marca = new Map<string, string>((marcas || []).map((m: any) => [m.user_id, m.empresa]));
    const por = new Map<string, Cliente>();
    for (const p of (peds || []) as any[]) {
      if (!p.client_id) continue;
      const u = uMap.get(p.client_id) || {};
      let c = por.get(p.client_id);
      if (!c) {
        c = {
          id: p.client_id, nome: u.nome || p.client_name || '—', empresa: marca.get(p.client_id) || u.empresa_nome || p.client_name || '', telefone: u.telefone || u.financeiro_whatsapp || '', email: u.email || null,
          pedidos: 0, noAr: 0, bloqueados: 0, receita: 0, ultimo: null, fim: null, interna: ehContaInterna({ client_id: p.client_id, client_name: p.client_name }), pedidoIds: [],
        };
        por.set(p.client_id, c);
      }
      c.pedidos += 1; c.pedidoIds.push(p.id);
      if (!c.ultimo || p.created_at > c.ultimo) c.ultimo = p.created_at;
      if (p.status === 'bloqueado') c.bloqueados += 1;
      else if (!INATIVOS.includes(p.status) && ['ativo', 'video_aprovado'].includes(p.status) && (!p.data_fim || new Date(p.data_fim).getTime() > Date.now())) {
        c.noAr += 1;
        if (!ehEditorial(p)) c.receita += p.valor_mensal > 0 ? p.valor_mensal : p.plano_meses > 1 ? (p.valor_total || 0) / p.plano_meses : p.valor_total || 0;
        if (!c.fim || (p.data_fim && p.data_fim > c.fim)) c.fim = p.data_fim;
      }
    }
    return [...por.values()].sort((a, b) => (b.noAr - a.noAr) || (b.receita - a.receita) || a.empresa.localeCompare(b.empresa));
  },
});

const useContatosTabela = () => useQuery({
  queryKey: ['contatos-tabela'],
  staleTime: 30_000,
  queryFn: async (): Promise<Contact[]> => {
    const { data, error } = await supabase.from('contacts').select('id, nome, sobrenome, empresa, telefone, email, categoria, temperatura, status, origem, bloqueado, created_at, updated_at, last_interaction_at, last_contact_at, cidade, logo_url').neq('categoria', 'ocultar').order('updated_at', { ascending: false }).limit(2000);
    if (error) throw error;
    return (data || []) as Contact[];
  },
});

const ContatosPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [aba, setAba] = useState<Aba>(() => { try { return (localStorage.getItem('contatos_aba') as Aba) || 'clientes'; } catch { return 'clientes'; } });
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const clientes = useClientes();
  const contatos = useContatosTabela();
  const { data: atrasos } = usePedidosAtraso();
  useEffect(() => { try { localStorage.setItem('contatos_aba', aba); } catch { /* sem armazenamento */ } setSel(new Set()); }, [aba]);

  const q = busca.trim().toLowerCase();
  const bate = (...xs: (string | null | undefined)[]) => !q || xs.some((x) => String(x || '').toLowerCase().includes(q)) || xs.some((x) => String(x || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length >= 4);

  const atrasoDe = (c: Cliente) => c.pedidoIds.reduce((a, id) => a + (atrasos?.get(id)?.valor_atraso || 0), 0);

  const listaClientes = useMemo(() => (clientes.data || []).filter((c) => !c.interna && bate(c.nome, c.empresa, c.telefone, c.email)), [clientes.data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const leads = useMemo(() => (contatos.data || []).filter((c) => ehLead(c) && c.status !== 'arquivado' && bate(c.nome, c.sobrenome, c.empresa, c.telefone, c.email)), [contatos.data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const outros = useMemo(() => (contatos.data || []).filter((c) => !ehLead(c) && bate(c.nome, c.sobrenome, c.empresa, c.telefone, c.email)), [contatos.data, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const nClientes = (clientes.data || []).filter((c) => !c.interna).length;
  const nLeads = (contatos.data || []).filter((c) => ehLead(c) && c.status !== 'arquivado').length;
  const nOutros = (contatos.data || []).filter((c) => !ehLead(c)).length;
  const noAr = (clientes.data || []).filter((c) => !c.interna && c.noAr > 0).length;
  const atrasoTotal = [...(atrasos?.values() || [])].reduce((a, x) => a + (x.valor_atraso || 0), 0);

  const visiveis = aba === 'leads' ? leads : aba === 'outros' ? outros : [];
  const alternar = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const todosSel = visiveis.length > 0 && visiveis.every((c) => sel.has(c.id));
  const abrirSofia = (tel?: string | null, nome?: string) => navigate(buildPath(`crm-evolution/conversas/sofia?telefone=${String(tel || '').replace(/\D/g, '')}&nome=${encodeURIComponent(nome || '')}`));

  const LinhaContato: React.FC<{ c: Contact }> = ({ c }) => {
    const cat = CATEGORIA[c.categoria] || CATEGORIA.outros;
    const marcado = sel.has(c.id);
    return (
      <li className={`flex items-center gap-3 px-3 py-2.5 transition-colors md:px-4 ${marcado ? 'bg-[#FDECEC]/60' : 'hover:bg-white/70'}`}>
        <button type="button" onClick={() => alternar(c.id)} aria-pressed={marcado} aria-label={marcado ? 'Desmarcar' : 'Marcar'} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#6A6B70] hover:bg-black/[0.04]">
          {marcado ? <CheckSquare className="h-[18px] w-[18px] text-[#9C1E1E]" /> : <Square className="h-[18px] w-[18px]" />}
        </button>
        <button type="button" onClick={() => navigate(buildPath(`contatos/${c.id}`))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar nome={`${c.nome} ${c.sobrenome || ''}`} foto={c.logo_url} tamanho={38} cor={TOM[cat.tom].cor} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14px] font-bold">{c.nome} {c.sobrenome || ''}</span>
              {c.bloqueado && <Chip {...TOM.vermelho}>bloqueado</Chip>}
            </span>
            <span className="block truncate text-[12.5px] text-[#6A6B70]">{[c.empresa, fone(c.telefone), c.cidade].filter(Boolean).join(' · ')}</span>
          </span>
        </button>
        <div className="hidden items-center gap-1.5 md:flex">
          <Chip {...TOM[cat.tom]}>{cat.rotulo}</Chip>
          {c.temperatura && <Chip {...TOM[TEMPERATURA[c.temperatura] || 'cinza']}>{c.temperatura}</Chip>}
          {c.origem && <Chip {...TOM.cinza} title="Origem">{ORIGEM[c.origem] || c.origem}</Chip>}
        </div>
        <span className="hidden w-[76px] shrink-0 text-right text-[12px] tabular-nums text-[#8A8B90] lg:block" title="Último contato">{quando(c.last_interaction_at || c.last_contact_at || c.updated_at)}</span>
        <button type="button" onClick={() => abrirSofia(c.telefone, c.nome)} title="Abrir no WhatsApp da Sofia" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#1E6B47] hover:bg-[#EAF5EF]"><MessageCircle className="h-4 w-4" /></button>
      </li>
    );
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Contatos"
        sub="Clientes são as contas com pedido; leads são quem ainda não comprou. Marque vários para excluir com motivo."
        acoes={<button type="button" className={BOTAO} onClick={() => navigate(buildPath('contatos/novo'))}><Plus className="h-4 w-4" /> Novo contato</button>}
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Clientes" valor={nClientes} sub={`${noAr} com pedido no ar`} icone={Users} onClick={() => setAba('clientes')} />
        <Kpi rotulo="Leads" valor={nLeads} sub="ainda não compraram" icone={UserRound} cor="#2B4C8C" onClick={() => setAba('leads')} />
        <Kpi rotulo="Em atraso" valor={formatCurrency(atrasoTotal)} cor={atrasoTotal ? '#B0261D' : '#1E6B47'} sub={`${[...(atrasos?.values() || [])].filter((x) => x.valor_atraso > 0).length} cliente(s)`} />
        <Kpi rotulo="Outros" valor={nOutros} sub="equipe, síndicos, prestadores" cor="#6A6B70" onClick={() => setAba('outros')} />
      </div>

      <Busca valor={busca} onChange={setBusca} placeholder="Nome, empresa, telefone ou e-mail">
        <Pilulas valor={aba} onChange={(v) => setAba(v as Aba)} opcoes={[{ valor: 'clientes', rotulo: 'Clientes', n: nClientes }, { valor: 'leads', rotulo: 'Leads', n: nLeads }, { valor: 'outros', rotulo: 'Outros', n: nOutros }]} />
      </Busca>

      {aba === 'clientes' ? (
        clientes.isLoading ? <Carregando /> : !listaClientes.length ? <Vazio icone={<Users className="h-5 w-5" />} titulo="Nenhum cliente encontrado" /> : (
          <div className={`${vidro} overflow-hidden rounded-[22px]`}>
            <ul className="divide-y divide-black/[0.06]">
              {listaClientes.map((c) => {
                const vivo = c.noAr > 0;
                return (
                  <li key={c.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4 ${!vivo ? 'opacity-70' : ''}`}>
                    <button type="button" onClick={() => navigate(buildPath(`pedidos?busca=${encodeURIComponent(c.empresa || c.nome)}`))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Avatar nome={c.empresa || c.nome} tamanho={38} cor={vivo ? '#1E6B47' : '#8A8B90'} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-bold">{c.empresa || c.nome}</span>
                          {vivo ? <Chip {...TOM.verde}>{c.noAr} no ar</Chip> : c.bloqueados ? <Chip {...TOM.cinza}>bloqueado</Chip> : <Chip {...TOM.cinza}>sem pedido ativo</Chip>}
                          {atrasoDe(c) > 0 && <Chip {...TOM.vermelho} title="Em atraso">{formatCurrency(atrasoDe(c))} atrasado</Chip>}
                        </span>
                        <span className="block truncate text-[12.5px] text-[#6A6B70]">{[c.nome !== c.empresa ? c.nome : '', fone(c.telefone), c.email].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                    <div className="hidden items-center gap-4 text-right md:flex">
                      <span className="w-[92px] text-[13px] font-bold tabular-nums" style={{ color: c.receita ? '#1E6B47' : '#8A8B90' }}>{c.receita ? `${formatCurrency(c.receita)}/mês` : '—'}</span>
                      <span className="w-[70px] text-[12px] tabular-nums text-[#8A8B90]" title="Pedidos">{c.pedidos} pedido{c.pedidos === 1 ? '' : 's'}</span>
                      <span className="w-[76px] text-[12px] tabular-nums text-[#8A8B90]" title={vivo ? 'Termina em' : 'Último pedido'}>{vivo ? quando(c.fim) : quando(c.ultimo)}</span>
                    </div>
                    <button type="button" onClick={() => navigate(buildPath(`pedidos?busca=${encodeURIComponent(c.empresa || c.nome)}`))} title="Ver pedidos" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#9C1E1E] hover:bg-[#FDECEC]"><ShoppingBag className="h-4 w-4" /></button>
                    <button type="button" onClick={() => abrirSofia(c.telefone, c.nome)} title="Abrir no WhatsApp da Sofia" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#1E6B47] hover:bg-[#EAF5EF]"><MessageCircle className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : (
        contatos.isLoading ? <Carregando /> : !visiveis.length ? <Vazio icone={<UserRound className="h-5 w-5" />} titulo={aba === 'leads' ? 'Nenhum lead encontrado' : 'Nenhum contato encontrado'} /> : (
          <div className={`${vidro} overflow-hidden rounded-[22px]`}>
            <div className="flex items-center gap-2 border-b border-black/[0.06] bg-white/50 px-3 py-2 md:px-4">
              <button type="button" onClick={() => setSel(todosSel ? new Set() : new Set(visiveis.map((c) => c.id)))} className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-[12.5px] font-bold text-[#45464A] hover:bg-black/[0.04]">
                {todosSel ? <CheckSquare className="h-[18px] w-[18px] text-[#9C1E1E]" /> : <Square className="h-[18px] w-[18px]" />} {todosSel ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
              <span className="text-[12px] text-[#8A8B90]">{visiveis.length} contato{visiveis.length === 1 ? '' : 's'}</span>
              {sel.size > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[12.5px] font-bold text-[#9C1E1E]">{sel.size} marcado{sel.size === 1 ? '' : 's'}</span>
                  <ExcluirComMotivo tabela="contacts" ids={[...sel]} nome={visiveis.find((c) => sel.has(c.id))?.nome || 'contato'} onFeito={() => { setSel(new Set()); contatos.refetch(); }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#B0261D] px-3 text-[13px] font-bold text-white hover:bg-[#8f1e17]">
                    <Trash2 className="h-4 w-4" /> Excluir {sel.size}
                  </ExcluirComMotivo>
                  <button type="button" onClick={() => setSel(new Set())} className={`${BOTAO2} h-9`} aria-label="Limpar seleção"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            <ul className="divide-y divide-black/[0.06]">{visiveis.map((c) => <LinhaContato key={c.id} c={c} />)}</ul>
          </div>
        )
      )}
    </Pagina>
  );
};

export default ContatosPage;
