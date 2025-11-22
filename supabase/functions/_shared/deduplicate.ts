import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Função centralizada de deduplicação de mensagens
 * Verifica se uma mensagem já foi processada recentemente
 */
export async function checkDuplicate(
  supabase: SupabaseClient,
  messageId: string,
  phone: string,
  messageText: string
): Promise<{ isDuplicate: boolean; reason?: string; existingId?: string }> {
  
  // 1. Verificar por messageId (mais confiável)
  const { data: existingLog } = await supabase
    .from('zapi_logs')
    .select('id, created_at')
    .eq('zapi_message_id', messageId)
    .maybeSingle();

  if (existingLog) {
    console.log('[DEDUPE] ⚠️ Duplicate by messageId:', messageId);
    return {
      isDuplicate: true,
      reason: 'message_id_match',
      existingId: existingLog.id
    };
  }

  // 2. Verificar por conteúdo (backup - janela de 10 segundos)
  const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

  const { data: recentSimilarLog } = await supabase
    .from('zapi_logs')
    .select('id, created_at')
    .eq('phone_number', phone)
    .eq('message_text', messageText)
    .eq('direction', 'inbound')
    .gte('created_at', tenSecondsAgo)
    .maybeSingle();

  if (recentSimilarLog) {
    console.log('[DEDUPE] ⚠️ Duplicate by content:', {
      phone,
      secondsAgo: (Date.now() - new Date(recentSimilarLog.created_at).getTime()) / 1000
    });
    return {
      isDuplicate: true,
      reason: 'content_match',
      existingId: recentSimilarLog.id
    };
  }

  // Não é duplicado
  return { isDuplicate: false };
}
