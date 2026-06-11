import { supabase } from '@/integrations/supabase/client';

export const callEvolution = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
) => {
  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { path, method, body },
  });
  if (error) throw new Error(error.message);
  return data as { status: number; data: any };
};

// Normalize a Evolution chat object into a uniform shape
export interface EvoChat {
  remoteJid: string;
  name: string;
  profilePicUrl: string | null;
  lastMessageText: string;
  lastMessageTime: number; // ms
  unreadCount: number;
  isGroup: boolean;
}

export type EvoMediaType = 'image' | 'video' | 'audio' | 'sticker' | 'document';

export interface EvoMessage {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: number; // ms
  status?: string;
  mediaType?: EvoMediaType;
  mediaMime?: string;
  mediaFileName?: string;
  directUrl?: string;
  raw?: any; // original payload for media base64 fetch
}

export const normalizeChat = (raw: any): EvoChat | null => {
  const remoteJid: string | undefined =
    raw?.remoteJid ?? raw?.id ?? raw?.key?.remoteJid;
  if (!remoteJid) return null;

  const isGroup = remoteJid.endsWith('@g.us');
  const name: string =
    raw?.pushName ??
    raw?.name ??
    raw?.subject ??
    raw?.profilePicUrl?.name ??
    remoteJid.split('@')[0];

  // Last message preview
  const lm = raw?.lastMessage ?? raw?.last_message ?? null;
  const lastMessageText: string =
    lm?.message?.conversation ||
    lm?.message?.extendedTextMessage?.text ||
    lm?.message?.imageMessage?.caption ||
    lm?.message?.videoMessage?.caption ||
    (lm?.message?.imageMessage ? '📷 Foto' : '') ||
    (lm?.message?.videoMessage ? '🎥 Vídeo' : '') ||
    (lm?.message?.audioMessage ? '🎵 Áudio' : '') ||
    (lm?.message?.documentMessage ? '📄 Documento' : '') ||
    raw?.lastMessagePreview ||
    '';

  const ts: number = Number(
    lm?.messageTimestamp ??
      raw?.updatedAt ??
      raw?.updated_at ??
      raw?.lastMessageTime ??
      0,
  );
  const tsMs = ts > 1e12 ? ts : ts * 1000;

  return {
    remoteJid,
    name: String(name),
    profilePicUrl: raw?.profilePicUrl ?? raw?.profile_picture_url ?? null,
    lastMessageText: String(lastMessageText ?? ''),
    lastMessageTime: tsMs,
    unreadCount: Number(raw?.unreadCount ?? raw?.unread_count ?? 0),
    isGroup,
  };
};

export const normalizeMessage = (raw: any): EvoMessage | null => {
  const id: string | undefined = raw?.key?.id ?? raw?.id;
  if (!id) return null;
  const fromMe: boolean = Boolean(raw?.key?.fromMe ?? raw?.fromMe);
  const msg = raw?.message ?? {};
  const text: string =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    (msg.imageMessage ? '📷 Foto' : '') ||
    (msg.videoMessage ? '🎥 Vídeo' : '') ||
    (msg.audioMessage ? '🎵 Áudio' : '') ||
    (msg.documentMessage ? '📄 Documento' : '') ||
    raw?.text ||
    '';
  const ts = Number(raw?.messageTimestamp ?? raw?.timestamp ?? 0);
  const tsMs = ts > 1e12 ? ts : ts * 1000;
  return {
    id: String(id),
    fromMe,
    text: String(text ?? ''),
    timestamp: tsMs,
    status: raw?.status,
  };
};

export const formatChatTime = (ms: number): string => {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Ontem';
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Convert remoteJid → phone number for sendText
export const jidToNumber = (jid: string): string => jid.split('@')[0];
