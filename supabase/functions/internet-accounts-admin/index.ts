import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.24.2';
import { internetAdmin } from '../_shared/internet-auth.ts';
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const accountSchema = z.object({ provider_id: z.string().uuid(), holder_name: z.string().trim().min(2).max(160), holder_document: z.string().trim().max(24).nullable().optional(), account_label: z.string().trim().min(2).max(120), external_account_id: z.string().trim().max(120).nullable().optional() }).strict();
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!['GET','POST'].includes(req.method)) return reply({ error: 'Method not allowed' }, 405);
  try {
    const admin = await internetAdmin(req);
    if (!admin) return reply({ error: 'Unauthorized' }, 401);
    const db = admin.db;
    if (req.method === 'POST') {
      const parsed = accountSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return reply({ error: 'Invalid account metadata' }, 400);
      const { data, error } = await db.from('internet_provider_accounts').insert({ ...parsed.data, enabled: false, access_state: 'not_configured' }).select('id').single();
      return error ? reply({ error: 'Account could not be registered' }, 409) : reply({ id: data.id }, 201);
    }
    const results = await Promise.all([
      db.from('internet_providers').select('id,code,display_name,enabled,collection_mode').order('display_name'),
      db.from('internet_provider_accounts').select('id,provider_id,holder_name,holder_document,account_label,external_account_id,enabled,access_state,created_at').order('created_at', { ascending: false }),
      db.from('internet_collection_runs').select('id,scope,provider_id,account_id,state,expected_accounts,created_at,started_at,finished_at').order('created_at', { ascending: false }).limit(50),
      db.from('internet_collection_jobs').select('id,run_id,account_id,state,counts,phase_changed_at,error_code').order('created_at', { ascending: false }).limit(200),
      db.from('internet_contracts').select('id,account_id,external_contract_id,installation_address,last_verified_run_id').limit(500),
      db.from('internet_invoices').select('id,contract_id,official_invoice_id,competence,amount,due_date,portal_status,bank_status,last_verified_run_id,portal_observed_at').limit(500),
      db.from('internet_exceptions').select('id,run_id,account_id,code,state,safe_message,created_at').order('created_at', { ascending: false }).limit(100),
      db.from('internet_invoice_observations').select('id,run_id,job_id,invoice_id,portal_status,amount,due_date,observed_at').order('observed_at', { ascending: false }).limit(500),
      db.from('internet_documents').select('id,invoice_id,run_id,document_type,created_at').order('created_at', { ascending: false }).limit(500),
      db.from('internet_contract_buildings').select('contract_id,building_id,state').eq('state', 'confirmed').limit(500),
    ]);
    if (results.some(r => r.error)) return reply({ error: 'Administrative data unavailable' }, 503);
    const [providers, accounts, runs, jobs, contracts, invoices, exceptions, observations, documents, links] = results.map(r => r.data ?? []);
    return reply({ providers, accounts, runs, jobs, contracts, invoices, exceptions, observations, documents, links });
  } catch { return reply({ error: 'Service unavailable' }, 503); }
});
