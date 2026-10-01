import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.24.2';
import { internetDb } from '../_shared/internet-auth.ts';
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const schema = z.object({ run_id: z.string().uuid(), job_id: z.string().uuid(), account_id: z.string().uuid(), sequence: z.number().int().positive(), state: z.enum(['logging_in','collecting_contracts','collecting_invoices','downloading_documents','reconciling','completed','error','intervention_required']), counts: z.object({ contracts: z.number().int().nonnegative().optional(), invoices: z.number().int().nonnegative().optional() }).strict().optional(), error_code: z.enum(['PORTAL_UNAVAILABLE','AUTH_REQUIRED','CAPTCHA','TWO_FACTOR','COLLECTION_FAILED']).optional() }).strict();
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  // Phase 1 is intentionally fail-closed: no external worker identity or credential vault exists yet.
  // A bearer token from a browser or arbitrary external client must never become a worker identity.
  const workerSecret = Deno.env.get('INTERNET_WORKER_INGEST_SECRET');
  if (!workerSecret || workerSecret.length < 32) return reply({ error: 'Worker not configured' }, 503);
  const supplied = req.headers.get('x-internet-worker-secret') ?? '';
  const a = new TextEncoder().encode(workerSecret);
  const b = new TextEncoder().encode(supplied);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ (b[i] ?? 0);
  if (mismatch) return reply({ error: 'Unauthorized' }, 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return reply({ error: 'Invalid event' }, 400);
  try {
    const db = internetDb();
    const v = parsed.data;
    const { data: updated, error } = await db.rpc('internet_update_job_phase', { p_job_id: v.job_id, p_run_id: v.run_id, p_account_id: v.account_id, p_sequence: v.sequence, p_state: v.state, p_counts: v.counts ?? {}, p_error_code: v.error_code ?? null });
    if (error || !updated) return reply({ error: 'Job unavailable or phase out of order' }, 409);
    return reply({ accepted: true });
  } catch { return reply({ error: 'Service unavailable' }, 503); }
});
