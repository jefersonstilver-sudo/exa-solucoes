import { supabase } from '@/integrations/supabase/client';

export type PedidoStatusAcao = 'cancelar' | 'suspender' | 'reativar';

export interface PedidoStatusResultado {
  ok: boolean;
  erro?: string;
  telas?: { ok: boolean; info: string };
  aviso?: { email: boolean; whatsapp: boolean };
  asaas?: { cancelados?: number; pagas_mantidas?: number };
  status_restaurado?: string;
  repetido?: boolean;
}

const FN_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sofia-agent?action=pedido_admin';

/**
 * Cancela, suspende ou reativa um pedido. O servidor faz todo o trabalho:
 * tira/devolve o pedido das telas, cancela as cobrancas futuras no Asaas (so no cancelamento),
 * muda o status, registra o log e avisa o cliente (e-mail + WhatsApp) e o CEO.
 */
export async function alterarStatusPedido(
  acao: PedidoStatusAcao,
  pedidoId: string,
  motivo: string,
): Promise<PedidoStatusResultado> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, erro: 'Sessão expirada. Faça login de novo.' };
  try {
    const r = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ acao, pedido_id: pedidoId, motivo }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) return { ok: false, erro: j?.erro || `Falha (HTTP ${r.status})`, ...j };
    return j as PedidoStatusResultado;
  } catch (e) {
    return { ok: false, erro: (e as Error).message || 'Falha de conexão' };
  }
}
