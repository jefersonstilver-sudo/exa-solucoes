import { supabase } from '@/integrations/supabase/client';
import { callAsaas, findOrderCharge } from './asaasPaymentService';
import { isAsaasPaid, requireAsaasPaymentId } from './asaasPaymentRules';
import { onlyDigits } from '@/utils/cpfCnpjValidator';

export interface AdminPixData {
  payment_id: string;
  copia_e_cola?: string;
  qr_base64?: string;
  invoice_url?: string;
  vencimento?: string;
}

const KEY = (pedidoId: string) => `exa_admin_pix_${pedidoId}`;

export function getCachedPix(pedidoId: string): AdminPixData | null {
  try { const raw = localStorage.getItem(KEY(pedidoId)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function cachePix(pedidoId: string, pix: AdminPixData) {
  try { localStorage.setItem(KEY(pedidoId), JSON.stringify(pix)); } catch { /* ignore */ }
}

/** Existing charge for this order (by explicit order id only). */
export async function findExistingPix(pedidoId: string): Promise<AdminPixData | null> {
  const cached = getCachedPix(pedidoId);
  if (cached?.payment_id) return cached;
  const charge = await findOrderCharge(pedidoId).catch(() => null);
  if (charge?.asaas_id) return { payment_id: charge.asaas_id, vencimento: charge.due_date ?? undefined };
  return null;
}

export async function generateOrderPix(params: {
  pedidoId: string; name: string; cpfCnpj: string; email: string; phone?: string; value: number; description: string;
}): Promise<AdminPixData> {
  const { customer_id } = await callAsaas<{ customer_id: string }>({
    action: 'ensure_customer', name: params.name, cpfCnpj: onlyDigits(params.cpfCnpj), email: params.email, phone: onlyDigits(params.phone || ''),
  });
  if (!customer_id) throw new Error('Asaas não retornou o cliente');
  const pix = await callAsaas<AdminPixData>({
    action: 'pix', customer_id, value: params.value, description: params.description,
    pedido_id: params.pedidoId, externalReference: `pedido:${params.pedidoId}`,
  });
  requireAsaasPaymentId(pix.payment_id);
  cachePix(params.pedidoId, pix);
  return pix;
}

export async function checkPixStatus(paymentId: string): Promise<{ status: string; paid: boolean }> {
  requireAsaasPaymentId(paymentId);
  const { status } = await callAsaas<{ status: string }>({ action: 'status', payment_id: paymentId });
  return { status, paid: isAsaasPaid(status) };
}

/** Only call after Asaas returned RECEIVED/CONFIRMED. */
export async function markOrderPaidFromAsaas(pedidoId: string, status: string) {
  if (!isAsaasPaid(status)) throw new Error('Pagamento não confirmado pelo Asaas');
  const { error } = await supabase.from('pedidos').update({ status: 'pago_pendente_video' } as any)
    .eq('id', pedidoId).in('status', ['pendente', 'pending']);
  if (error) throw error;
  await supabase.from('parcelas').update({ status: 'pago', data_pagamento: new Date().toISOString() } as any)
    .eq('pedido_id', pedidoId).eq('numero_parcela', 1);
}
