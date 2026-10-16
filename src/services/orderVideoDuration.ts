import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, number | null>();

/** Default max video duration per product type. */
export const defaultMaxDuration = (tipo: 'horizontal' | 'vertical') => (tipo === 'vertical' ? 15 : 10);

/** Returns the per-order override (pedidos.max_video_duration_override) or null. */
export async function getOrderDurationOverride(orderId?: string | null): Promise<number | null> {
  if (!orderId) return null;
  if (cache.has(orderId)) return cache.get(orderId) ?? null;
  try {
    const { data } = await (supabase as any)
      .from('pedidos')
      .select('max_video_duration_override')
      .eq('id', orderId)
      .maybeSingle();
    const value = typeof data?.max_video_duration_override === 'number' ? data.max_video_duration_override : null;
    cache.set(orderId, value);
    return value;
  } catch {
    return null;
  }
}

export async function getOrderMaxDuration(orderId: string | null | undefined, tipo: 'horizontal' | 'vertical') {
  return (await getOrderDurationOverride(orderId)) ?? defaultMaxDuration(tipo);
}
