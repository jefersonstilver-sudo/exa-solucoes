import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Loader2,
  RefreshCw,
  Users as UsersIcon,
  CheckCheck,
  Check,
  Inbox,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CollaboratorRow } from './CollaboratorCard';
import {
  callEvolution,
  fetchContacts,
  formatChatTime,
  jidToNumber,
  normalizeChat,
  normalizeMessage,
  type EvoChat,
  type EvoMessage,
} from '../lib/evolutionClient';
import { MessageMedia } from './MessageMedia';

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
  const [messageLayoutVersion, setMessageLayoutVersion] = useState(0);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 120;
  }, []);

  const refreshMessagesLayout = useCallback((behavior: ScrollBehavior = 'auto') => {
    const repaintAndScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      void el.offsetHeight;
      scrollMessagesToBottom(behavior);
      handleMessagesScroll();
    };

    requestAnimationFrame(repaintAndScroll);
    window.setTimeout(repaintAndScroll, 80);
    window.setTimeout(repaintAndScroll, 240);
  }, [handleMessagesScroll, scrollMessagesToBottom]);

  const initials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  // -------- Load chats list --------
  const loadChats = useCallback(
    async (silent = false) => {
      if (!instance) return;
      if (!silent) setChatsLoading(true);
      setChatsError(null);
      try {
        const [chatsRes, contactsMap] = await Promise.all([
          callEvolution(
            `/chat/findChats/${encodeURIComponent(instance)}`,
            'POST',
            {},
          ),
          fetchContacts(instance),
        ]);
        const list: any[] = Array.isArray(chatsRes.data) ? chatsRes.data : [];
        const normalized = list
          .map(normalizeChat)
          .filter((c): c is EvoChat => Boolean(c))
          .map((c) => {
            const enrich = contactsMap.get(c.remoteJid);
            const looksLikeNumber = !c.name || /^\d+$/.test(c.name) || c.name === c.remoteJid.split('@')[0];
            return {
              ...c,
              name: looksLikeNumber && enrich?.name ? enrich.name : c.name,
              profilePicUrl: c.profilePicUrl || enrich?.pic || null,
            };
          })
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
  const PAGE_SIZE = 200;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (chat: EvoChat, pageNum: number) => {
      const res = await callEvolution(
        `/chat/findMessages/${encodeURIComponent(instance)}`,
        'POST',
        {
          where: { key: { remoteJid: chat.remoteJid } },
          limit: PAGE_SIZE,
          page: pageNum,
        },
      );
      const records: any[] =
        res.data?.messages?.records ??
        res.data?.records ??
        (Array.isArray(res.data) ? res.data : []);
      return records
        .map(normalizeMessage)
        .filter((m): m is EvoMessage => Boolean(m));
    },
    [instance],
  );

  const loadMessages = useCallback(
    async (chat: EvoChat, silent = false) => {
      if (!instance || !chat) return;
      if (!silent) setMsgsLoading(true);
      try {
        const list = await fetchPage(chat, 1);
        const sorted = list.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
        setMessageLayoutVersion((v) => v + 1);
        setPage(1);
        setHasMore(list.length >= PAGE_SIZE);
        refreshMessagesLayout(silent ? 'auto' : 'smooth');
      } catch (e: any) {
        if (!silent) toast.error(e?.message ?? 'Falha ao carregar mensagens');
      } finally {
        setMsgsLoading(false);
      }
    },
    [instance, fetchPage, refreshMessagesLayout],
  );

  const loadOlder = useCallback(async () => {
    if (!active || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const next = page + 1;
      const list = await fetchPage(active, next);
      if (list.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...list.filter((m) => !seen.has(m.id)), ...prev];
        return merged.sort((a, b) => a.timestamp - b.timestamp);
      });
      setMessageLayoutVersion((v) => v + 1);
      setPage(next);
      if (list.length < PAGE_SIZE) setHasMore(false);
      // Preserve scroll position after prepending older messages
      setTimeout(() => {
        if (el) {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight;
        }
      }, 30);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao carregar mensagens antigas');
    } finally {
      setLoadingMore(false);
    }
  }, [active, fetchPage, hasMore, loadingMore, page]);

  useEffect(() => {
    if (!active) return;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    loadMessages(active);
    const t = setInterval(() => loadMessages(active, true), POLL_MESSAGES_MS);
    return () => clearInterval(t);
  }, [active, loadMessages]);

  useEffect(() => {
    const content = messageContentRef.current;
    if (!content) return;

    const resizeObserver = new ResizeObserver(() => {
      if (stickToBottomRef.current) requestAnimationFrame(() => scrollMessagesToBottom('auto'));
    });
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [messages.length, scrollMessagesToBottom]);

  // -------- Export full history --------
  const handleExportAll = async () => {
    if (!instance || chats.length === 0 || exporting) return;
    setExporting(true);
    setExportProgress({ done: 0, total: chats.length });

    const lines: string[] = [];
    const header =
      `Histórico de Conversas — ${collaborator.collaborator_name}\n` +
      `Instância: ${instance}\n` +
      `Telefone: ${collaborator.collaborator_phone ?? '—'}\n` +
      `Exportado em: ${new Date().toLocaleString('pt-BR')}\n` +
      `Total de conversas: ${chats.length}\n` +
      `${'='.repeat(70)}\n\n`;
    lines.push(header);

    try {
      for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        try {
          const res = await callEvolution(
            `/chat/findMessages/${encodeURIComponent(instance)}`,
            'POST',
            {
              where: { key: { remoteJid: chat.remoteJid } },
              limit: 500,
              page: 1,
            },
          );
          const records: any[] =
            res.data?.messages?.records ??
            res.data?.records ??
            (Array.isArray(res.data) ? res.data : []);
          const msgs = records
            .map(normalizeMessage)
            .filter((m): m is EvoMessage => Boolean(m))
            .sort((a, b) => a.timestamp - b.timestamp);

          lines.push(
            `\n--- Conversa: ${chat.name} (${jidToNumber(chat.remoteJid)})${
              chat.isGroup ? ' [GRUPO]' : ''
            } ---\n`,
          );
          if (msgs.length === 0) {
            lines.push('(sem mensagens)\n');
          } else {
            for (const m of msgs) {
              const when = new Date(m.timestamp).toLocaleString('pt-BR');
              const who = m.fromMe ? collaborator.collaborator_name : chat.name;
              const text = (m.text || '[mídia]').replace(/\n/g, ' ');
              lines.push(`[${when}] ${who}: ${text}\n`);
            }
          }
        } catch (e) {
          lines.push(
            `\n--- Conversa: ${chat.name} (${jidToNumber(chat.remoteJid)}) ---\n` +
              `(falha ao buscar mensagens: ${(e as Error).message})\n`,
          );
        }
        setExportProgress({ done: i + 1, total: chats.length });
      }

      // Trigger download
      const blob = new Blob([lines.join('')], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = collaborator.collaborator_name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '_')
        .toLowerCase();
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `historico_${safeName}_${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Histórico exportado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao exportar histórico');
    } finally {
      setExporting(false);
      setExportProgress(null);
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

  const renderLinkedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(urlRegex)) {
      const rawUrl = match[0];
      const start = match.index ?? 0;
      const trailing = rawUrl.match(/[),.;:!?]+$/)?.[0] ?? '';
      const cleanUrl = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl;
      if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
      nodes.push(
        <a
          key={`${start}-${cleanUrl}`}
          href={cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium underline underline-offset-2 break-all"
        >
          {cleanUrl}
        </a>,
      );
      if (trailing) nodes.push(trailing);
      lastIndex = start + rawUrl.length;
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes.length ? nodes : text;
  };

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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportAll}
            disabled={exporting || chats.length === 0}
            title="Baixar todo o histórico como TXT para análise por IA"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 hover:opacity-100 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-2.5 py-1 transition"
          >
            {exporting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {exporting && exportProgress
              ? `${exportProgress.done}/${exportProgress.total}`
              : 'Baixar histórico'}
          </button>
          <button
            onClick={() => {
              loadChats();
              if (active) loadMessages(active);
            }}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 hover:opacity-100 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 transition"
          >
            <RefreshCw className={cn('w-3 h-3', chatsLoading && 'animate-spin')} />
            Atualizar
          </button>
        </div>
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
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              >
                <div ref={messageContentRef} className="min-h-full space-y-2">
                {msgsLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    Sem mensagens nesta conversa.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center pb-2">
                      {hasMore ? (
                        <button
                          onClick={loadOlder}
                          disabled={loadingMore}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm border border-gray-200 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {loadingMore ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Carregando...</>
                          ) : (
                            <>↑ Carregar mensagens mais antigas</>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          Início do histórico disponível
                        </span>
                      )}
                    </div>
                    {messages.map((m) => (
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
                        {m.mediaType && (
                          <MessageMedia instance={instance} message={m} fromMe={m.fromMe} />
                        )}
                        {m.text && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {renderLinkedText(m.text)}
                          </p>
                        )}
                        {!m.text && !m.mediaType && (
                          <p className="leading-relaxed italic opacity-60">[mensagem vazia]</p>
                        )}
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
                    ))}
                  </>
                )}
                </div>
              </div>


            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
