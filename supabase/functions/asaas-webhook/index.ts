import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'npm:@supabase/supabase-js@2.117.2/cors';

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const equal = (a: string, b: string) => {
  const encoder = new TextEncoder();
  const x = encoder.encode(a), y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  const token = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  if (!token) return reply(503, { error: 'Webhook not configured' });
  if (!equal(req.headers.get('asaas-access-token') || '', token)) return reply(401, { error: 'Unauthorized' });
  const raw = await req.text();
  if (raw.length > 100000) return reply(413, { error: 'Payload too large' });
  let event: Record<string, unknown>;
  try { event = JSON.parse(raw); } catch { return reply(400, { error: 'Invalid JSON' }); }
  if (!event || typeof event !== 'object' || typeof event.id !== 'string' || !/^[a-zA-Z0-9_\-]{2,120}$/.test(event.id) || typeof event.event !== 'string' || !/^[A-Z_]{2,120}$/.test(event.event)) return reply(400, { error: 'Invalid event identity' });
  if (event.event.startsWith('PAYMENT_') && (!event.payment || typeof event.payment !== 'object' || typeof (event.payment as { id?: unknown }).id !== 'string')) return reply(400, { error: 'Invalid payment event' });
  const url = Deno.env.get('SUPABASE_URL'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !service) return reply(503, { error: 'Persistence unavailable' });
  const db = createClient(url, service);
  const { data, error } = await db.rpc('record_asaas_webhook_event', { p_event_id: event.id, p_event_type: event.event, p_payload: event });
  const record = data?.[0];
  if (error || !record?.log_id) {
    console.error('Asaas webhook persistence failed', { event_id: event.id });
    return reply(503, { error: 'Persistence unavailable' });
  }
  // Phase 1 is durable receipt only. Do not infer a paid order or assign a pending installment
  // from value, customer name or an ambiguous order reference. Phase 2 reconciles by Asaas IDs.
  return reply(200, { success: true, event_id: event.id, status: record.processing_status, duplicate: !record.newly_recorded });
});
