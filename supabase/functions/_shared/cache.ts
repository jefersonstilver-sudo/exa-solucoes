import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Sistema simples de cache usando agent_context
 */

export async function getFromCache<T>(
  supabase: SupabaseClient,
  key: string,
  maxAgeSeconds: number = 300
): Promise<T | null> {
  const { data } = await supabase
    .from('agent_context')
    .select('value, created_at')
    .eq('key', key)
    .maybeSingle();

  if (!data) return null;

  // Verificar se cache expirou
  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > maxAgeSeconds * 1000) {
    console.log('[CACHE] Expired:', key);
    await supabase.from('agent_context').delete().eq('key', key);
    return null;
  }

  console.log('[CACHE] Hit:', key);
  return data.value as T;
}

export async function saveToCache<T>(
  supabase: SupabaseClient,
  key: string,
  value: T
): Promise<void> {
  await supabase
    .from('agent_context')
    .upsert({
      key,
      value: value as any
    }, {
      onConflict: 'key'
    });
  
  console.log('[CACHE] Saved:', key);
}

export async function clearCache(
  supabase: SupabaseClient,
  keyPattern: string
): Promise<void> {
  await supabase
    .from('agent_context')
    .delete()
    .like('key', `${keyPattern}%`);
  
  console.log('[CACHE] Cleared:', keyPattern);
}
