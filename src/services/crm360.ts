import { supabase } from '@/integrations/supabase/client';

export interface CRM360Lookup { contact?: string; user?: string; phone?: string; email?: string }
export interface CRM360Account {
  id: string; email: string | null; nome: string | null; telefone: string | null;
  whatsapp: string | null; whatsapp_verificado: boolean; email_verificado: boolean;
  email_verificado_em: string | null; conta_criada_em: string | null; bloqueada: boolean;
  empresa: string | null; pedidos: number;
}
export interface CRM360Order {
  id: string; nome_pedido: string | null; status: string; ativo: boolean;
  valor_total: number | null; valor_mensal: number | null; plano_meses: number | null;
  tipo_produto: string | null; data_inicio: string | null; data_fim: string | null;
  criado_em: string | null; email: string | null; whatsapp: string | null;
  conta_id: string | null; contrato_status: string | null; master: boolean; origem: string;
}
export interface CRM360Data {
  contato: { id: string; nome: string | null; telefone: string | null; papel: string | null; empresa: string | null; criado_em: string | null; email_informado: string | null } | null;
  fone_normalizado: string | null; contas: CRM360Account[]; pedidos: CRM360Order[];
  resumo: { total_pedidos: number; pedidos_ativos: number; valor_ativos: number; cliente_desde: string | null; ultima_compra: string | null; conta_criada_em: string | null; email_verificado: boolean; telefone_verificado_sofia: boolean };
  alertas: string[];
}
export interface CRMInconsistency { tipo: string; chave: string; detalhe: string; qtd: number }

export function crm360Params(lookup: CRM360Lookup) {
  return { p_contact: lookup.contact || null, p_user: lookup.user || null, p_phone: lookup.phone || null, p_email: lookup.email || null };
}
export function crm360Error(error: { message?: string; code?: string } | null) {
  if (/acesso negado|permission denied|unauthorized|jwt/i.test(error?.message || '') || ['42501', 'PGRST301'].includes(error?.code || '')) return 'Você não tem permissão para consultar esta ficha. Acesse com uma conta administrativa autorizada.';
  return 'Não foi possível carregar os dados. Tente novamente.';
}
export async function fetchCRM360(lookup: CRM360Lookup): Promise<CRM360Data> {
  const { data, error } = await (supabase as any).rpc('crm_cliente_360', crm360Params(lookup));
  if (error) throw new Error(crm360Error(error));
  if (!data || data.error || typeof data === 'string') throw new Error(crm360Error({ message: typeof data === 'string' ? data : data?.error }));
  return data as CRM360Data;
}
export function crm360Path(base: string, lookup: CRM360Lookup) {
  const params = new URLSearchParams();
  Object.entries(lookup).forEach(([key, value]) => { if (value) params.set(key, value); });
  return `${base}/crm-360?${params}`;
}
export function crmPhone(phone?: string | null) {
  if (!phone) return 'Não informado';
  const digits = phone.replace(/\D/g, '');
  const local = digits.length === 12 || digits.length === 13 ? (digits.startsWith('55') ? digits.slice(2) : '') : digits;
  if (local.length === 11) return `+55 ${local.slice(0, 2)} ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `+55 ${local.slice(0, 2)} ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}
export function crmDate(value?: string | null) {
  if (!value) return 'Não informado';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informado';
}
export function activeOrdersFirst(orders: CRM360Order[]) {
  return [...orders].sort((a, b) => Number(b.ativo) - Number(a.ativo) || (b.criado_em || '').localeCompare(a.criado_em || ''));
}
export async function fetchInconsistencies() {
  const rows: CRMInconsistency[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await (supabase as any).from('crm_inconsistencias').select('tipo,chave,detalhe,qtd').order('tipo').order('chave').range(offset, offset + 999);
    if (error) throw new Error(crm360Error(error));
    rows.push(...(data || []));
    if ((data || []).length < 1000) return rows;
  }
}