// EXA (07/11/2026) — Empresas de elevador e provedores de internet dentro de Painéis EXA (Jeferson): são coisas separadas
// (tipo 'elevador' x 'servico'), cada empresa com uma ou mais pessoas de contato (fornecedor_contatos) e, nos provedores,
// os acessos às contas: link, login e senha (fornecedor_acessos, só admin). Empresas de elevador: painéis/prédios atendidos
// por devices.empresa_elevador_id e atalho para o Nando chamar.
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Phone, Mail, MessageCircle, Pencil, Building2, X, Save, Loader2, ChevronDown, ChevronUp, UserRound, KeyRound, ExternalLink, Copy, Eye, EyeOff, Trash2, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Busca, Chip, TOM, Avatar, Carregando, Vazio, BOTAO, BOTAO2, CAMPO, ROTULO, Interruptor, vidro } from '@/components/admin/ui/exa';

export type TipoFornecedor = 'elevador' | 'internet';
interface Empresa { id: string; nome_fantasia: string | null; razao_social: string; cnpj: string; telefone: string | null; email: string | null; endereco: string | null; observacao: string | null; ativo: boolean; tipo: string }
interface Painel { id: string; name: string | null; building_id: string | null; empresa_elevador_id: string | null }
interface Pessoa { id: string; fornecedor_id: string; nome: string; cargo: string | null; telefone: string | null; email: string | null; principal: boolean; observacao: string | null }
interface Acesso { id: string; fornecedor_id: string; rotulo: string; url: string | null; login: string | null; senha: string | null; observacao: string | null }

const fone = (t?: string | null) => {
  const d = String(t || '').replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return d.startsWith('0800') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || '';
};
const VAZIA = { nome_fantasia: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '', observacao: '', ativo: true };
const copiar = (v: string, r: string) => { navigator.clipboard.writeText(v); toast.success(`${r} copiado.`); };

