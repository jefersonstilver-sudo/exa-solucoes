import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CRM360Panel from '@/components/admin/crm/CRM360Panel';
import { useAuth } from '@/hooks/useAuth';
import { canDeleteSofiaContact } from '@/lib/deleteContactRules';
import DeleteContactDialog, { type DeleteContactTarget } from './DeleteContactDialog';
import { ChatEXA, CxGaveta, CxNotas, cxQuando, type CxConversa, type CxMsg } from './chat/ChatEXA';

/**
 * CRM da Sofia (clientes). Conversas, modo, envio de texto e contato pela sofia-panel (código só do painel);
 * arquivos, áudio, mensagens programadas e notas pela exa2-crm-chat (dentro do ChatEXA).
 */
type Conv = {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  mode: 'auto' | 'humano';
  human_until: string | null;
  last_message_at: string | null;
  preview: string;
};
type Contact = {
  id: string;
  name: string | null;
  phone: string | null;
  lid: string | null;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  manual: string;
  extra: Record<string, unknown>;
  jid: string;
};
const ROLES: { v: string; l: string }[] = [
  { v: 'ceo', l: 'CEO' },
  { v: 'equipe', l: 'Equipe' },
  { v: 'cliente', l: 'Cliente' },
  { v: 'sindico', l: 'Síndico' },
  { v: 'lead', l: 'Lead' },
  { v: 'bloqueado', l: 'Bloqueado' },
];
const roleLabel = (r: string | null) => ROLES.find((x) => x.v === r)?.l || r || '';
type Msg = { id: string; direction: 'in' | 'out_bot' | 'out_human'; body: string; created_at: string };

