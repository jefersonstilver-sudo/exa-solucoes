import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Send, UserCheck, Bot, RefreshCw, X, Info, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CRM360Panel from '@/components/admin/crm/CRM360Panel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConversationDay } from './ConversationVisuals';
import { useAuth } from '@/hooks/useAuth';
import { canDeleteSofiaContact } from '@/lib/deleteContactRules';
import DeleteContactDialog, { type DeleteContactTarget } from './DeleteContactDialog';

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
  { v: 'sindico', l: 'Sindico' },
  { v: 'lead', l: 'Lead' },
  { v: 'bloqueado', l: 'Bloqueado' },
];
const roleLabel = (r: string | null) => ROLES.find((x) => x.v === r)?.l || r || '';
const Avatar: React.FC<{ url: string | null; name: string; size?: number }> = ({ url, name, size = 40 }) => {
  const [bad, setBad] = useState(false);
  const ini = (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="crm-avatar"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {url && !bad ? (
        <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setBad(true)} />
      ) : (
        ini
      )}
    </div>
  );
};
type Msg = {
  id: string;
  direction: 'in' | 'out_bot' | 'out_human';
  body: string;
  created_at: string;
};

async function call(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('sofia-panel', {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

const hhmm = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

export const SofiaChatPanel: React.FC = () => {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [fichaConversationId, setFichaConversationId] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactConversationId, setContactConversationId] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', company: '', role: 'lead', manual: '' });
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = selId;
  const { userProfile } = useAuth();
  const canDelete = canDeleteSofiaContact(userProfile?.role);
  const [deleteTarget, setDeleteTarget] = useState<(DeleteContactTarget & { conversationId: string }) | null>(null);
  // ?telefone= (botao "Conversar" da lista de pedidos): abre direto a conversa daquele cliente
  const [searchParams] = useSearchParams();
  const telefoneAlvo = (searchParams.get('telefone') || '').replace(/\D/g, '');
  const nomeAlvo = (searchParams.get('nome') || '').trim();
  const [extraConv, setExtraConv] = useState<Conv | null>(null);
  const [semConversa, setSemConversa] = useState<string | null>(null);
  const [soSindicos, setSoSindicos] = useState(false);
  const [busca, setBusca] = useState('');
  const [mobileChat, setMobileChat] = useState(false);
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
      if (!ct?.id) throw new Error('Contato nao encontrado');
      setDeleteTarget((cur) => cur && cur.conversationId === c.id
        ? { conversationId: c.id, contactId: ct.id, name: ct.name || c.name, phone: ct.phone ?? c.phone }
        : cur);
    } catch (e: any) {
      toast.error(e?.message || 'Nao foi possivel carregar o contato');
      setDeleteTarget(null);
    }
  };

  const handleDeleted = () => {
    const id = deleteTarget?.conversationId;
    setDeleteTarget(null);
    if (!id) return;
    setConvs((prev) => prev.filter((x) => x.id !== id));
    if (fichaConversationId === id) setFichaConversationId(null);
    if (selId === id) { setSelId(null); setShowInfo(false); setContact(null); }
    loadConvs();
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
          // cliente que nunca falou com a Sofia: cria contato e conversa, prontos para voce escrever
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

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

  // conversa antiga achada pelo telefone entra no topo da lista (a lista so traz as 60 mais recentes)
  const listaTodas = extraConv && !convs.some((c) => c.id === extraConv.id) ? [extraConv, ...convs] : convs;
  const totalSindicos = listaTodas.filter((c) => c.role === 'sindico').length;
  const lista = listaTodas.filter(c => (!soSindicos || c.role === 'sindico') && [c.name, c.phone, c.preview].some(value => (value || '').toLowerCase().includes(busca.toLowerCase())));
  const sel = listaTodas.find((c) => c.id === selId) || null;

  const setMode = async (mode: 'auto' | 'humano') => {
    if (!selId) return;
    try {
      await call('set_mode', { conversation_id: selId, mode });
      toast.success(mode === 'humano' ? 'Voce assumiu o atendimento' : 'Sofia voltou a atender');
      loadConvs();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !selId || sending) return;
    setSending(true);
    try {
      await call('send', { conversation_id: selId, text: t });
      setText('');
      await loadMsgs(selId, true);
      loadConvs();
    } catch (e: any) {
      toast.error('Falha ao enviar: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[520px] rounded-2xl border border-gray-200 bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <><DeleteContactDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    <Sheet open={Boolean(fichaConversationId)} onOpenChange={open => { if (!open) setFichaConversationId(null); }}><SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto h-dvh"><SheetHeader className="mb-6 flex-row items-center justify-between gap-3 space-y-0 pr-8"><SheetTitle>Ficha 360</SheetTitle>{canDelete && fichaConversationId && (() => { const fc = lista.find(x => x.id === fichaConversationId); return fc ? <Button variant="ghost" size="sm" onClick={() => openDelete(fc)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4 mr-1.5" />Apagar contato</Button> : null; })()}</SheetHeader>{contactError ? <p role="alert">{contactError}</p> : contact?.id && fichaConversationId === contactConversationId ? <CRM360Panel lookup={{ contact: contact.id }} /> : <div className="flex items-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" />Carregando contato...</div>}</SheetContent></Sheet>
    <div className={`crm-grid ${showInfo ? "crm-with-info" : ""}`} data-mobile-chat={mobileChat}>
      <div className="crm-list">
        <div className="crm-list-heading flex items-center justify-between">
          <span className="crm-list-title">Sofia</span>
          <Button variant="ghost" size="icon" title="Atualizar conversas" onClick={loadConvs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-4 pb-3 relative"><Search className="absolute left-7 top-3 h-4 w-4 text-muted-foreground" /><input className="crm-search" placeholder="Buscar contato ou telefone" aria-label="Buscar conversa" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        {totalSindicos > 0 && (
          <div className="crm-filters">
            <Button variant="ghost" onClick={() => setSoSindicos(false)} aria-pressed={!soSindicos} className="crm-filter">Todas</Button>
            <Button variant="ghost" onClick={() => setSoSindicos(true)} aria-pressed={soSindicos} className="crm-filter">Síndicos {totalSindicos}</Button>
          </div>
        )}
        {semConversa && (
          <div className="m-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Não consegui abrir a conversa ({semConversa}).
            <button type="button" className="ml-1 underline" onClick={() => setSemConversa(null)}>Fechar</button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">{lista.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhuma conversa ainda.</p>}
        {lista.map((c) => (
          <div key={c.id} className="relative group">
          <Button variant="ghost"
            onClick={() => { setSelId(c.id); setMobileChat(true); }} aria-current={c.id === selId}
            className={`crm-row ${canDelete ? "pr-10" : ""}`}
          >
            <div className="flex items-start gap-3">
            <Avatar url={c.avatar_url} name={c.name} size={40} />
            <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="crm-row-name truncate">{c.name}</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{hhmm(c.last_message_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {c.mode === 'humano' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Humano</span>
              )}
              {c.role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{roleLabel(c.role)}</span>}
              <span className="text-xs text-gray-500 truncate">{c.preview}</span>
            </div>
            </div>
            </div>
          </Button>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute right-1 bottom-2 h-7 w-7" aria-label="Mais ações">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => openDelete(c)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Apagar contato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
        ))}</div>
      </div>

      <div className="crm-chat">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Selecione uma conversa</div>
        ) : (
          <>
            <div className="crm-chat-header">
              <div className="flex items-center gap-2 min-w-0"><Button variant="ghost" size="icon" className="crm-mobile-back" aria-label="Voltar às conversas" onClick={() => setMobileChat(false)}><ArrowLeft className="h-4 w-4" /></Button><Button variant="ghost" className="flex items-center gap-3 min-w-0 text-left h-auto p-0 justify-start" onClick={() => setFichaConversationId(sel.id)}>
              <Avatar url={contact?.avatar_url ?? sel.avatar_url} name={sel.name} size={40} />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{sel.name} {sel.role && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 align-middle">{roleLabel(sel.role)}</span>}</div>
                <div className="text-xs text-gray-500">
                  {sel.mode === 'humano'
                    ? `Atendimento humano ate ${hhmm(sel.human_until)} (Sofia pausada)`
                    : 'Sofia atendendo'}
                </div>
              </div>
              </Button></div>
              <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setFichaConversationId(sel.id)}>Ficha 360</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInfo((v) => !v)} title="Detalhes do contato">
                <Info className="w-4 h-4" />
              </Button>
              {sel.mode === 'auto' ? (
                <Button size="sm" onClick={() => setMode('humano')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <UserCheck className="w-4 h-4 mr-1.5" /> Assumir atendimento
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setMode('auto')}>
                  <Bot className="w-4 h-4 mr-1.5" /> Devolver para a Sofia
                </Button>
              )}
              </div>
            </div>

            {sel.role === 'sindico' && (
              <div className="px-4 py-2 border-b bg-amber-50 text-xs text-amber-900">
                <b>Síndico:</b> assuntos do prédio (avisos, telas, problemas) são do <b>Nando</b> (WhatsApp 45 9113-2351). A Sofia só deve encaminhar.
              </div>
            )}
            <div className="crm-messages space-y-2">
              {msgs.map((m, index) => {
                const mine = m.direction !== 'in';
                return (
                  <React.Fragment key={m.id}><ConversationDay date={m.created_at} previous={msgs[index - 1]?.created_at} /><div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`crm-bubble ${mine ? (m.direction === "out_bot" ? "crm-bubble-bot" : "crm-bubble-human") : ""}`}
                    >
                      {mine && (
                        <div className="crm-author">
                          {m.direction === 'out_bot' ? 'Sofia' : 'Voce'}
                        </div>
                      )}
                      {m.body}
                      <div className="crm-time">{hhmm(m.created_at)}</div>
                    </div>
                  </div></React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="crm-composer">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Escreva uma mensagem…" aria-label="Mensagem"
                className="flex-1"
              />
              <Button onClick={send} aria-label="Enviar mensagem" title="Enviar mensagem" disabled={sending || !text.trim()} className="crm-send">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        )}
      </div>

      {showInfo && sel && (
        <div className="crm-contact-info border-l border-border overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Detalhes do contato</span>
            <Button variant="ghost" size="sm" onClick={() => setShowInfo(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {!contact ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <Avatar url={contact.avatar_url} name={contact.name || sel.name} size={96} />
                <div className="text-xs text-gray-500">
                  {contact.phone ? `+${contact.phone}` : 'Telefone nao identificado'}
                </div>
                {contact.lid && <div className="text-[10px] text-gray-400">LID {contact.lid}</div>}
              </div>
              <label className="block text-xs font-medium text-gray-600">
                Quem e este contato
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.v} value={r.v}>
                      {r.l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Nome
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Empresa / predio
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Observacoes
                <textarea
                  value={form.manual}
                  onChange={(e) => setForm({ ...form, manual: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm resize-none"
                />
              </label>
              <Button onClick={saveContact} disabled={saving} className="w-full bg-red-700 hover:bg-red-800 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={() => openDelete(sel)} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Apagar contato
                </Button>
              )}
              {Object.keys(contact.extra || {}).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Dados coletados pela Sofia</div>
                  <pre className="text-[11px] bg-gray-50 border rounded-lg p-2 whitespace-pre-wrap break-words">
                    {JSON.stringify(contact.extra, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div></>
  );
};

export default SofiaChatPanel;
