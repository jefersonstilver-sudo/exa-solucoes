// EXA (07/11/2026) — o que cada pedido tem em atraso, da auditoria de cobrança (cobranca_auditoria), via RPC só para a equipe.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AtrasoPedido {
  pedido_id: string;
  valor_atraso: number;
  parcelas_atraso: number;
  dias_atraso: number;
  vencimento_mais_antigo: string | null;
  proximo_vencimento: string | null;
  valor_pago: number;
  parcelas_pagas: number;
}

/** Conta Interna da EXA (Indexa Midia): pedidos editoriais, testes e vendas das telas. */
export const CONTA_INTERNA_ID = 'de96cfa9-9dbe-4ead-be94-3647e345d2de';

export const ehContaInterna = (p: { client_id?: string | null; client_name?: string | null }) =>
  p.client_id === CONTA_INTERNA_ID || /^conta interna$/i.test(String(p.client_name || '').trim());

/** Pedidos editoriais da EXA (Notícias Brasil, Notícias Foz, Curiosidades): ficam na rodada, não são venda. */
export const ehEditorial = (p: { nome_pedido?: string | null }) =>
  /not[ií]cias|curiosidades/i.test(String(p.nome_pedido || ''));

export const usePedidosAtraso = () =>
  useQuery({
    queryKey: ['pedidos-atraso-resumo'],
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('pedidos_atraso_resumo');
      if (error) throw error;
      const mapa = new Map<string, AtrasoPedido>();
      for (const r of (data || []) as AtrasoPedido[]) mapa.set(r.pedido_id, { ...r, valor_atraso: Number(r.valor_atraso) || 0, valor_pago: Number(r.valor_pago) || 0 });
      return mapa;
    },
  });