async function call(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('sofia-panel', { body: { action, ...body } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

const fone = (t: string | null) => {
  const d = (t || '').replace(/\D/g, '');
  if (!d) return 'Telefone não identificado';
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d}`;
};

const FILTROS = [
  { v: 'todas', l: 'Todas' },
  { v: 'comigo', l: 'Comigo' },
  { v: 'cliente', l: 'Clientes' },
  { v: 'lead', l: 'Leads' },
  { v: 'sindico', l: 'Síndicos' },
] as const;

export const SofiaChatPanel: React.FC<{ onVoltar?: () => void; fotoAgente?: string | null; telefoneAgente?: string | null }> = ({ onVoltar, fotoAgente, telefoneAgente }) => {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [fichaAberta, setFichaAberta] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactConversationId, setContactConversationId] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', company: '', role: 'lead', manual: '' });
  const [saving, setSaving] = useState(false);
  const selRef = useRef<string | null>(null);
  selRef.current = selId;
  const { userProfile } = useAuth();
  const canDelete = canDeleteSofiaContact(userProfile?.role);
  const [deleteTarget, setDeleteTarget] = useState<(DeleteContactTarget & { conversationId: string }) | null>(null);
  // ?telefone= (botão "Conversar" da lista de pedidos): abre direto a conversa daquele cliente
  const [searchParams] = useSearchParams();
  const telefoneAlvo = (searchParams.get('telefone') || '').replace(/\D/g, '');
  const nomeAlvo = (searchParams.get('nome') || '').trim();
  const [extraConv, setExtraConv] = useState<Conv | null>(null);
  const [semConversa, setSemConversa] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['v']>('todas');
  const [busca, setBusca] = useState('');
  const alvoResolvido = useRef(false);

  const openDelete = async (c: Conv) => {
    if (contact?.id && contactConversationId === c.id) {
      setDeleteTarget({ conversationId: c.id, contactId: contact.id, name: contact.name || c.name, phone: contact.phone ?? c.phone });
      return;
    }
    setDeleteTarget({ conversationId: c.id, contactId: null, name: c.name, phone: c.phone, loading: true });
    try {
      const d = await call('contact', { conversation_id: c.id });
      const ct: Contact | undefined = d?.contact;
      if (!ct?.id) throw new Error('Contato não encontrado');
      setDeleteTarget((cur) => cur && cur.conversationId === c.id
        ? { conversationId: c.id, contactId: ct.id, name: ct.name || c.name, phone: ct.phone ?? c.phone }
        : cur);
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível carregar o contato');
      setDeleteTarget(null);
    }
  };

  const loadConvs = useCallback(async () => {
    try {
      const d = await call('list');
      setConvs(d.conversations || []);
      if (telefoneAlvo && !alvoResolvido.current) {
        alvoResolvido.current = true;
        const l8 = telefoneAlvo.slice(-8);
        let alvo: Conv | null = (d.conversations || []).find((c: Conv) => (c.phone || '').replace(/\D/g, '').slice(-8) === l8) || null;
        if (!alvo) {
          try { alvo = (await call('find_phone', { phone: telefoneAlvo }))?.conversation || null; } catch { alvo = null; }
          if (alvo) setExtraConv(alvo);
        }
        if (!alvo) {
          // cliente que nunca falou com a Sofia: cria contato e conversa, prontos para você escrever
          try {
            const r = await call('start', { phone: telefoneAlvo, nome: nomeAlvo });
            alvo = r?.conversation || null;
            if (alvo) {
              setExtraConv(alvo);
              toast.success(r?.criada ? 'Conversa nova aberta. A Sofia não enviou nada: escreva sua mensagem.' : 'Conversa encontrada.');
            }
          } catch (e: any) {
            setSemConversa(`${telefoneAlvo}: ${e?.message || 'não foi possível abrir a conversa'}`);
          }
        }
        if (alvo) { setSelId(alvo.id); setSemConversa(null); return; }
      }
      setSelId((cur) => cur ?? d.conversations?.[0]?.id ?? null);
    } catch (e: any) {
      console.error('sofia list', e);
    } finally {
      setLoading(false);
    }
  }, [telefoneAlvo, nomeAlvo]);

  const handleDeleted = () => {
    const id = deleteTarget?.conversationId;
    setDeleteTarget(null);
    if (!id) return;
    setConvs((prev) => prev.filter((x) => x.id !== id));
    if (selId === id) { setSelId(null); setFichaAberta(false); setContact(null); }
    loadConvs();
  };

  const loadMsgs = useCallback(async (id: string, replace: boolean) => {
    try {
      const d = await call('messages', { conversation_id: id });
      if (selRef.current !== id) return;
      setMsgs((prev) => {
        const next: Msg[] = d.messages || [];
        if (!replace && prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) return prev;
        return next;
      });
    } catch (e) {
      console.error('sofia msgs', e);
    }
  }, []);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 5000);
    return () => clearInterval(t);
  }, [loadConvs]);

  useEffect(() => {
    if (!selId) return;
    setMsgs([]);
    loadMsgs(selId, true);
    const t = setInterval(() => loadMsgs(selId, false), 3000);
    return () => clearInterval(t);
  }, [selId, loadMsgs]);

  useEffect(() => {
    if (!selId) return;
    setContact(null);
    setContactError(null);
    setContactConversationId(null);
    call('contact', { conversation_id: selId })
      .then((d) => {
        if (selRef.current !== selId) return;
        const c: Contact = d.contact;
        if (!c?.id) { setContactError('Contato não encontrado.'); return; }
        setContact(c);
        setContactConversationId(selId);
        setForm({ name: c.name || '', company: c.company || '', role: c.role || 'lead', manual: c.manual || '' });
      })
      .catch(() => { if (selRef.current === selId) setContactError('Não foi possível carregar o contato. Feche a ficha e tente novamente.'); });
  }, [selId]);

  const saveContact = async () => {
    if (!selId) return;
    setSaving(true);
    try {
      await call('update_contact', { conversation_id: selId, ...form });
      toast.success('Contato atualizado');
      loadConvs();
      const d = await call('contact', { conversation_id: selId });
      setContact(d.contact);
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // conversa antiga achada pelo telefone entra no topo da lista (a lista só traz as mais recentes)
  const listaTodas = extraConv && !convs.some((c) => c.id === extraConv.id) ? [extraConv, ...convs] : convs;
  const q = busca.trim().toLowerCase();
  const lista = listaTodas.filter((c) => {
    if (filtro === 'comigo' && c.mode !== 'humano') return false;
    if ((filtro === 'cliente' || filtro === 'lead' || filtro === 'sindico') && c.role !== filtro) return false;
    return !q || [c.name, c.phone, c.preview].some((v) => (v || '').toLowerCase().includes(q));
  });
  const sel = listaTodas.find((c) => c.id === selId) || null;
  const contagem = (v: string) => v === 'todas' ? 0 : v === 'comigo' ? listaTodas.filter((c) => c.mode === 'humano').length : listaTodas.filter((c) => c.role === v).length;

  const paraCx = (c: Conv): CxConversa => ({
    id: c.id,
    titulo: c.name,
    sub: [roleLabel(c.role), fone(c.phone)].filter(Boolean).join(' · '),
    subMarca: c.role === 'cliente',
    hora: cxQuando(c.last_message_at),
    preview: c.preview,
    naoLidas: 0,
    humano: c.mode === 'humano',
    foto: c.avatar_url,
  });
  const cxConversas = lista.map(paraCx);
  if (sel && !cxConversas.some((c) => c.id === sel.id)) cxConversas.push(paraCx(sel));
  // a foto do contato carregado é mais nova que a da lista
  const ix = cxConversas.findIndex((c) => c.id === selId);
  if (ix >= 0 && contact?.avatar_url && contactConversationId === selId) cxConversas[ix] = { ...cxConversas[ix], foto: contact.avatar_url };

  const cxMsgs: CxMsg[] = msgs.map((m) => ({
    id: m.id,
    tipo: m.direction === 'in' ? 'in' : m.direction === 'out_bot' ? 'bot' : 'humano',
    texto: m.body || '',
    autor: null,
    criada: m.created_at,
  }));

  const setMode = async (mode: 'auto' | 'humano') => {
    if (!selId) return;
    try {
      await call('set_mode', { conversation_id: selId, mode });
      toast.success(mode === 'humano' ? 'Você assumiu o atendimento' : 'A Sofia voltou a atender');
      loadConvs();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const enviarTexto = async (t: string) => {
    if (!selId) return;
    await call('send', { conversation_id: selId, text: t });
  };

  const atualizar = () => { loadConvs(); if (selId) loadMsgs(selId, true); };

  const gaveta = fichaAberta && sel ? (
    <CxGaveta
      largo
      titulo="Ficha do cliente"
      nome={contact?.name || sel.name}
      sub={`${fone(contact?.phone ?? sel.phone)}${sel.role ? ` · ${roleLabel(sel.role)}` : ''}`}
      foto={contact?.avatar_url ?? sel.avatar_url}
      onFechar={() => setFichaAberta(false)}
      abas={[
        {
          v: 'ficha', l: 'Ficha 360',
          conteudo: contactError ? <p role="alert">{contactError}</p>
            : contact?.id && contactConversationId === sel.id ? <CRM360Panel lookup={{ contact: contact.id }} />
            : <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '30px 0', color: '#77756F' }}><Loader2 className="h-4 w-4 animate-spin" />Carregando contato…</div>,
        },
        {
          v: 'contato', l: 'Contato',
          conteudo: !contact ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '30px 0', color: '#77756F' }}><Loader2 className="h-4 w-4 animate-spin" />Carregando contato…</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {contact.lid && <div style={{ fontSize: 12, color: '#8A8882' }}>LID {contact.lid}</div>}
              <label><div className="cx-k">Quem é este contato</div>
                <select className="cx-campo" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </label>
              <label><div className="cx-k">Nome</div><input className="cx-campo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label><div className="cx-k">Empresa / prédio</div><input className="cx-campo" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
              <label><div className="cx-k">Observações</div><textarea className="cx-campo" rows={3} style={{ resize: 'vertical' }} value={form.manual} onChange={(e) => setForm({ ...form, manual: e.target.value })} /></label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="cx-btn cx-red" onClick={saveContact} disabled={saving}>{saving ? 'Salvando…' : 'Salvar contato'}</button>
                {canDelete && <button className="cx-btn cx-fb" style={{ color: '#9E1014' }} onClick={() => openDelete(sel)}>Apagar contato</button>}
              </div>
              {Object.keys(contact.extra || {}).length > 0 && (
                <div>
                  <div className="cx-k">Dados coletados pela Sofia</div>
                  <pre style={{ fontSize: 11, background: '#F3F2EF', borderRadius: 12, padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(contact.extra, null, 2)}</pre>
                </div>
              )}
            </div>
          ),
        },
        { v: 'notas', l: 'Notas', conteudo: <CxNotas agente="sofia" alvo={sel.id} /> },
      ]}
    />
  ) : null;

  const aviso = semConversa
    ? <>Não consegui abrir a conversa ({semConversa}). <button style={{ textDecoration: 'underline', fontWeight: 800 }} onClick={() => setSemConversa(null)}>Fechar</button></>
    : sel?.role === 'sindico'
      ? <><b>Síndico:</b> assuntos do prédio (avisos, telas, problemas) são do <b>Nando</b> (WhatsApp 45 9113-2351). A Sofia só deve encaminhar.</>
      : sel?.mode === 'humano' && sel.human_until
        ? <>Atendimento humano até {new Date(sel.human_until).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. A Sofia volta sozinha depois disso.</>
        : undefined;

  return (
    <>
      <DeleteContactDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <ChatEXA
        agente="sofia"
        nomeAgente="Sofia"
        subAgente={`Clientes${telefoneAgente ? ` · ${telefoneAgente}` : ''}`}
        fotoAgente={fotoAgente}
        abas={FILTROS.map((f) => ({ v: f.v, l: f.l, n: contagem(f.v) }))}
        aba={filtro}
        onAba={(v) => setFiltro(v as any)}
        busca={busca}
        onBusca={setBusca}
        placeholderBusca="Buscar contato ou telefone"
        conversas={cxConversas}
        sel={selId}
        onSel={setSelId}
        msgs={cxMsgs}
        carregando={loading}
        fichaRotulo="Ficha do cliente"
        onFicha={() => setFichaAberta(true)}
        onAssumir={() => setMode('humano')}
        onDevolver={() => setMode('auto')}
        onEnviarTexto={enviarTexto}
        onAtualizar={atualizar}
        acaoLinha={canDelete ? (c) => (
          <button className="cx-ib" style={{ width: 32, height: 32, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} aria-label="Apagar contato" title="Apagar contato"
            onClick={() => { const x = listaTodas.find((k) => k.id === c.id); if (x) openDelete(x); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E1014" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
          </button>
        ) : undefined}
        aviso={aviso}
        onVoltar={onVoltar}
        gaveta={gaveta}
      />
    </>
  );
};

export default SofiaChatPanel;
