import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.24.2';
import { internetAdmin } from '../_shared/internet-auth.ts';

const bodySchema = z.object({ scope: z.enum(['all','provider','account']), provider_id: z.string().uuid().nullable().optional(), account_id: z.string().uuid().nullable().optional(), request_key: z.string().uuid() }).strict();
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const admin = await internetAdmin(req);
    if (!admin) return reply({ error: 'Unauthorized' }, 401);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Invalid collection request' }, 400);
    const { scope, provider_id, account_id, request_key } = parsed.data;
    if ((scope === 'all' && (provider_id || account_id)) || (scope === 'provider' && (!provider_id || account_id)) || (scope === 'account' && (!account_id || provider_id))) return reply({ error: 'Invalid scope' }, 400);
    const { data: runId, error } = await admin.db.rpc('internet_dispatch_collection', { p_scope: scope, p_provider_id: provider_id ?? null, p_account_id: account_id ?? null, p_request_key: request_key, p_actor_id: admin.user.id });
    if (error) return reply({ error: 'Collection unavailable' }, 503);
    const { data: run } = await admin.db.from('internet_collection_runs').select('id,state,expected_accounts,created_at').eq('id', runId).single();
    return reply({ run });
  } catch { return reply({ error: 'Service unavailable' }, 503); }
});
