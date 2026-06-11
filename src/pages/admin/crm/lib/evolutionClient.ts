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

  let mediaType: EvoMediaType | undefined;
  let mediaMime: string | undefined;
  let mediaFileName: string | undefined;
  let directUrl: string | undefined;
  let caption = '';

  if (msg.imageMessage) {
    mediaType = 'image';
    mediaMime = msg.imageMessage.mimetype;
    directUrl = msg.imageMessage.url;
    caption = msg.imageMessage.caption || '';
  } else if (msg.stickerMessage) {
    mediaType = 'sticker';
    mediaMime = msg.stickerMessage.mimetype;
    directUrl = msg.stickerMessage.url;
  } else if (msg.videoMessage) {
    mediaType = 'video';
    mediaMime = msg.videoMessage.mimetype;
    directUrl = msg.videoMessage.url;
    caption = msg.videoMessage.caption || '';
  } else if (msg.audioMessage) {
    mediaType = 'audio';
    mediaMime = msg.audioMessage.mimetype;
    directUrl = msg.audioMessage.url;
  } else if (msg.documentMessage || msg.documentWithCaptionMessage) {
    const dm = msg.documentMessage || msg.documentWithCaptionMessage?.message?.documentMessage;
    mediaType = 'document';
    mediaMime = dm?.mimetype;
    mediaFileName = dm?.fileName;
    directUrl = dm?.url;
    caption = dm?.caption || '';
  }

  const text: string =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    caption ||
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
    mediaType,
    mediaMime,
    mediaFileName,
    directUrl,
    raw,
  };
};

// Fetch media as playable URL (blob:) via Evolution API.
// Returns blob URL with whatever mimetype the API reports (after optional MP4 conversion).
export const fetchMediaDataUrl = async (
  instance: string,
  rawMessage: any,
  opts: { convertToMp4?: boolean } = {},
): Promise<string | null> => {
  if (!instance || !rawMessage) return null;
  try {
    const convertToMp4 = Boolean(opts.convertToMp4);
    const res = await callEvolution(
      `/chat/getBase64FromMediaMessage/${encodeURIComponent(instance)}`,
      'POST',
      { message: rawMessage, convertToMp4 },
    );
    const d = res.data ?? {};
    console.log('[evolutionClient] media response keys:', Object.keys(d), 'mimetype:', d?.mimetype, 'convertToMp4:', convertToMp4);
    let base64: string | undefined = d.base64 ?? d.media ?? d.data;
    if (!base64) {
      console.warn('[evolutionClient] no base64 in response', d);
      return null;
    }
    if (base64.startsWith('data:')) {
      const comma = base64.indexOf(',');
      base64 = base64.slice(comma + 1);
    }
    const reportedMime: string =
      d.mimetype ?? d.mediaType ?? d.mime ?? 'application/octet-stream';
    // Strip codec params (e.g. "audio/ogg; codecs=opus") for Blob/<video> compatibility
    const mimetype = reportedMime.split(';')[0].trim();

    try {
      const bin = atob(base64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimetype });
      const url = URL.createObjectURL(blob);
      console.log('[evolutionClient] blob created:', { mimetype, size: blob.size, url });
      return url;
    } catch (decodeErr) {
      console.error('[evolutionClient] base64 decode failed', decodeErr);
      return `data:${mimetype};base64,${base64}`;
    }
  } catch (e) {
    console.error('[evolutionClient] fetchMediaDataUrl error', e);
    return null;
  }
};

// Fetch contacts list to enrich chat display names
export const fetchContacts = async (
  instance: string,
): Promise<Map<string, { name: string; pic: string | null }>> => {
  const map = new Map<string, { name: string; pic: string | null }>();
  if (!instance) return map;
  try {
    const res = await callEvolution(
      `/chat/findContacts/${encodeURIComponent(instance)}`,
      'POST',
      {},
    );
    const list: any[] = Array.isArray(res.data) ? res.data : [];
    for (const c of list) {
      const jid: string | undefined =
        c?.remoteJid ?? c?.id ?? c?.jid ?? c?.key?.remoteJid;
      if (!jid) continue;
      const name: string =
        c?.pushName ||
        c?.name ||
        c?.verifiedName ||
        c?.notify ||
        c?.profileName ||
        c?.shortName ||
        '';
      const pic = c?.profilePicUrl ?? c?.profilePictureUrl ?? null;
      if (name || pic) map.set(jid, { name: String(name || ''), pic });
    }
  } catch (e) {
    console.warn('[evolutionClient] fetchContacts failed', e);
  }
  return map;
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
