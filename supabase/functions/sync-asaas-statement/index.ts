import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.117.2/cors?target=deno';

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const base = 'https://api.asaas.com/v3';
type Movement = Record<string, unknown>;
type StatementRow = { id: string; ordem_asaas: number; data: unknown; tipo: unknown; descricao: string | null; valor: unknown; saldo: unknown; payment_id: string | null; transfer_id: string | null; bill_payment_id: string | null; external_reference: string | null; raw_data: Movement; synced_at: string };
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const key = Deno.env.get('ASAAS_API_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !url || !service) return reply({ error: 'Service unavailable' }, 503);
  const db = createClient(url, service);
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return reply({ error: 'Unauthorized' }, 401);
  const { data: { user }, error: authError } = await db.auth.getUser(bearer);
  if (authError || !user) return reply({ error: 'Unauthorized' }, 401);
  const { data: roles, error: roleError } = await db.from('user_roles').select('role').eq('user_id', user.id).in('role', ['super_admin', 'admin_financeiro', 'admin']).limit(1);
  if (roleError || !roles?.length) return reply({ error: 'Forbidden' }, 403);
  let runId: string | undefined;
  let pages = 0;
  let items = 0;
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length > 0) return reply({ error: 'No filters supported' }, 400);
    const { data: run, error: runError } = await db.from('sync_runs').insert({ source: 'asaas_statement', state: 'running', started_at: new Date().toISOString() }).select('id').single();
    if (runError || !run) throw new Error('Cannot persist sync run');
    runId = run.id;
    let offset = 0;
    const seen = new Set<string>();
    for (;;) {
      const response = await fetch(`${base}/financialTransactions?limit=100&offset=${offset}`, { headers: { access_token: key }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Asaas statement HTTP ${response.status}`);
      const list = await response.json();
      if (!Array.isArray(list.data) || typeof list.hasMore !== 'boolean') throw new Error('Invalid statement page');
      pages++;
      const rows: StatementRow[] = list.data.map((item: Movement, index: number) => {
        if (!item || typeof item !== 'object' || !text(item.id) || !text(item.type) || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.date)) || amount(item.value) === null || amount(item.balance) === null) throw new Error('Invalid statement movement');
        const id = String(item.id);
        if (seen.has(id)) throw new Error('Duplicate movement in paginated response');
        seen.add(id);
        return {
          id, ordem_asaas: offset + index, data: item.date, tipo: item.type, descricao: text(item.description), valor: item.value, saldo: item.balance,
          payment_id: text(item.paymentId), transfer_id: text(item.transferId), bill_payment_id: text(item.billId),
          external_reference: text(item.externalReference), raw_data: item, synced_at: new Date().toISOString(),
        };
      });
      if (rows.length) {
        const paymentIds = [...new Set(rows.map(row => row.payment_id).filter((id): id is string => !!id))];
        const outflowIds = [...new Set(rows.flatMap(row => [row.transfer_id, row.bill_payment_id]).filter((id): id is string => !!id))];
        const [{ data: payments, error: pError }, { data: outflows, error: oError }] = await Promise.all([
          paymentIds.length ? db.from('transacoes_asaas').select('payment_id').in('payment_id', paymentIds) : Promise.resolve({ data: [], error: null }),
          outflowIds.length ? db.from('asaas_saidas').select('asaas_id,asaas_tipo').in('asaas_id', outflowIds) : Promise.resolve({ data: [], error: null }),
        ]);
        if (pError || oError) throw new Error('Cannot read reference mirrors');
        const ps = new Set((payments || []).map(p => p.payment_id));
        const os = new Set((outflows || []).map(o => o.asaas_id));
        const reconciled = rows.map(row => {
          const matches = [row.payment_id && ps.has(row.payment_id) && ['payment', row.payment_id], row.transfer_id && os.has(row.transfer_id) && ['transfer', row.transfer_id], row.bill_payment_id && os.has(row.bill_payment_id) && ['bill_payment', row.bill_payment_id]].filter(Boolean) as string[][];
          return { ...row, correspondencia_status: matches.length === 1 ? 'correspondente' : matches.length > 1 ? 'ambiguo' : 'sem_correspondencia', correspondencia_tipo: matches.length === 1 ? matches[0][0] : null, correspondencia_id: matches.length === 1 ? matches[0][1] : null };
        });
        const { error } = await db.from('asaas_extrato_movimentos').upsert(reconciled, { onConflict: 'id' });
        if (error) throw new Error(`Statement persistence failed: ${error.code || 'unknown'}`);
      }
      items += rows.length;
      const { error: progressError } = await db.from('sync_runs').update({ pages_count: pages, items_count: items, processed_count: items, updated_at: new Date().toISOString() }).eq('id', runId);
      if (progressError) throw new Error('Cannot persist progress');
      if (!list.hasMore) break;
      if (!rows.length || pages >= 1000) throw new Error('Invalid statement pagination');
      offset += rows.length;
    }
    const finished = new Date().toISOString();
    const { error: doneError } = await db.from('sync_runs').update({ state: 'completed', finished_at: finished, last_success_at: finished, pages_count: pages, items_count: items, processed_count: items }).eq('id', runId);
    if (doneError) throw new Error('Cannot persist completed run');
    return reply({ success: true, pages, items, last_sync: finished });
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'Unknown error';
    console.error('Asaas statement sync failed', { run_id: runId, pages, items, reason });
    if (runId) await db.from('sync_runs').update({ state: 'failed', finished_at: new Date().toISOString(), pages_count: pages, items_count: items, processed_count: items, errors: [{ reason }] }).eq('id', runId);
    return reply({ error: 'Statement synchronization failed', reason }, 500);
  }
});
