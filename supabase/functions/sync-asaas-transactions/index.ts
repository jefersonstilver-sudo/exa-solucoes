import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from 'npm:@supabase/supabase-js@2.117.2/cors';

const base = 'https://api.asaas.com/v3';
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const date = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const key = Deno.env.get('ASAAS_API_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !url || !service) return respond({ error: 'Service unavailable' }, 503);
  const db = createClient(url, service);
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return respond({ error: 'Unauthorized' }, 401);
  const { data: { user }, error: authError } = await db.auth.getUser(bearer);
  if (authError || !user) return respond({ error: 'Unauthorized' }, 401);
  const { data: role, error: roleError } = await db.from('user_roles').select('role').eq('user_id', user.id).in('role', ['super_admin', 'admin_financeiro', 'admin']).limit(1);
  if (roleError || !role?.length) return respond({ error: 'Forbidden' }, 403);
  let runId: string | undefined;
  let pages = 0, items = 0, created = 0, updated = 0;
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== 'object' || (body.startDate && !date(body.startDate)) || (body.status && !/^[A-Z_]{2,40}$/.test(body.status))) return respond({ error: 'Invalid filters' }, 400);
    const { data: run, error: runError } = await db.from('sync_runs').insert({ source: 'asaas_payments', started_at: new Date().toISOString(), state: 'running', window_start: body.startDate || null }).select('id').single();
    if (runError || !run) throw new Error('Cannot persist sync run');
    runId = run.id;
    const limit = 100;
    let offset = 0;
    const customerCache = new Map<string, { name?: string; email?: string; cpfCnpj?: string }>();
    for (;;) {
      const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) });
      if (body.startDate) qs.set('dateCreated[ge]', body.startDate);
      if (body.status) qs.set('status', body.status);
      const response = await fetch(`${base}/payments?${qs}`, { headers: { access_token: key }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Payments API HTTP ${response.status}`);
      const list = await response.json();
      if (!Array.isArray(list.data) || typeof list.hasMore !== 'boolean') throw new Error('Invalid payments page');
      pages++;
      for (const payment of list.data) {
        if (typeof payment.id !== 'string' || !payment.id.startsWith('pay_') || !payment.customer || typeof payment.value !== 'number') throw new Error('Invalid payment entry');
        let customer = customerCache.get(payment.customer);
        if (!customer) {
          const response = await fetch(`${base}/customers/${encodeURIComponent(payment.customer)}`, { headers: { access_token: key }, signal: AbortSignal.timeout(10000) });
          if (!response.ok) throw new Error(`Customer API HTTP ${response.status}`);
          customer = await response.json();
          customerCache.set(payment.customer, customer || {});
        }
        const { data: existing, error: lookupError } = await db.from('transacoes_asaas').select('id,status').eq('payment_id', payment.id).maybeSingle();
        if (lookupError) throw new Error('Payment lookup failed');
        const row = {
          payment_id: payment.id, billing_type: payment.billingType, status: payment.status,
          valor: payment.value, valor_liquido: payment.netValue ?? null,
          taxa_asaas: payment.netValue == null ? null : Number((payment.value - payment.netValue).toFixed(2)),
          data_criacao: payment.dateCreated, data_vencimento: payment.dueDate,
          data_pagamento: payment.paymentDate || payment.confirmedDate || null,
          customer_id: payment.customer, customer_name: customer?.name || null,
          customer_email: customer?.email || null, customer_cpf_cnpj: customer?.cpfCnpj || null,
          description: payment.description || null, external_reference: payment.externalReference || null,
          pix_transaction_id: payment.pixTransaction?.id || null, pix_qr_code: payment.pixTransaction?.qrCode || null,
          pix_copy_paste: payment.pixTransaction?.payload || null, boleto_url: payment.bankSlipUrl || null,
          boleto_barcode: null, boleto_nosso_numero: payment.nossoNumero || null,
          raw_data: payment, synced_at: new Date().toISOString(),
        };
        // Only Asaas' exact payment ID can update a mirrored payment; never match by amount/name.
        if (!existing || existing.status !== payment.status) {
          const { error } = await db.from('transacoes_asaas').upsert(row, { onConflict: 'payment_id' });
          if (error) throw new Error('Payment upsert failed');
          if (existing) updated++; else created++;
        }
        items++;
      }
      const { error: progressError } = await db.from('sync_runs').update({ pages_count: pages, items_count: items, processed_count: items, updated_at: new Date().toISOString() }).eq('id', runId);
      if (progressError) throw new Error('Cannot persist progress');
      if (!list.hasMore) break;
      if (list.data.length === 0) throw new Error('Empty page with hasMore');
      offset += list.data.length;
    }
    const finished = new Date().toISOString();
    const { error } = await db.from('sync_runs').update({ finished_at: finished, last_success_at: finished, state: 'completed', pages_count: pages, items_count: items, processed_count: items, updated_at: finished }).eq('id', runId);
    if (error) throw new Error('Cannot persist completed run');
    return respond({ success: true, run_id: runId, pages, items, synced: created, updated, last_sync: finished });
  } catch (e) {
    console.error('Asaas payment sync failed', { run_id: runId, pages, items, reason: e instanceof Error ? e.message : 'unknown' });
    if (runId) await db.from('sync_runs').update({ finished_at: new Date().toISOString(), state: 'failed', pages_count: pages, items_count: items, processed_count: items, errors: [{ reason: e instanceof Error ? e.message : 'unknown' }] }).eq('id', runId);
    return respond({ success: false, run_id: runId, error: 'Synchronization failed' }, 500);
  }
});
