import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Identifica pedidos fechados pela Sofia (IA vendedora).
 * Fontes (somente leitura): sofia_aceites.pedido_id (quando legível) e
 * sofia_cobrancas com external_reference 'sofia:<aceite>'.
 * Resultado compartilhado entre todos os cards (uma consulta por carga).
 */
let cache: { at: number; promise: Promise<Set<string>> } | null = null;
const TTL_MS = 60_000;

export const loadSofiaPedidoIds = (): Promise<Set<string>> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  const promise = (async () => {
    const ids = new Set<string>();
    try {
      const [{ data: aceites }, { data: charges }] = await Promise.all([
        (supabase as any).from('sofia_aceites').select('pedido_id').not('pedido_id', 'is', null),
        supabase.from('sofia_cobrancas').select('pedido_id').like('external_reference', 'sofia:%').not('pedido_id', 'is', null),
      ]);
      (aceites || []).forEach((r: any) => r?.pedido_id && ids.add(String(r.pedido_id)));
      (charges || []).forEach((r: any) => r?.pedido_id && ids.add(String(r.pedido_id)));
    } catch (e) {
      console.warn('[useSofiaOrders] falha ao carregar', e);
    }
    return ids;
  })();
  cache = { at: Date.now(), promise };
  return promise;
};

export const useIsSofiaOrder = (pedidoId?: string | null): boolean => {
  const [isSofia, setIsSofia] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!pedidoId) { setIsSofia(false); return; }
    loadSofiaPedidoIds().then((ids) => { if (alive) setIsSofia(ids.has(pedidoId)); });
    return () => { alive = false; };
  }, [pedidoId]);
  return isSofia;
};
