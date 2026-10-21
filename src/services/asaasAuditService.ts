import { supabase } from '@/integrations/supabase/client';
import { isAsaasPaid } from './asaasPaymentRules';
import type { Tables } from '@/integrations/supabase/types';

export type AsaasCharge = Tables<'sofia_cobrancas'>;
export type AsaasEvent = Tables<'webhook_logs'>;
async function readCharges(): Promise<AsaasCharge[]> {
  const rows: AsaasCharge[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('sofia_cobrancas').select('*').order('id').range(offset, offset + 499);
    if (error) throw new Error('Cobranças Asaas indisponíveis ou acesso não autorizado');
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
async function readEvents(): Promise<AsaasEvent[]> {
  const rows: AsaasEvent[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('webhook_logs').select('*').eq('provider', 'asaas').order('id').range(offset, offset + 499);
    if (error) throw new Error('Eventos Asaas indisponíveis ou acesso não autorizado');
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function readAsaasAudit() {
  const [charges, events] = await Promise.all([readCharges(), readEvents()]);
  const observedPayments = new Set(events.flatMap(event => {
    const payload = event.payload as { payment?: { id?: string } } | null;
    return typeof payload?.payment?.id === 'string' ? [payload.payment.id] : [];
  }));
  const seen = new Set<string>();
  const duplicateChargeIds: string[] = [];
  for (const charge of charges) {
    if (seen.has(charge.asaas_id)) duplicateChargeIds.push(charge.asaas_id);
    seen.add(charge.asaas_id);
  }
  return { charges, events, duplicateChargeIds,
    unmatched: charges.filter(charge => !observedPayments.has(charge.asaas_id)),
    total: charges.filter(charge => isAsaasPaid(charge.status)).reduce((sum, charge) => sum + Number(charge.value), 0),
    timestamp: new Date().toISOString(), certified: false as const };
}