export const Elevadores: React.FC<{ predios: Map<string, string>; tipo?: TipoFornecedor }> = ({ predios, tipo = 'elevador' }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Partial<Empresa> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);
  const ehElevador = tipo === 'elevador';
  const rotuloTipo = ehElevador ? 'empresa de elevador' : 'provedor de internet';

  const empresas = useQuery({
    queryKey: ['fornecedores', tipo],
    queryFn: async () => {
      let q = (supabase as any).from('fornecedores').select('id, nome_fantasia, razao_social, cnpj, telefone, email, endereco, observacao, ativo, tipo').order('nome_fantasia');
      q = ehElevador ? q.eq('tipo', 'elevador') : q.neq('tipo', 'elevador');
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Empresa[];
    },
  });
  const pessoas = useQuery({
    queryKey: ['fornecedor-contatos'],
    queryFn: async () => { const { data } = await (supabase as any).from('fornecedor_contatos').select('*').order('principal', { ascending: false }).order('nome'); return (data || []) as Pessoa[]; },
  });
  const acessos = useQuery({
    queryKey: ['fornecedor-acessos'],
    queryFn: async () => { const { data } = await (supabase as any).from('fornecedor_acessos').select('*').order('rotulo'); return (data || []) as Acesso[]; },
  });
  const paineis = useQuery({
    queryKey: ['elevadores-paineis'],
    enabled: ehElevador,
    queryFn: async () => {
      const { data } = await (supabase as any).from('devices').select('id, name, building_id, empresa_elevador_id').is('deleted_at', null).not('empresa_elevador_id', 'is', null);
      return (data || []) as Painel[];
    },
  });
  const porEmpresa = useMemo(() => {
    const m = new Map<string, Painel[]>();
    for (const p of paineis.data || []) { if (!p.empresa_elevador_id) continue; m.set(p.empresa_elevador_id, [...(m.get(p.empresa_elevador_id) || []), p]); }
    return m;
  }, [paineis.data]);
  const pessoasDe = (id: string) => (pessoas.data || []).filter((p) => p.fornecedor_id === id);
  const acessosDe = (id: string) => (acessos.data || []).filter((a) => a.fornecedor_id === id);

  const q = busca.trim().toLowerCase();
  const lista = (empresas.data || []).filter((e) => !q || [e.nome_fantasia, e.razao_social, e.cnpj, e.telefone, e.email, ...pessoasDe(e.id).map((p) => p.nome)].some((s) => String(s || '').toLowerCase().includes(q)))
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || (porEmpresa.get(b.id)?.length || 0) - (porEmpresa.get(a.id)?.length || 0) || (a.nome_fantasia || a.razao_social).localeCompare(b.nome_fantasia || b.razao_social));

  const salvar = async () => {
    if (!editando) return;
    const nome = (editando.nome_fantasia || '').trim();
    if (!nome) { toast.error(`Diga o nome d${ehElevador ? 'a' : 'o'} ${rotuloTipo}.`); return; }
    setSalvando(true);
    try {
      const corpo = {
        nome_fantasia: nome, razao_social: (editando.razao_social || '').trim() || nome, cnpj: (editando.cnpj || '').replace(/\D/g, '') || `0000000000${String(Date.now()).slice(-4)}`,
        telefone: (editando.telefone || '').trim() || null, email: (editando.email || '').trim() || null, endereco: (editando.endereco || '').trim() || null,
        observacao: (editando.observacao || '').trim() || null, ativo: editando.ativo ?? true, tipo: ehElevador ? 'elevador' : (editando.tipo && editando.tipo !== 'elevador' ? editando.tipo : 'servico'),
      };
      const { error } = editando.id
        ? await (supabase as any).from('fornecedores').update(corpo).eq('id', editando.id)
        : await (supabase as any).from('fornecedores').insert(corpo);
      if (error) throw error;
      toast.success(editando.id ? 'Empresa atualizada.' : 'Empresa cadastrada.');
      setEditando(null);
      qc.invalidateQueries({ queryKey: ['fornecedores'] });
    } catch (e: any) { toast.error('Não salvou: ' + (e?.message || e)); } finally { setSalvando(false); }
  };

  const nando = (e: Empresa) => navigate(buildPath(`crm-evolution/conversas/nando?telefone=${String(e.telefone || '').replace(/\D/g, '')}`));

  return (
    <>
      <Busca valor={busca} onChange={setBusca} placeholder={ehElevador ? 'Empresa, pessoa, CNPJ ou telefone' : 'Provedor, pessoa, CNPJ ou telefone'}>
        <button type="button" className={BOTAO} onClick={() => setEditando({ ...VAZIA })}><Plus className="h-4 w-4" /> {ehElevador ? 'Nova empresa' : 'Novo provedor'}</button>
      </Busca>

      {editando && (
        <section className={`${vidro} rounded-[22px] p-4 md:p-5`} aria-label={editando.id ? 'Editar' : 'Novo'}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={ROTULO}>{editando.id ? `Editar ${rotuloTipo}` : `Nov${ehElevador ? 'a' : 'o'} ${rotuloTipo}`}</h2>
            <button type="button" onClick={() => setEditando(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/[0.05]" aria-label="Fechar"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label><span className={ROTULO}>Nome</span><input className={`${CAMPO} mt-1`} value={editando.nome_fantasia || ''} onChange={(e) => setEditando({ ...editando, nome_fantasia: e.target.value })} placeholder={ehElevador ? 'Ex.: Atlas Schindler' : 'Ex.: Ligga'} autoFocus /></label>
            <label><span className={ROTULO}>Telefone geral / central</span><input className={`${CAMPO} mt-1`} inputMode="tel" value={editando.telefone || ''} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} placeholder="45 99999-9999 ou 0800" /></label>
            <label><span className={ROTULO}>E-mail geral</span><input className={`${CAMPO} mt-1`} type="email" value={editando.email || ''} onChange={(e) => setEditando({ ...editando, email: e.target.value })} /></label>
            <label><span className={ROTULO}>Razão social</span><input className={`${CAMPO} mt-1`} value={editando.razao_social || ''} onChange={(e) => setEditando({ ...editando, razao_social: e.target.value })} /></label>
            <label><span className={ROTULO}>CNPJ</span><input className={`${CAMPO} mt-1`} value={editando.cnpj || ''} onChange={(e) => setEditando({ ...editando, cnpj: e.target.value })} placeholder="opcional" /></label>
            <label><span className={ROTULO}>Endereço</span><input className={`${CAMPO} mt-1`} value={editando.endereco || ''} onChange={(e) => setEditando({ ...editando, endereco: e.target.value })} /></label>
            <label className="md:col-span-3"><span className={ROTULO}>Observações (horário, como pedir atendimento, protocolo)</span><textarea className={`${CAMPO} mt-1 h-auto py-2`} rows={2} value={editando.observacao || ''} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Interruptor on={editando.ativo ?? true} onChange={(v) => setEditando({ ...editando, ativo: v })} rotulo="Ativa" />
            <div className="flex gap-2">
              <button type="button" className={BOTAO2} onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className={BOTAO} onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
            </div>
          </div>
        </section>
      )}

      {empresas.isLoading ? <Carregando /> : !lista.length ? (
        <Vazio icone={ehElevador ? <Building2 className="h-5 w-5" /> : <Wifi className="h-5 w-5" />} titulo={ehElevador ? 'Nenhuma empresa de elevador cadastrada' : 'Nenhum provedor de internet cadastrado'} acao={<button type="button" className={BOTAO} onClick={() => setEditando({ ...VAZIA })}><Plus className="h-4 w-4" /> Cadastrar</button>} />
      ) : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {lista.map((e) => {
              const ps = porEmpresa.get(e.id) || [];
              const nomesPredios = [...new Set(ps.map((p) => (p.building_id && predios.get(p.building_id)) || p.name || '').filter(Boolean))];
              const gente = pessoasDe(e.id);
              const chaves = acessosDe(e.id);
              const principal = gente.find((g) => g.principal) || gente[0];
              const abertaAqui = aberta === e.id;
              return (
                <li key={e.id} className={`${!e.ativo ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4">
                    <button type="button" onClick={() => setAberta(abertaAqui ? null : e.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Avatar nome={e.nome_fantasia || e.razao_social} tamanho={40} cor={!e.ativo ? '#8A8B90' : ehElevador ? '#9A5300' : '#2B4C8C'} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="truncate text-[14px] font-bold">{e.nome_fantasia || e.razao_social}</span>
                          {!e.ativo && <Chip {...TOM.cinza}>inativa</Chip>}
                          {ehElevador && ps.length > 0 && <Chip {...TOM.azul}>{ps.length} painel{ps.length === 1 ? '' : 'is'}</Chip>}
                          {gente.length > 0 && <Chip {...TOM.verde}>{gente.length} pessoa{gente.length === 1 ? '' : 's'}</Chip>}
                          {!ehElevador && chaves.length > 0 && <Chip {...TOM.roxo}>{chaves.length} acesso{chaves.length === 1 ? '' : 's'}</Chip>}
                          {!e.telefone && !principal?.telefone && <Chip {...TOM.vermelho}>sem telefone</Chip>}
                        </span>
                        <span className="block truncate text-[12.5px] text-[#6A6B70]">
                          {[e.telefone ? fone(e.telefone) : '', principal ? `${principal.nome}${principal.telefone ? ` ${fone(principal.telefone)}` : ''}` : '', e.email, ehElevador ? nomesPredios.slice(0, 4).join(', ') + (nomesPredios.length > 4 ? ` +${nomesPredios.length - 4}` : '') : ''].filter(Boolean).join(' · ') || 'sem contato cadastrado'}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center">
                      {(e.telefone || principal?.telefone) && <a href={`tel:${String(principal?.telefone || e.telefone).replace(/\D/g, '')}`} title="Ligar" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Phone className="h-4 w-4" /></a>}
                      {e.email && <a href={`mailto:${e.email}`} title="E-mail" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Mail className="h-4 w-4" /></a>}
                      {ehElevador && <button type="button" onClick={() => nando(e)} disabled={!e.telefone} title="Abrir no WhatsApp do Nando" className="grid h-9 w-9 place-items-center rounded-xl text-[#9C1E1E] hover:bg-[#FDECEC] disabled:opacity-30"><MessageCircle className="h-4 w-4" /></button>}
                      <button type="button" onClick={() => setEditando({ ...e })} title="Editar empresa" className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setAberta(abertaAqui ? null : e.id)} title={abertaAqui ? 'Recolher' : 'Pessoas e acessos'} className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]">{abertaAqui ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  {abertaAqui && (
                    <div className="grid gap-4 border-t border-black/[0.05] bg-white/40 px-3 py-4 md:grid-cols-2 md:px-4">
                      <Pessoas fornecedorId={e.id} lista={gente} onMudou={() => qc.invalidateQueries({ queryKey: ['fornecedor-contatos'] })} />
                      <Acessos fornecedorId={e.id} lista={chaves} onMudou={() => qc.invalidateQueries({ queryKey: ['fornecedor-acessos'] })} />
                      {e.observacao && <p className="text-[12.5px] text-[#6A6B70] md:col-span-2">{e.observacao}</p>}
                      {ehElevador && nomesPredios.length > 0 && <p className="text-[12.5px] text-[#6A6B70] md:col-span-2"><b>Prédios atendidos:</b> {nomesPredios.join(', ')}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

/** Pessoas de contato de uma empresa (uma ou mais). */
const Pessoas: React.FC<{ fornecedorId: string; lista: Pessoa[]; onMudou: () => void }> = ({ fornecedorId, lista, onMudou }) => {
  const [ed, setEd] = useState<Partial<Pessoa> | null>(null);
  const [indo, setIndo] = useState(false);
  const salvar = async () => {
    if (!ed?.nome?.trim()) { toast.error('Nome da pessoa.'); return; }
    setIndo(true);
    try {
      const corpo = { fornecedor_id: fornecedorId, nome: ed.nome.trim(), cargo: ed.cargo?.trim() || null, telefone: ed.telefone?.trim() || null, email: ed.email?.trim() || null, principal: !!ed.principal, observacao: ed.observacao?.trim() || null, updated_at: new Date().toISOString() };
      const { error } = ed.id ? await (supabase as any).from('fornecedor_contatos').update(corpo).eq('id', ed.id) : await (supabase as any).from('fornecedor_contatos').insert(corpo);
      if (error) throw error;
      setEd(null); onMudou(); toast.success('Pessoa salva.');
    } catch (e: any) { toast.error('Não salvou: ' + (e?.message || e)); } finally { setIndo(false); }
  };
  const excluir = async (p: Pessoa) => {
    if (!window.confirm(`Remover ${p.nome}?`)) return;
    const { error } = await (supabase as any).from('fornecedor_contatos').delete().eq('id', p.id);
    if (error) toast.error(error.message); else { onMudou(); toast.success('Removido.'); }
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><span className={ROTULO}><UserRound className="mr-1 inline h-3.5 w-3.5" />Pessoas de contato</span><button type="button" className="text-[12.5px] font-bold text-[#9C1E1E] hover:underline" onClick={() => setEd({ principal: lista.length === 0 })}>+ pessoa</button></div>
      {!lista.length && !ed && <p className="text-[12.5px] text-[#8A8B90]">Ninguém cadastrado ainda. Cadastre quem atende a EXA (técnico, comercial, suporte).</p>}
      <ul className="space-y-1.5">
        {lista.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[13px]">
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2"><b className="truncate">{p.nome}</b>{p.cargo && <span className="text-[#6A6B70]">{p.cargo}</span>}{p.principal && <Chip {...TOM.verde}>principal</Chip>}</span>
              <span className="block truncate text-[12px] text-[#6A6B70]">{[p.telefone ? fone(p.telefone) : '', p.email, p.observacao].filter(Boolean).join(' · ')}</span>
            </span>
            {p.telefone && <a href={`https://wa.me/${String(p.telefone).replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="grid h-8 w-8 place-items-center rounded-lg text-[#1E6B47] hover:bg-[#EAF5EF]"><MessageCircle className="h-4 w-4" /></a>}
            <button type="button" onClick={() => setEd({ ...p })} className="grid h-8 w-8 place-items-center rounded-lg text-[#45464A] hover:bg-black/[0.05]" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => excluir(p)} className="grid h-8 w-8 place-items-center rounded-lg text-[#B0261D] hover:bg-[#FDECEC]" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      {ed && (
        <div className="mt-2 grid gap-2 rounded-xl bg-white/80 p-3 ring-1 ring-black/[0.06] sm:grid-cols-2">
          <input className={CAMPO} placeholder="Nome" value={ed.nome || ''} onChange={(e) => setEd({ ...ed, nome: e.target.value })} autoFocus />
          <input className={CAMPO} placeholder="Cargo (técnico, comercial, suporte)" value={ed.cargo || ''} onChange={(e) => setEd({ ...ed, cargo: e.target.value })} />
          <input className={CAMPO} placeholder="WhatsApp / telefone" inputMode="tel" value={ed.telefone || ''} onChange={(e) => setEd({ ...ed, telefone: e.target.value })} />
          <input className={CAMPO} placeholder="E-mail" type="email" value={ed.email || ''} onChange={(e) => setEd({ ...ed, email: e.target.value })} />
          <input className={`${CAMPO} sm:col-span-2`} placeholder="Observação (horário, assunto que resolve)" value={ed.observacao || ''} onChange={(e) => setEd({ ...ed, observacao: e.target.value })} />
          <div className="flex items-center justify-between sm:col-span-2">
            <Interruptor on={!!ed.principal} onChange={(v) => setEd({ ...ed, principal: v })} rotulo="Contato principal" />
            <div className="flex gap-2"><button type="button" className={`${BOTAO2} h-9`} onClick={() => setEd(null)}>Cancelar</button><button type="button" className={`${BOTAO} h-9`} onClick={salvar} disabled={indo}>{indo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Acessos às contas (portal do provedor, app, área do cliente): link, login e senha — só a equipe admin vê. */
const Acessos: React.FC<{ fornecedorId: string; lista: Acesso[]; onMudou: () => void }> = ({ fornecedorId, lista, onMudou }) => {
  const [ed, setEd] = useState<Partial<Acesso> | null>(null);
  const [indo, setIndo] = useState(false);
  const [mostrar, setMostrar] = useState<Set<string>>(new Set());
  const salvar = async () => {
    if (!ed) return;
    setIndo(true);
    try {
      const corpo = { fornecedor_id: fornecedorId, rotulo: ed.rotulo?.trim() || 'Portal', url: ed.url?.trim() || null, login: ed.login?.trim() || null, senha: ed.senha ?? null, observacao: ed.observacao?.trim() || null, updated_at: new Date().toISOString() };
      const { error } = ed.id ? await (supabase as any).from('fornecedor_acessos').update(corpo).eq('id', ed.id) : await (supabase as any).from('fornecedor_acessos').insert(corpo);
      if (error) throw error;
      setEd(null); onMudou(); toast.success('Acesso salvo.');
    } catch (e: any) { toast.error('Não salvou: ' + (e?.message || e)); } finally { setIndo(false); }
  };
  const excluir = async (a: Acesso) => {
    if (!window.confirm(`Remover o acesso "${a.rotulo}"?`)) return;
    const { error } = await (supabase as any).from('fornecedor_acessos').delete().eq('id', a.id);
    if (error) toast.error(error.message); else { onMudou(); toast.success('Removido.'); }
  };
  const ver = (id: string) => setMostrar((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><span className={ROTULO}><KeyRound className="mr-1 inline h-3.5 w-3.5" />Acessos às contas</span><button type="button" className="text-[12.5px] font-bold text-[#9C1E1E] hover:underline" onClick={() => setEd({ rotulo: 'Portal do cliente' })}>+ acesso</button></div>
      {!lista.length && !ed && <p className="text-[12.5px] text-[#8A8B90]">Nenhum acesso guardado. Cadastre o link da área do cliente, login e senha para ver as contas.</p>}
      <ul className="space-y-1.5">
        {lista.map((a) => (
          <li key={a.id} className="rounded-xl bg-white/70 px-3 py-2 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2"><b className="truncate">{a.rotulo}</b>{a.url && <a href={/^https?:/.test(a.url) ? a.url : `https://${a.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2B4C8C] hover:underline"><ExternalLink className="h-3 w-3" />abrir</a>}</span>
                <span className="block truncate text-[12px] text-[#6A6B70]">{a.login ? `login ${a.login}` : 'sem login'}{a.senha ? ` · senha ${mostrar.has(a.id) ? a.senha : '••••••••'}` : ''}{a.observacao ? ` · ${a.observacao}` : ''}</span>
              </span>
              {a.login && <button type="button" onClick={() => copiar(a.login!, 'Login')} className="grid h-8 w-8 place-items-center rounded-lg text-[#45464A] hover:bg-black/[0.05]" title="Copiar login"><Copy className="h-3.5 w-3.5" /></button>}
              {a.senha && <button type="button" onClick={() => ver(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#45464A] hover:bg-black/[0.05]" title={mostrar.has(a.id) ? 'Esconder senha' : 'Ver senha'}>{mostrar.has(a.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>}
              {a.senha && <button type="button" onClick={() => copiar(a.senha!, 'Senha')} className="grid h-8 w-8 place-items-center rounded-lg text-[#45464A] hover:bg-black/[0.05]" title="Copiar senha"><KeyRound className="h-3.5 w-3.5" /></button>}
              <button type="button" onClick={() => setEd({ ...a })} className="grid h-8 w-8 place-items-center rounded-lg text-[#45464A] hover:bg-black/[0.05]" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => excluir(a)} className="grid h-8 w-8 place-items-center rounded-lg text-[#B0261D] hover:bg-[#FDECEC]" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
      </ul>
      {ed && (
        <div className="mt-2 grid gap-2 rounded-xl bg-white/80 p-3 ring-1 ring-black/[0.06] sm:grid-cols-2">
          <input className={CAMPO} placeholder="Rótulo (Portal do cliente, App, Fatura)" value={ed.rotulo || ''} onChange={(e) => setEd({ ...ed, rotulo: e.target.value })} autoFocus />
          <input className={CAMPO} placeholder="Link (https://…)" value={ed.url || ''} onChange={(e) => setEd({ ...ed, url: e.target.value })} />
          <input className={CAMPO} placeholder="Login / CPF / CNPJ de acesso" value={ed.login || ''} onChange={(e) => setEd({ ...ed, login: e.target.value })} autoComplete="off" />
          <input className={CAMPO} placeholder="Senha" type="text" value={ed.senha || ''} onChange={(e) => setEd({ ...ed, senha: e.target.value })} autoComplete="off" />
          <input className={`${CAMPO} sm:col-span-2`} placeholder="Observação (contrato, nº do cliente, vencimento)" value={ed.observacao || ''} onChange={(e) => setEd({ ...ed, observacao: e.target.value })} />
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={`${BOTAO2} h-9`} onClick={() => setEd(null)}>Cancelar</button><button type="button" className={`${BOTAO} h-9`} onClick={salvar} disabled={indo}>{indo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button></div>
        </div>
      )}
    </div>
  );
};

export default Elevadores;
