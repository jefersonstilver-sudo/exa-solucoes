import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Send,
  Loader2,
  RefreshCw,
  Users as UsersIcon,
  CheckCheck,
  Check,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CollaboratorRow } from './CollaboratorCard';
import {
  callEvolution,
  formatChatTime,
  jidToNumber,
  normalizeChat,
  normalizeMessage,
  type EvoChat,
  type EvoMessage,
} from '../lib/evolutionClient';

interface Props {
  collaborator: CollaboratorRow;
}

const POLL_MESSAGES_MS = 60_000; // memory: polling minimum 60s

export const ChatPanel: React.FC<Props> = ({ collaborator }) => {
  const instance = collaborator.instance_name ?? '';
  const [chats, setChats] = useState<EvoChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [active, setActive] = useState<EvoChat | null>(null);
  const [search, setSearch] = useState('');

  const [messages, setMessages] = useState<EvoMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const initials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  // -------- Load chats list --------
  const loadChats = useCallback(
    async (silent = false) => {
      if (!instance) return;
      if (!silent) setChatsLoading(true);
      setChatsError(null);
      try {
        const res = await callEvolution(
          `/chat/findChats/${encodeURIComponent(instance)}`,
          'POST',
          {},
        );
        const list: any[] = Array.isArray(res.data) ? res.data : [];
        const normalized = list
          .map(normalizeChat)
          .filter((c): c is EvoChat => Boolean(c))
          .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setChats(normalized);
        if (!active && normalized.length > 0) setActive(normalized[0]);
      } catch (e: any) {
        const msg = e?.message ?? 'Falha ao carregar conversas';
        setChatsError(msg);
        if (!silent) toast.error(msg);
      } finally {
        setChatsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance],
  );

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // -------- Load messages of active chat + polling --------
  const loadMessages = useCallback(
    async (chat: EvoChat, silent = false) => {
      if (!instance || !chat) return;
      if (!silent) setMsgsLoading(true);
      try {
        const res = await callEvolution(
          `/chat/findMessages/${encodeURIComponent(instance)}`,
          'POST',
          {
            where: { key: { remoteJid: chat.remoteJid } },
            // common pagination knobs across Evolution forks
            limit: 50,
            page: 1,
          },
        );
        // Evolution may return { messages: { records: [...] } } or array
        const records: any[] =
          res.data?.messages?.records ??
          res.data?.records ??
          (Array.isArray(res.data) ? res.data : []);
        const normalized = records
          .map(normalizeMessage)
          .filter((m): m is EvoMessage => Boolean(m))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(normalized);
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: silent ? 'auto' : 'smooth',
          });
        }, 50);
      } catch (e: any) {
        if (!silent) toast.error(e?.message ?? 'Falha ao carregar mensagens');
      } finally {
        setMsgsLoading(false);
      }
    },
    [instance],
  );

  useEffect(() => {
    if (!active) return;
    setMessages([]);
    loadMessages(active);
    const t = setInterval(() => loadMessages(active, true), POLL_MESSAGES_MS);
    return () => clearInterval(t);
  }, [active, loadMessages]);

  // -------- Send text --------
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !active || !instance) return;
    setSending(true);
    const optimistic: EvoMessage = {
      id: `tmp-${Date.now()}`,
      fromMe: true,
      text,
      timestamp: Date.now(),
      status: 'PENDING',
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 30);
    try {
      await callEvolution(
        `/message/sendText/${encodeURIComponent(instance)}`,
        'POST',
        {
          number: jidToNumber(active.remoteJid),
          text,
        },
      );
      // Refresh shortly after to sync server-side IDs/status
      setTimeout(() => loadMessages(active, true), 1500);
      setTimeout(() => loadChats(true), 1800);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao enviar');
      // remove optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessageText.toLowerCase().includes(q) ||
        c.remoteJid.toLowerCase().includes(q),
    );
  }, [chats, search]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Owner bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#7D1818] to-[#9C1E1E] text-white">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold overflow-hidden">
          {collaborator.profile_picture_url ? (
            <img
              src={collaborator.profile_picture_url}
              alt={collaborator.collaborator_name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials(collaborator.collaborator_name)
          )}
        </div>
        <div className="text-sm">
          Conversas de <strong>{collaborator.collaborator_name}</strong>
        </div>
        <button
          onClick={() => {
            loadChats();
            if (active) loadMessages(active);
          }}
          className="ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 hover:opacity-100 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 transition"
        >
          <RefreshCw className={cn('w-3 h-3', chatsLoading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[560px]">
        {/* Conversations list */}
        <aside className="border-r border-gray-200 flex flex-col bg-gray-50/50 min-h-0">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-[#9C1E1E]/30 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatsLoading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : chatsError ? (
              <div className="p-4 text-center">
                <p className="text-xs text-red-600">{chatsError}</p>
                <button
                  onClick={() => loadChats()}
                  className="mt-2 text-xs text-[#9C1E1E] hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Inbox className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">
                  {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
                </p>
              </div>
            ) : (
              filteredChats.map((c) => (
                <button
                  key={c.remoteJid}
                  onClick={() => setActive(c)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white transition-colors border-b border-gray-100',
                    active?.remoteJid === c.remoteJid && 'bg-white',
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden">
                      {c.profilePicUrl ? (
                        <img
                          src={c.profilePicUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).style.display =
                              'none')
                          }
                        />
                      ) : c.isGroup ? (
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        initials(c.name)
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {c.name}
                    </p>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {formatChatTime(c.lastMessageTime)}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#9C1E1E] text-white text-[10px] font-semibold flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex flex-col bg-[#f4ede4]/40 min-h-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Selecione uma conversa
            </div>
          ) : (
            <>
              {/* Chat header */}
              <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden">
                  {active.profilePicUrl ? (
                    <img
                      src={active.profilePicUrl}
                      alt={active.name}
                      className="w-full h-full object-cover"
                    />
                  ) : active.isGroup ? (
                    <UsersIcon className="w-4 h-4 text-gray-500" />
                  ) : (
                    initials(active.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {active.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {active.isGroup ? 'Grupo' : jidToNumber(active.remoteJid)}
                  </p>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              >
                {msgsLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    Sem mensagens nesta conversa.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'flex',
                        m.fromMe ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm text-sm',
                          m.fromMe
                            ? 'bg-[#9C1E1E] text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm',
                        )}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">
                          {m.text || <span className="italic opacity-60">[mídia]</span>}
                        </p>
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1 mt-0.5',
                            m.fromMe ? 'text-white/70' : 'text-gray-400',
                          )}
                        >
                          <span className="text-[10px]">
                            {formatChatTime(m.timestamp)}
                          </span>
                          {m.fromMe &&
                            (m.status === 'READ' ? (
                              <CheckCheck className="w-3 h-3 text-sky-300" />
                            ) : m.status === 'DELIVERY_ACK' ||
                              m.status === 'SERVER_ACK' ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Read-only notice (LGPD: visualização apenas) */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-[11px] text-gray-500">
                  Visualização apenas — envio de mensagens desabilitado
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
