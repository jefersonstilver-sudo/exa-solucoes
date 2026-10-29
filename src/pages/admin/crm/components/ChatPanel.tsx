import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
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
import { Button } from '@/components/ui/button';
import { ConversationDay } from './ConversationVisuals';
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
  const [mobileChat, setMobileChat] = useState(false);

  const [messages, setMessages] = useState<EvoMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

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
            const phone = c.remoteJid.split('@')[0];
            const trimmed = (c.name || '').trim();
            const looksLikeNumber = !trimmed || /^\d+$/.test(trimmed) || trimmed === phone;
            const enrichedName = enrich?.name?.trim();
            const finalName = looksLikeNumber && enrichedName ? enrichedName : (trimmed || enrichedName || phone);
            return {
              ...c,
              name: finalName,
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
        setPage(1);
        setHasMore(list.length >= PAGE_SIZE);
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
    [instance, fetchPage],
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
    <div className="crm-workspace">
      {/* Owner bar */}
      <div className="crm-owner flex items-center gap-3 px-4 py-2.5">
        <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-xs font-semibold overflow-hidden">
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
          <Button variant="ghost"
            onClick={handleExportAll}
            disabled={exporting || chats.length === 0}
            title="Baixar todo o histórico como TXT para análise por IA"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 hover:opacity-100 bg-background hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-2.5 py-1 transition"
          >
            {exporting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {exporting && exportProgress
              ? `${exportProgress.done}/${exportProgress.total}`
              : 'Baixar histórico'}
          </Button>
          <Button variant="ghost"
            onClick={() => {
              loadChats();
              if (active) loadMessages(active);
            }}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-90 hover:opacity-100 bg-background hover:bg-background rounded-full px-2.5 py-1 transition"
          >
            <RefreshCw className={cn('w-3 h-3', chatsLoading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="crm-grid" data-mobile-chat={mobileChat}>
        {/* Conversations list */}
        <aside className="crm-list">
          <div className="p-3 border-b border-border bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="crm-search"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatsLoading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : chatsError ? (
              <div className="p-4 text-center">
                <p className="text-xs text-primary">{chatsError}</p>
                <Button variant="ghost"
                  onClick={() => loadChats()}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Inbox className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
                </p>
              </div>
            ) : (
              filteredChats.map((c) => (
                <Button variant="ghost"
                  key={c.remoteJid}
                  onClick={() => { setActive(c); setMobileChat(true); }} aria-current={active?.remoteJid === c.remoteJid}
                  className={cn(
                    'crm-row',
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="crm-avatar">
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
                        <UsersIcon className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        initials(c.name)
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="crm-row-name truncate">{c.name}</p>
                      <p className="crm-row-preview truncate">{c.lastMessageText}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatChatTime(c.lastMessageTime)}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section className="crm-chat">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa
            </div>
          ) : (
            <>
              {/* Chat header */}
              <header className="crm-chat-header"><Button variant="ghost" size="icon" className="crm-mobile-back" aria-label="Voltar às conversas" onClick={() => setMobileChat(false)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted flex items-center justify-center text-xs font-semibold text-muted-foreground overflow-hidden">
                  {active.profilePicUrl ? (
                    <img
                      src={active.profilePicUrl}
                      alt={active.name}
                      className="w-full h-full object-cover"
                    />
                  ) : active.isGroup ? (
                    <UsersIcon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    initials(active.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="crm-row-name truncate">
                    {active.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {active.isGroup ? 'Grupo' : jidToNumber(active.remoteJid)}
                  </p>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="crm-messages space-y-2"
              >
                {msgsLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    Sem mensagens nesta conversa.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center pb-2">
                      {hasMore ? (
                        <Button variant="ghost"
                          onClick={loadOlder}
                          disabled={loadingMore}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-background hover:bg-background text-foreground shadow-sm border border-border disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {loadingMore ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Carregando...</>
                          ) : (
                            <>↑ Carregar mensagens mais antigas</>
                          )}
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Início do histórico disponível
                        </span>
                      )}
                    </div>
                    {messages.map((m, index) => (
                    <React.Fragment key={m.id}><ConversationDay date={m.timestamp} previous={messages[index - 1]?.timestamp} /><div
                      className={cn(
                        'flex',
                        m.fromMe ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'crm-bubble', m.fromMe && 'crm-bubble-human',
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
                            'crm-time',
                          )}
                        >
                          <span className="text-[10px]">
                            {formatChatTime(m.timestamp)}
                          </span>
                          {m.fromMe &&
                            (m.status === 'READ' ? (
                              <CheckCheck className="w-3 h-3 text-inherit" />
                            ) : m.status === 'DELIVERY_ACK' ||
                              m.status === 'SERVER_ACK' ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                        </div>
                      </div>
                    </div></React.Fragment>
                    ))}
                  </>
                )}
              </div>


            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
