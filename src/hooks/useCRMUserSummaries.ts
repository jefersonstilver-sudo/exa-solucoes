import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchInconsistencies } from '@/services/crm360';
interface UserSummary { phone: string | null; verified: boolean; count: number; duplicates?: string }

async function allRows(table: string, columns: string) {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await (supabase as any).from(table).select(columns).order('id').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < 1000) return rows;
  }
}
export function useCRMUserSummaries() {
  return useQuery({ queryKey: ['crm-user-summaries'], staleTime: 60000, retry: false, queryFn: async () => {
    const [users, profiles, orders, duplicates] = await Promise.all([
      allRows('users', 'id,telefone,email_verified_at'), allRows('profiles', 'id,whatsapp'),
      allRows('pedidos', 'id,client_id'), fetchInconsistencies(),
    ]);
    const profileMap = new Map(profiles.map(p => [p.id, p.whatsapp]));
    const counts = new Map<string, number>();
    orders.forEach(o => counts.set(o.client_id, (counts.get(o.client_id) || 0) + 1));
    return new Map<string, UserSummary>(users.map(u => {
      const phone = profileMap.get(u.id) || u.telefone;
      const digits = String(phone || '').replace(/\D/g, '');
      const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
      return [String(u.id), { phone, verified: Boolean(u.email_verified_at), count: counts.get(u.id) || 0, duplicates: duplicates.find(d => d.tipo === 'telefone_em_varias_contas' && d.chave === normalized)?.detalhe }] as [string, UserSummary];
    }));
  }});
}