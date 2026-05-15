import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';

function stripExt(s: string | null | undefined) {
  return (s || '').replace(/\.[^/.]+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { pedido_id, ativar_titulo, desativar_titulo } = await req.json();
    if (!pedido_id || !ativar_titulo) {
      return new Response(
        JSON.stringify({ error: 'pedido_id e ativar_titulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const ativar = stripExt(ativar_titulo);
    const desativar = stripExt(desativar_titulo) || '';

    console.log('🚀 [MASTER_AWS]', { pedido_id, ativar, desativar });

    const { data: pedido, error: pErr } = await supabase
      .from('pedidos')
      .select('id, lista_predios')
      .eq('id', pedido_id)
      .maybeSingle();

    if (pErr || !pedido) throw new Error(`pedido não encontrado: ${pErr?.message || 'no row'}`);

    const lista: string[] = (pedido as any).lista_predios || [];
    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error('Pedido sem lista_predios');
    }

    const results: any[] = [];
    for (const buildingUuid of lista) {
      const clientId = buildingUuid.replace(/-/g, '').substring(0, 4);
      const endpoint = `${EXTERNAL_API_BASE}/master/master/${clientId}`;
      const body = {
        cliente_id: clientId,
        pedido_id,
        ativar_master: ativar,
        desativar_master: desativar,
      };
      console.log(`📤 [MASTER_AWS] PATCH ${endpoint}`, JSON.stringify(body));
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        const resp = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const text = await resp.text();
        console.log(`📥 [MASTER_AWS] ${clientId} -> ${resp.status} ${text.substring(0, 200)}`);
        results.push({ clientId, status: resp.status, ok: resp.ok, body: text.substring(0, 200) });
      } catch (err: any) {
        console.error(`❌ [MASTER_AWS] erro em ${clientId}:`, err?.message);
        results.push({ clientId, ok: false, error: err?.message });
      }
    }

    return new Response(JSON.stringify({ success: true, ativar, desativar, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ [MASTER_AWS] Erro:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
