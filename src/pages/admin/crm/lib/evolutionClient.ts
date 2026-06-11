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

const unwrapWhatsAppMessage = (message: any): any => {
  let current = message ?? {};
  for (let i = 0; i < 10; i++) {
    const next =
      current?.ephemeralMessage?.message ??
      current?.viewOnceMessage?.message ??
      current?.viewOnceMessageV2?.message ??
      current?.viewOnceMessageV2Extension?.message ??
      current?.documentWithCaptionMessage?.message;
    if (!next || next === current) break;
    current = next;
  }
  return current ?? {};
};

const stripHeavyMediaFields = (media: any) => {
  if (!media || typeof media !== 'object') return media;
  const rest = { ...media };
  ['jpegThumbnail', 'contextInfo', 'scansSidecar', 'firstScanSidecar', 'firstScanLength', 'midQualityFileSha256', 'waveform']
    .forEach((key) => delete rest[key]);
  return rest;
};

const compactMediaMessage = (raw: any): any => {
  const msg = unwrapWhatsAppMessage(raw?.message ?? raw);
  const compact: any = {};
  for (const key of ['imageMessage', 'videoMessage', 'ptvMessage', 'audioMessage', 'pttMessage', 'stickerMessage', 'documentMessage']) {
    if (msg?.[key]) compact[key] = stripHeavyMediaFields(msg[key]);
  }
  if (Object.keys(compact).length === 0) return raw;
  if (!raw?.key) return { message: compact };
  return {
    key: raw.key,
    message: compact,
    messageType: raw.messageType,
    messageTimestamp: raw.messageTimestamp,
    source: raw.source,
    status: raw.status,
  };
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
};

const extractMediaBase64 = (payload: any): string | undefined => {
  const candidate = payload?.base64 ?? payload?.media ?? payload?.data ?? payload?.file;
  if (typeof candidate === 'string') return candidate;
  if (typeof payload?.buffer === 'string') return payload.buffer;
  const bufferData = payload?.buffer?.data ?? payload?.buffer;
  if (Array.isArray(bufferData)) return bytesToBase64(Uint8Array.from(bufferData));
  return undefined;
};

const mediaPayloadToUrl = (payload: any, rawMessage: any): string | null => {
  let base64 = extractMediaBase64(payload);
  if (!base64) return null;
  if (base64.startsWith('data:')) {
    const comma = base64.indexOf(',');
    base64 = base64.slice(comma + 1);
  }
  const sourceMsg = unwrapWhatsAppMessage(rawMessage?.message ?? rawMessage);
  const reportedMime: string =
    payload?.mimetype ??
    payload?.mimeType ??
    payload?.mime ??
    sourceMsg?.documentMessage?.mimetype ??
    sourceMsg?.imageMessage?.mimetype ??
    sourceMsg?.videoMessage?.mimetype ??
    sourceMsg?.audioMessage?.mimetype ??
    sourceMsg?.stickerMessage?.mimetype ??
    'application/octet-stream';
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
};

export const normalizeChat = (raw: any): EvoChat | null => {
  const remoteJid: string | undefined =
    raw?.remoteJid ?? raw?.id ?? raw?.key?.remoteJid;
  if (!remoteJid) return null;

  const isGroup = remoteJid.endsWith('@g.us');
  const name: string =
    (raw?.pushName && String(raw.pushName).trim()) ||
    (raw?.name && String(raw.name).trim()) ||
    (raw?.subject && String(raw.subject).trim()) ||
    (raw?.verifiedName && String(raw.verifiedName).trim()) ||
    (raw?.notify && String(raw.notify).trim()) ||
    (raw?.profileName && String(raw.profileName).trim()) ||
    (typeof raw?.profilePicUrl === 'object' ? raw?.profilePicUrl?.name : '') ||
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
  const msg = unwrapWhatsAppMessage(raw?.message ?? {});
  const rawType = String(raw?.messageType ?? raw?.type ?? raw?.mediaType ?? '').toLowerCase();

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
  } else if (msg.videoMessage || msg.ptvMessage) {
    const vm = msg.videoMessage || msg.ptvMessage;
    mediaType = 'video';
    mediaMime = vm.mimetype;
    directUrl = vm.url;
    caption = vm.caption || '';
  } else if (msg.audioMessage || msg.pttMessage) {
    const am = msg.audioMessage || msg.pttMessage;
    mediaType = 'audio';
    mediaMime = am.mimetype;
    directUrl = am.url;
  } else if (msg.documentMessage || rawType.includes('document')) {
    const dm = msg.documentMessage ?? raw?.documentMessage ?? raw?.message?.documentMessage ?? {};
    mediaType = 'document';
    mediaMime = dm?.mimetype ?? raw?.mimetype ?? raw?.mimeType ?? raw?.mediaMime;
    mediaFileName = dm?.fileName || dm?.title || raw?.fileName || raw?.mediaFileName || raw?.title;
    directUrl = dm?.url ?? raw?.url ?? raw?.mediaUrl;
    caption = dm?.caption || raw?.caption || '';
  }

  if (!mediaType && Object.keys(msg).length) {
    const known = new Set([
      'conversation', 'extendedTextMessage', 'messageContextInfo', 'protocolMessage',
      'senderKeyDistributionMessage', 'reactionMessage', 'pollCreationMessage',
      'pollUpdateMessage',
    ]);
    const unknownKeys = Object.keys(msg).filter((k) => !known.has(k));
    if (unknownKeys.length) {
      console.warn('[normalizeMessage] unhandled message keys:', unknownKeys, msg);
    }
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
    const candidates: any[] = [compactMediaMessage(rawMessage)];
    try {
      const compactJson = JSON.stringify(candidates[0]);
      const rawJson = JSON.stringify(rawMessage);
      if (rawJson && rawJson !== compactJson && rawJson.length < 85_000) candidates.push(rawMessage);
    } catch {
      // keep compact payload only
    }

    let lastPayload: any = null;
    for (const messagePayload of candidates) {
      const res = await callEvolution(
        `/chat/getBase64FromMediaMessage/${encodeURIComponent(instance)}`,
        'POST',
        { message: messagePayload, convertToMp4 },
      );
      const d = res.data ?? {};
      lastPayload = d;
      console.log('[evolutionClient] media response keys:', Object.keys(d), 'mimetype:', d?.mimetype, 'convertToMp4:', convertToMp4);
      const url = mediaPayloadToUrl(d, rawMessage);
      if (url) return url;
    }

    console.warn('[evolutionClient] no base64 in response', lastPayload);
    return null;
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
