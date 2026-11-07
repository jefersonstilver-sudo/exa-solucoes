// EXA (07/11/2026) — Empresas de elevador dentro de Painéis EXA (Jeferson): cadastro simples (fornecedores, tipo 'elevador'),
// quais painéis/prédios cada empresa atende (devices.empresa_elevador_id) e atalho para o Nando chamar a empresa.
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Phone, Mail, MessageCircle, Pencil, Building2, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Busca, Chip, TOM, Avatar, Carregando, Vazio, BOTAO, BOTAO2, CAMPO, ROTULO, Interruptor, vidro } from '@/components/admin/ui/exa';

interface Empresa { id: string; nome_fantasia: string | null; razao_social: string; cnpj: string; telefone: string | null; email: string | null; endereco: string | null; observacao: string | null; ativo: boolean; tipo: string }
interface Painel { id: string; name: string | null; building_id: string | null; empresa_elevador_id: string | null }

const fone = (t?: string | null) => {
  const d = String(t || '').replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || '';
};
const VAZIA = { nome_fantasia: '', razao_social: '', cnpj: '', telefone: '', email: '', endereco: '', observacao: '', ativo: true };

export const Elevadores: React.FC<{ predios: Map<string, string> }> = ({ predios }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Partial<Empresa> | null>(null);
  const [salvando, setSalvando] = useState(false);

  const empresas = useQuery({
    queryKey: ['elevadores-empresas'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('fornecedores').select('id, nome_fantasia, razao_social, cnpj, telefone, email, endereco, observacao, ativo, tipo').eq('tipo', 'elevador').order('nome_fantasia'); // só empresas de elevador: operadoras de internet são outra coisa (aba Conexões)
      if (error) throw error;
      return (data || []) as Empresa[];
    },
  });
  const paineis = useQuery({
    queryKey: ['elevadores-paineis'],
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

  const q = busca.trim().toLowerCase();
  const lista = (empresas.data || []).filter((e) => !q || [e.nome_fantasia, e.razao_social, e.cnpj, e.telefone, e.email].some((s) => String(s || '').toLowerCase().includes(q)))
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || (porEmpresa.get(b.id)?.length || 0) - (porEmpresa.get(a.id)?.length || 0) || (a.nome_fantasia || a.razao_social).localeCompare(b.nome_fantasia || b.razao_social));

  const salvar = async () => {
    if (!editando) return;
    const nome = (editando.nome_fantasia || '').trim();
    if (!nome) { toast.error('Diga o nome da empresa.'); return; }
    setSalvando(true);
    try {
      const corpo = {
        nome_fantasia: nome, razao_social: (editando.razao_social || '').trim() || nome, cnpj: (editando.cnpj || '').replace(/\D/g, '') || '00000000000000',
        telefone: (editando.telefone || '').trim() || null, email: (editando.email || '').trim() || null, endereco: (editando.endereco || '').trim() || null,
        observacao: (editando.observacao || '').trim() || null, ativo: editando.ativo ?? true, tipo: 'elevador',
      };
      const { error } = editando.id
        ? await (supabase as any).from('fornecedores').update(corpo).eq('id', editando.id)
        : await (supabase as any).from('fornecedores').insert(corpo);
      if (error) throw error;
      toast.success(editando.id ? 'Empresa atualizada.' : 'Empresa cadastrada.');
      setEditando(null);
      qc.invalidateQueries({ queryKey: ['elevadores-empresas'] });
    } catch (e: any) { toast.error('Não salvou: ' + (e?.message || e)); } finally { setSalvando(false); }
  };

  const nando = (e: Empresa) => navigate(buildPath(`crm-evolution/conversas/nando?telefone=${String(e.telefone || '').replace(/\D/g, '')}`));

  return (
    <>
      <Busca valor={busca} onChange={setBusca} placeholder="Empresa, CNPJ, telefone ou e-mail">
        <button type="button" className={BOTAO} onClick={() => setEditando({ ...VAZIA })}><Plus className="h-4 w-4" /> Nova empresa</button>
      </Busca>

      {editando && (
        <section className={`${vidro} rounded-[22px] p-4 md:p-5`} aria-label={editando.id ? 'Editar empresa' : 'Nova empresa'}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={ROTULO}>{editando.id ? 'Editar empresa de elevador' : 'Nova empresa de elevador'}</h2>
            <button type="button" onClick={() => setEditando(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/[0.05]" aria-label="Fechar"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="md:col-span-1"><span className={ROTULO}>Nome</span><input className={`${CAMPO} mt-1`} value={editando.nome_fantasia || ''} onChange={(e) => setEditando({ ...editando, nome_fantasia: e.target.value })} placeholder="Ex.: Atlas Schindler" autoFocus /></label>
            <label><span className={ROTULO}>WhatsApp / telefone</span><input className={`${CAMPO} mt-1`} inputMode="tel" value={editando.telefone || ''} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} placeholder="45 99999-9999" /></label>
            <label><span className={ROTULO}>E-mail</span><input className={`${CAMPO} mt-1`} type="email" value={editando.email || ''} onChange={(e) => setEditando({ ...editando, email: e.target.value })} /></label>
            <label><span className={ROTULO}>Razão social</span><input className={`${CAMPO} mt-1`} value={editando.razao_social || ''} onChange={(e) => setEditando({ ...editando, razao_social: e.target.value })} /></label>
            <label><span className={ROTULO}>CNPJ</span><input className={`${CAMPO} mt-1`} value={editando.cnpj || ''} onChange={(e) => setEditando({ ...editando, cnpj: e.target.value })} placeholder="opcional" /></label>
            <label><span className={ROTULO}>Endereço</span><input className={`${CAMPO} mt-1`} value={editando.endereco || ''} onChange={(e) => setEditando({ ...editando, endereco: e.target.value })} /></label>
            <label className="md:col-span-3"><span className={ROTULO}>Observações (contato, horário, como pedir agendamento)</span><textarea className={`${CAMPO} mt-1 h-auto py-2`} rows={2} value={editando.observacao || ''} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Interruptor on={editando.ativo ?? true} onChange={(v) => setEditando({ ...editando, ativo: v })} rotulo="Empresa ativa" />
            <div className="flex gap-2">
              <button type="button" className={BOTAO2} onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className={BOTAO} onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
            </div>
          </div>
        </section>
      )}

      {empresas.isLoading ? <Carregando /> : !lista.length ? (
        <Vazio icone={<Building2 className="h-5 w-5" />} titulo="Nenhuma empresa de elevador cadastrada" texto="Cadastre as empresas que atendem os prédios; o Nando usa o telefone daqui para agendar a visita com o síndico." acao={<button type="button" className={BOTAO} onClick={() => setEditando({ ...VAZIA })}><Plus className="h-4 w-4" /> Nova empresa</button>} />
      ) : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {lista.map((e) => {
              const ps = porEmpresa.get(e.id) || [];
              const nomesPredios = [...new Set(ps.map((p) => (p.building_id && predios.get(p.building_id)) || p.name || '').filter(Boolean))];
              return (
                <li key={e.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4 ${!e.ativo ? 'opacity-60' : ''}`}>
                  <Avatar nome={e.nome_fantasia || e.razao_social} tamanho={40} cor={e.ativo ? '#9A5300' : '#8A8B90'} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-[14px] font-bold">{e.nome_fantasia || e.razao_social}</span>
                      {!e.ativo && <Chip {...TOM.cinza}>inativa</Chip>}
                      {ps.length > 0 && <Chip {...TOM.azul}>{ps.length} painel{ps.length === 1 ? '' : 'is'}</Chip>}
                      {!e.telefone && <Chip {...TOM.vermelho}>sem telefone</Chip>}
                    </span>
                    <span className="block truncate text-[12.5px] text-[#6A6B70]">
                      {[e.telefone ? fone(e.telefone) : '', e.email, nomesPredios.slice(0, 4).join(', ') + (nomesPredios.length > 4 ? ` +${nomesPredios.length - 4}` : '')].filter(Boolean).join(' · ') || 'sem contato cadastrado'}
                    </span>
                    {e.observacao && <span className="block truncate text-[12px] text-[#8A8B90]">{e.observacao}</span>}
                  </span>
                  <div className="flex shrink-0 items-center">
                    {e.telefone && <a href={`tel:${String(e.telefone).replace(/\D/g, '')}`} title="Ligar" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Phone className="h-4 w-4" /></a>}
                    {e.email && <a href={`mailto:${e.email}`} title="E-mail" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Mail className="h-4 w-4" /></a>}
                    <button type="button" onClick={() => nando(e)} disabled={!e.telefone} title="Abrir no WhatsApp do Nando" className="grid h-9 w-9 place-items-center rounded-xl text-[#9C1E1E] hover:bg-[#FDECEC] disabled:opacity-30"><MessageCircle className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditando({ ...e })} title="Editar" className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]"><Pencil className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default Elevadores;
