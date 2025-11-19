import { supabase } from '@/integrations/supabase/client';

/**
 * Validate ManyChat webhook signature
 * @param req Request object
 * @returns boolean indicating if signature is valid
 */
export const validateManychatSignature = (req: Request): boolean => {
  // Placeholder implementation
  // In production, implement proper HMAC signature validation
  const signature = req.headers.get('x-manychat-signature');
  
  if (!signature) {
    console.warn('⚠️ [MANYCHAT] No signature provided');
    return true; // Allow for development, tighten in production
  }

  // TODO: Implement HMAC-SHA256 validation with ManyChat secret
  console.log('🔐 [MANYCHAT] Signature validation (stub):', signature);
  return true;
};

/**
 * Normalize ManyChat webhook payload to internal format
 */
export interface NormalizedMessage {
  conversation_id: string;
  message_id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  from: {
    name?: string;
    phone: string;
  };
  attachments: any[];
  timestamp: string;
}

export const normalizeManychatPayload = (raw: any): NormalizedMessage => {
  return {
    conversation_id: raw.conversation_id || raw.psid || 'unknown',
    message_id: raw.message_id || raw.id || `mc-${Date.now()}`,
    direction: raw.direction || (raw.from === 'page' ? 'outbound' : 'inbound'),
    body: raw.text || raw.message || '',
    from: {
      name: raw.from?.name || raw.sender?.name,
      phone: raw.from?.phone || raw.sender?.phone || 'unknown'
    },
    attachments: raw.attachments || [],
    timestamp: raw.timestamp || raw.created_time || new Date().toISOString()
  };
};

/**
 * Fetch messages from ManyChat API
 * @param since ISO timestamp to fetch messages from
 * @param page Page number for pagination
 */
export const fetchManychatMessages = async (
  since: string,
  page: number = 1
): Promise<any[]> => {
  const manychatApiKey = import.meta.env.VITE_MANYCHAT_API_KEY;
  
  if (!manychatApiKey) {
    console.error('❌ [MANYCHAT] API Key not configured');
    return [];
  }

  try {
    // ManyChat API endpoint (adjust based on actual API documentation)
    const response = await fetch(
      `https://api.manychat.com/fb/conversations?since=${encodeURIComponent(since)}&page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${manychatApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`ManyChat API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ [MANYCHAT] Error fetching messages:', error);
    return [];
  }
};

/**
 * Map message to device based on content analysis
 * Extracts device references from message text (AnyDesk ID, painel number, condominium)
 */
export const mapManychatToDevice = async (message: NormalizedMessage): Promise<string | null> => {
  const text = message.body.toLowerCase();

  // Try to extract AnyDesk ID
  const anydeskMatch = text.match(/anydesk\s*:?\s*(\d+)/i);
  if (anydeskMatch) {
    const anydeskId = anydeskMatch[1];
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('anydesk_client_id', anydeskId)
      .single();
    
    if (device) {
      console.log(`✅ [MANYCHAT] Mapped to device via AnyDesk ID: ${device.id}`);
      return device.id;
    }
  }

  // Try to extract condominium name
  const condominiumMatch = text.match(/condom[ií]nio\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i);
  if (condominiumMatch) {
    const condominiumName = condominiumMatch[1].trim();
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .ilike('condominio_name', `%${condominiumName}%`)
      .limit(1)
      .single();
    
    if (device) {
      console.log(`✅ [MANYCHAT] Mapped to device via condominium: ${device.id}`);
      return device.id;
    }
  }

  // Try to extract painel/device number
  const painelMatch = text.match(/painel\s*#?\s*(\d+)/i);
  if (painelMatch) {
    const painelNumber = painelMatch[1];
    // In a real scenario, query painels table and find associated device
    console.log(`ℹ️ [MANYCHAT] Painel reference found but not mapped: ${painelNumber}`);
  }

  return null;
};

/**
 * Get conversation history for analysis
 */
export const getConversationHistory = async (
  conversationId: string,
  limit: number = 10
): Promise<any[]> => {
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return messages || [];
};
