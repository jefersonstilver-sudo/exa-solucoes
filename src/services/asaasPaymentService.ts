import { supabase } from '@/integrations/supabase/client';
import { isAsaasPaid, requireAsaasPaymentId } from './asaasPaymentRules';

export { isAsaasPaid } from './asaasPaymentRules';
export interface AsaasCustomer { nome: string; email: string; cpf_cnpj: string; telefone: string }
export interface AsaasPix { payment_id: string; qr_base64: string; copia_cola: string; expires?: string }

export async function callAsaas<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new Error('Entre na sua conta para consultar ou gerar pagamentos Asaas');
  const { data, error } = await supabase.functions.invoke('asaas-cobranca', { body });
  if (error) throw new Error('Não foi possível consultar o Asaas. Tente novamente.');
  if (!data || data.error || data.success === false) throw new Error(data?.error || 'Resposta Asaas indisponível');
  return data as T;
}

export async function createAsaasCustomer(customer: AsaasCustomer): Promise<string> {
  if (!customer.nome || !customer.email || !customer.cpf_cnpj) throw new Error('Complete nome, e-mail e CPF/CNPJ do titular antes de gerar o Pix');
  const data = await callAsaas<{ customer_id: string }>({ action: 'customer', ...customer });
  if (!data.customer_id) throw new Error('Asaas não retornou o identificador do cliente');
  return data.customer_id;
}

export async function createAsaasPix(customer_id: string, value: number, description: string, externalReference: string, contact_id?: string): Promise<AsaasPix> {
  const data = await callAsaas<AsaasPix>({ action: 'pix', customer_id, value, description, externalReference, ...(contact_id ? { contact_id } : {}) });
  requireAsaasPaymentId(data.payment_id);
  if (!data.qr_base64 || !data.copia_cola) throw new Error('Asaas não retornou os dados do Pix');
  return data;
}

export async function createAsaasRecurringPix(customer_id: string, value: number, meses: number, description: string, externalReference: string) {
  return callAsaas<Record<string, unknown>>({ action: 'pix_automatico', customer_id, value, meses, description, externalReference });
}

export async function readAsaasStatus(payment_id: string) {
  requireAsaasPaymentId(payment_id);
  const data = await callAsaas<{ status: string }>({ action: 'status', payment_id });
  if (typeof data.status !== 'string') throw new Error('Status Asaas indisponível');
  return { ...data, paid: isAsaasPaid(data.status) };
}

export async function findOrderCharge(pedidoId: string) {
  // Only explicit order identifiers, never payer names or approximate amounts.
  const { data, error } = await supabase.from('sofia_cobrancas').select('*')
    .or(`pedido_id.eq.${pedidoId},external_reference.eq.${pedidoId}`)
    .like('asaas_id', 'pay_%').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Não foi possível ler a cobrança Asaas vinculada ao pedido');
  return data;
}

export async function verifyAsaasOrder(pedidoId: string) {
  const charge = await findOrderCharge(pedidoId);
  if (!charge) return { success: true, payment_found: false, payment_approved: false, status_updated: false };
  const result = await readAsaasStatus(charge.asaas_id);
  return { success: true, payment_found: true, payment_approved: result.paid, payment_status: result.status, payment_amount: charge.value, status_updated: false };
}

const inflight = new Map<string, Promise<AsaasPix>>();
// Ephemeral QR data is not a financial status or browser-storage credential.
const issuedPix = new Map<string, AsaasPix>();
export const getIssuedAsaasPix = (reference: string) => issuedPix.get(reference);
export function generateOrderPix(pedidoId: string, profile?: Record<string, any>): Promise<AsaasPix> {
  const issued = issuedPix.get(pedidoId);
  if (issued) return Promise.resolve(issued);
  const existing = inflight.get(pedidoId);
  if (existing) return existing;
  const task = (async () => {
    const charge = await findOrderCharge(pedidoId);
    // The existing API has no action to retrieve an issued QR. Never create a second charge silently.
    if (charge) throw new Error(`Este pedido já possui cobrança Asaas (${charge.asaas_id}). Consulte o pagamento existente; gerar outra cobrança exige revisão administrativa.`);
    const { data: order, error } = await supabase.from('pedidos').select('id,client_id,valor_total,nome_pedido').eq('id', pedidoId).single();
    if (error || !order) throw new Error('Pedido indisponível');
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', order.client_id).single();
    if (userError || !user) throw new Error('Dados do titular indisponíveis');
    const customer_id = await createAsaasCustomer({
      nome: user.nome || profile?.nome || '', email: user.email || profile?.email || '',
      cpf_cnpj: user.empresa_documento || user.cpf || profile?.empresa_documento || profile?.cpf_cnpj || '',
      telefone: user.telefone || profile?.telefone || ''
    });
    const pix = await createAsaasPix(customer_id, Number(order.valor_total), order.nome_pedido || `Pedido EXA ${pedidoId}`, pedidoId);
    issuedPix.set(pedidoId, pix);
    return pix;
  })().finally(() => inflight.delete(pedidoId));
  inflight.set(pedidoId, task);
  return task;
}

export async function generateInstallmentPix(parcelaId: string) {
  const issued = issuedPix.get(parcelaId);
  if (issued) return issued;
  const active = inflight.get(parcelaId);
  if (active) return active;
  const task = (async () => {
    const { data: installment, error } = await supabase.from('parcelas').select('*').eq('id', parcelaId).single();
    if (error || !installment || installment.status === 'pago') throw new Error('Parcela indisponível ou já paga');
    const { data: prior, error: priorError } = await supabase.from('sofia_cobrancas').select('asaas_id').eq('external_reference', parcelaId).limit(1).maybeSingle();
    if (priorError) throw new Error('Não foi possível conferir a cobrança anterior');
    if (prior) throw new Error(`Cobrança Asaas já emitida: ${prior.asaas_id}. Consulte o pagamento existente.`);
    const { data: order, error: orderError } = await supabase.from('pedidos').select('client_id').eq('id', installment.pedido_id).single();
    if (orderError || !order) throw new Error('Pedido da parcela indisponível');
    const { data: user, error: userError } = await supabase.from('users').select('nome,email,cpf,empresa_documento,telefone').eq('id', order.client_id).single();
    if (userError || !user) throw new Error('Dados do titular indisponíveis');
    const customer = await createAsaasCustomer({ nome: user.nome || '', email: user.email || '', cpf_cnpj: user.empresa_documento || user.cpf || '', telefone: user.telefone || '' });
    const pix = await createAsaasPix(customer, Number(installment.valor_final), `Parcela ${installment.numero_parcela} · EXA`, parcelaId);
    issuedPix.set(parcelaId, pix);
    return pix;
  })().finally(() => inflight.delete(parcelaId));
  inflight.set(parcelaId, task);
  return task;
}