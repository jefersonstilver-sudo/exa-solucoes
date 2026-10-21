import { supabase } from '@/integrations/supabase/client';
import { crm360Params, crm360Error, type CRM360Lookup } from './crm360Rules';
export * from './crm360Rules';
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

export async function fetchCRM360(lookup: CRM360Lookup): Promise<CRM360Data> {
  const { data, error } = await (supabase as any).rpc('crm_cliente_360', crm360Params(lookup));
  if (error) throw new Error(crm360Error(error));
  if (!data || data.error || typeof data === 'string') throw new Error(crm360Error({ message: typeof data === 'string' ? data : data?.error }));
  return data as CRM360Data;
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