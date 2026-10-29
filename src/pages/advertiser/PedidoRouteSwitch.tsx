import { lazy, Suspense, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EsqueletoPedido } from '@/components/pedido-v2/Esqueletos';

const OrderDetails = lazy(() => import('./OrderDetails'));
const OrderDetailsV2 = lazy(() => import('./OrderDetailsV2'));

/**
 * EXA 2.0 — chave liga/desliga da página nova do pedido.
 * Fonte: tabela exa2_flags (chave 'pedido_v2'): ativo_todos libera para todos;
 * usuarios[] libera só para contas específicas (ex.: conta interna).
 * Qualquer falha de leitura cai na página clássica — nunca deixa o cliente sem página.
 * ?versao=classica / ?versao=nova força manualmente (suporte).
 */
export default function PedidoRouteSwitch() {
  const [usarV2, setUsarV2] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const forcar = new URLSearchParams(window.location.search).get('versao');
      if (forcar === 'classica') return ativo && setUsarV2(false);
      if (forcar === 'nova') return ativo && setUsarV2(true);
      try {
        const [{ data: u }, { data: flag, error }] = await Promise.all([
          supabase.auth.getUser(),
          (supabase as any).from('exa2_flags').select('ativo_todos, usuarios').eq('chave', 'pedido_v2').maybeSingle(),
        ]);
        if (error || !flag) return ativo && setUsarV2(false);
        const uid = u?.user?.id;
        ativo && setUsarV2(Boolean(flag.ativo_todos || (uid && (flag.usuarios || []).includes(uid))));
      } catch {
        ativo && setUsarV2(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (usarV2 === null) return <EsqueletoPedido />;
  return (
    <Suspense fallback={<EsqueletoPedido />}>
      {usarV2 ? <OrderDetailsV2 /> : <OrderDetails />}
    </Suspense>
  );
}
