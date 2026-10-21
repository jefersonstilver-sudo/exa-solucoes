import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, UserCheck, Bot, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Conv = {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  mode: 'auto' | 'humano';
  human_until: string | null;
  last_message_at: string | null;
  preview: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = selId;

  const loadConvs = useCallback(async () => {
    try {
      const d = await call('list');
      setConvs(d.conversations || []);
      setSelId((cur) => cur ?? d.conversations?.[0]?.id ?? null);
    } catch (e: any) {
      console.error('sofia list', e);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const sel = convs.find((c) => c.id === selId) || null;

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
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-140px)] min-h-[520px] rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-r border-gray-200 overflow-y-auto">
        <div className="px-4 py-3 flex items-center justify-between border-b bg-gray-50">
          <span className="text-sm font-semibold text-gray-800">Conversas da Sofia</span>
          <Button variant="ghost" size="sm" onClick={loadConvs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {convs.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhuma conversa ainda.</p>}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelId(c.id)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${c.id === selId ? 'bg-red-50' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm text-gray-900 truncate">{c.name}</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{hhmm(c.last_message_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {c.mode === 'humano' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Humano</span>
              )}
              {c.role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{c.role}</span>}
              <span className="text-xs text-gray-500 truncate">{c.preview}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col min-h-0">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Selecione uma conversa</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{sel.name}</div>
                <div className="text-xs text-gray-500">
                  {sel.mode === 'humano'
                    ? `Atendimento humano ate ${hhmm(sel.human_until)} (Sofia pausada)`
                    : 'Sofia atendendo'}
                </div>
              </div>
              {sel.mode === 'auto' ? (
                <Button size="sm" onClick={() => setMode('humano')} className="bg-red-700 hover:bg-red-800 text-white">
                  <UserCheck className="w-4 h-4 mr-1.5" /> Assumir atendimento
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setMode('auto')}>
                  <Bot className="w-4 h-4 mr-1.5" /> Devolver para a Sofia
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#faf8f5]">
              {msgs.map((m) => {
                const mine = m.direction !== 'in';
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${
                        mine ? (m.direction === 'out_bot' ? 'bg-red-50 text-gray-900' : 'bg-emerald-100 text-gray-900') : 'bg-white text-gray-900'
                      }`}
                    >
                      {mine && (
                        <div className="text-[10px] font-semibold text-gray-500 mb-0.5">
                          {m.direction === 'out_bot' ? 'Sofia' : 'Voce'}
                        </div>
                      )}
                      {m.body}
                      <div className="text-[10px] text-gray-400 text-right mt-0.5">{hhmm(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Digite uma mensagem (ao enviar, a Sofia fica pausada)"
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <Button onClick={send} disabled={sending || !text.trim()} className="bg-red-700 hover:bg-red-800 text-white">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SofiaChatPanel;
