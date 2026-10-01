import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.117.2/cors?target=deno';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const base = 'https://api.asaas.com/v3';
type Fields = Record<string, unknown>;
const object = (v: unknown): Fields => v && typeof v === 'object' && !Array.isArray(v) ? v as Fields : {};
const value = (v: unknown) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? v : null;
const text = (v: unknown) => typeof v === 'string' && v.trim() ? v : null;
const maskDocument = (v: unknown) => {
  const digits = text(v)?.replace(/\D/g, '');
  return digits && (digits.length === 11 || digits.length === 14) ? `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}` : null;
};
const maskAccount = (v: unknown) => {
  const s = text(v);
  return s ? `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}` : null;
};
const receipt = (v: unknown) => {
  const s = text(v);
  if (!s) return null;
  try { const url = new URL(s); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; }
  catch { return null; }
};
async function getAsaas(path: string, key: string): Promise<{ data: Fields | null; status: number }> {
  const res = await fetch(`${base}${path}`, { headers: { access_token: key }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return { data: null, status: res.status };
  return { data: object(await res.json()), status: res.status };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  const key = Deno.env.get('ASAAS_API_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !url || !service) return response({ error: 'Service unavailable' }, 503);
  try {
    const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return response({ error: 'Unauthorized' }, 401);
    const db = createClient(url, service);
    const { data: { user }, error: authError } = await db.auth.getUser(bearer);
    if (authError || !user) return response({ error: 'Unauthorized' }, 401);
    const { data: roles, error: roleError } = await db.from('user_roles').select('role').eq('user_id', user.id).in('role', ['super_admin', 'admin_financeiro', 'admin']).limit(1);
    if (roleError || !roles?.length) return response({ error: 'Forbidden' }, 403);
    const body = await req.json().catch(() => null);
    const id = object(body).id;
    if (typeof id !== 'string' || !/^ftn_[A-Za-z0-9_-]{1,100}$/.test(id) || Object.keys(object(body)).length !== 1) return response({ error: 'Invalid movement ID' }, 400);
    // The caller chooses only an existing movement ID. Resource IDs always come from the stored Asaas statement, never the request.
    const { data: movement, error } = await db.from('asaas_extrato_movimentos').select('id,tipo,transfer_id,payment_id,bill_payment_id,raw_data').eq('id', id).maybeSingle();
    if (error) return response({ error: 'Statement unavailable' }, 503);
    if (!movement) return response({ error: 'Movement not found' }, 404);
    const raw = object(movement.raw_data);
    const refs = {
      transferId: text(movement.transfer_id), paymentId: text(movement.payment_id), billId: text(movement.bill_payment_id),
      pixTransactionId: text(raw.pixTransactionId),
    };
    const safeId = (v: string | null) => v && /^[A-Za-z0-9_-]{1,120}$/.test(v) ? encodeURIComponent(v) : null;
    const paths: { name: string; path: string }[] = [];
    if (safeId(refs.transferId)) paths.push({ name: 'transfer', path: `/transfers/${safeId(refs.transferId)}` });
    if (safeId(refs.paymentId)) paths.push({ name: 'payment', path: `/payments/${safeId(refs.paymentId)}` });
    if (safeId(refs.billId)) paths.push({ name: 'bill', path: `/bill/${safeId(refs.billId)}` });
    if (safeId(refs.pixTransactionId)) paths.push({ name: 'pix', path: `/pix/transactions/${safeId(refs.pixTransactionId)}` });
    const results = await Promise.all(paths.map(async ({ name, path }) => {
      try { return { name, ...(await getAsaas(path, key)) }; }
      catch { return { name, data: null, status: 0 }; }
    }));
    const detail = (name: string) => results.find(r => r.name === name)?.data ?? {};
    const transfer = detail('transfer');
    const payment = detail('payment');
    const bill = detail('bill');
    const pix = detail('pix');
    const customerId = safeId(text(payment.customer));
    let customer: Fields = {};
    if (customerId) {
      try { customer = (await getAsaas(`/customers/${customerId}`, key)).data ?? {}; }
      catch { /* Payment detail remains available without customer enrichment. */ }
    }
    const account = object(transfer.bankAccount);
    const bank = object(account.bank);
    const pixBank = object(pix.bankAccount);
    const details = {
      status: value(transfer.status ?? payment.status ?? bill.status ?? pix.status),
      operation: value(transfer.operationType ?? transfer.type ?? payment.billingType ?? bill.status ?? pix.type),
      grossValue: value(transfer.value ?? payment.value ?? bill.value ?? pix.value),
      fee: value(transfer.transferFee ?? payment.fee ?? bill.fee ?? pix.fee),
      netValue: value(transfer.netValue ?? payment.netValue ?? bill.netValue ?? pix.netValue),
      createdAt: value(transfer.dateCreated ?? payment.dateCreated ?? bill.dateCreated ?? pix.dateCreated),
      requestedAt: value(transfer.scheduleDate ?? bill.scheduleDate),
      effectiveAt: value(transfer.effectiveDate ?? transfer.confirmedDate ?? payment.paymentDate ?? payment.confirmedDate ?? bill.paymentDate ?? pix.effectiveDate),
      description: value(transfer.description ?? payment.description ?? bill.description ?? pix.description),
      endToEnd: value(transfer.endToEndIdentifier ?? pix.endToEndIdentifier ?? pix.endToEndId),
      name: value(account.ownerName ?? account.accountName ?? customer.name ?? bill.companyName ?? pixBank.ownerName),
      document: maskDocument(account.cpfCnpj ?? customer.cpfCnpj ?? bill.cpfCnpj ?? pixBank.cpfCnpj),
      bank: value(bank.name ?? bank.code ?? account.bank ?? pixBank.bank),
      agency: value(account.agency ?? pixBank.agency),
      account: maskAccount(account.account ?? pixBank.account),
      pixKey: maskAccount(account.pixAddressKey ?? pix.pixAddressKey),
      recurring: value(transfer.recurring ?? pix.recurring),
      recurrenceId: value(transfer.recurringId ?? transfer.recurrenceId ?? pix.recurringId),
      externalReference: value(transfer.externalReference ?? payment.externalReference ?? bill.externalReference ?? raw.externalReference),
      receiptUrl: receipt(transfer.transactionReceiptUrl ?? bill.transactionReceiptUrl ?? payment.transactionReceiptUrl ?? pix.transactionReceiptUrl),
    };
    return response({ id, references: refs, details, available: results.filter(r => r.data).map(r => r.name), unavailable: results.filter(r => !r.data).map(r => ({ resource: r.name, status: r.status })) });
  } catch (e) {
    console.error('Statement detail unavailable', e instanceof Error ? e.name : 'Unknown');
    return response({ error: 'Details temporarily unavailable' }, 503);
  }
});
