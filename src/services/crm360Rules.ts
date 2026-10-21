export interface CRM360Lookup { contact?: string; user?: string; phone?: string; email?: string }
export function crm360Params(lookup: CRM360Lookup) {
  return { p_contact: lookup.contact || null, p_user: lookup.user || null, p_phone: lookup.phone || null, p_email: lookup.email || null };
}
export function crm360Error(error: { message?: string; code?: string } | null) {
  if (/acesso negado|permission denied|unauthorized|jwt/i.test(error?.message || '') || ['42501', 'PGRST301'].includes(error?.code || '')) return 'Você não tem permissão para consultar esta ficha. Acesse com uma conta administrativa autorizada.';
  return 'Não foi possível carregar os dados. Tente novamente.';
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
export function crm360HeaderPhone(data: {
  contato: { telefone: string | null } | null;
  contas: { whatsapp: string | null; telefone: string | null }[];
  fone_normalizado: string | null;
}) {
  // Display original data; the RPC's normalized key is for identity matching.
  const account = data.contas[0];
  return crmPhone(data.contato?.telefone || account?.whatsapp || account?.telefone || data.fone_normalizado);
}
export function crmDate(value?: string | null) {
  if (!value) return 'Não informado';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informado';
}
export function activeOrdersFirst<T extends { ativo: boolean; criado_em: string | null }>(orders: T[]) {
  return [...orders].sort((a, b) => Number(b.ativo) - Number(a.ativo) || (b.criado_em || '').localeCompare(a.criado_em || ''));
}
export function inconsistencyLookup(row: { tipo: string; chave: string }) {
  return row.tipo.startsWith('pedido_') ? { order: row.chave } : { phone: row.chave };
}