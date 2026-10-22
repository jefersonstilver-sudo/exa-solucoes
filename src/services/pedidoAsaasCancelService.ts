import { supabase } from '@/integrations/supabase/client';

// Cancelamento no Asaas antes de excluir pedido (edge function cancelar-pedido-asaas).
// Os IDs do Asaas sao lidos do banco pela funcao; o navegador so envia os IDs dos pedidos.

export interface AsaasCobrancaMapa {
  id: string;
  status: string;
  valor: number | null;
  vencimento: string | null;
  pago_em: string | null;
  origem: string;
}

export interface AsaasAcao {
  tipo: 'autorizacao_pix' | 'assinatura' | 'cobranca';
  alvo: string;
  ok: boolean;
  http: number;
  detalhe: string | null;
}

export interface PedidoAsaasMapa {
  pedido_id: string;
  nome: string | null;
  erros_leitura: string[];
  assinatura: { id: string; status: string | null } | null;
  autorizacao_pix: { id: string; status: string | null; caminho: string | null } | null;
  pagas: AsaasCobrancaMapa[];
  a_cancelar: AsaasCobrancaMapa[];
  outras: AsaasCobrancaMapa[];
  tem_algo_no_asaas: boolean;
  acoes?: AsaasAcao[];
  sobrou_aberto?: string[];
  ok?: boolean;
}

export interface CancelAsaasResult {
  modo: 'mapear' | 'cancelar';
  ok: boolean;
  pedidos: PedidoAsaasMapa[];
}

async function chamar(body: Record<string, unknown>): Promise<CancelAsaasResult> {
  const { data, error } = await supabase.functions.invoke('cancelar-pedido-asaas', { body });
  if (error) throw new Error(error.message || 'Falha ao consultar o Asaas');
  if (!data || !Array.isArray((data as CancelAsaasResult).pedidos)) throw new Error('Resposta invalida do Asaas');
  return data as CancelAsaasResult;
}

/** So leitura: o que cada pedido tem no Asaas. */
export const mapearAsaasPedidos = (pedidoIds: string[]) => chamar({ modo: 'mapear', pedido_ids: pedidoIds });

/** Cancela autorizacao Pix Automatico, assinatura e cobrancas abertas. Cobranca paga nao e tocada. */
export const cancelarAsaasPedidos = (pedidoIds: string[], justificativa: string) =>
  chamar({ modo: 'cancelar', pedido_ids: pedidoIds, justificativa });

const assinaturaAtiva = (m: PedidoAsaasMapa) =>
  !!m.assinatura && !['DELETED', 'INACTIVE', 'EXPIRED', 'NAO_ENCONTRADA'].includes(String(m.assinatura.status));
const autorizacaoAtiva = (m: PedidoAsaasMapa) =>
  !!m.autorizacao_pix && !['CANCELLED', 'CANCELED', 'EXPIRED', 'REFUSED', 'NAO_ENCONTRADA'].includes(String(m.autorizacao_pix.status));

/** true quando ha algo aberto no Asaas que precisa ser cancelado antes de excluir. */
export const precisaCancelar = (m: PedidoAsaasMapa) => m.a_cancelar.length > 0 || assinaturaAtiva(m) || autorizacaoAtiva(m);

export const brl = (v: number | null | undefined) =>
  typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export const dataBR = (d: string | null | undefined) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '—');
