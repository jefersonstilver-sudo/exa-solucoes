// Reconcilia o estado do nosso banco com a API externa.
// Estratégia LEVE — apenas metadata:
//   1) PATCH /master/{client_id}  → garante master:true no vídeo base e
//      master:false em todos os outros aprovados do pedido.
//   2) PUT /programacao/{client_id}/{titulo} → envia a programação atual de
//      cada vídeo (master sempre vazia; demais conforme regras ativas no banco).
//
// NÃO faz re-upload de arquivos. Só atualiza metadata na API externa.
//
// Body opcional: { pedido_id?: string }  → reconcilia somente esse pedido.
// Sem body → reconcilia todos os pedidos com status 'ativo' ou 'video_aprovado'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function stripExt(s: string | null | undefined) {
  return (s || '').replace(/\.[^/.]+$/, '').trim();
}

async function invokeFn(name: string, body: any) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: resp.ok, status: resp.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    let onlyPedidoId: string | null = null;
    try {
      const body = await req.json();
      onlyPedidoId = body?.pedido_id || null;
    } catch { /* sem body */ }

    // 1) Pedidos a reconciliar
    let q = supabase
      .from('pedidos')
      .select('id, lista_predios, status, is_master')
      .in('status', ['ativo', 'video_aprovado']);
    if (onlyPedidoId) q = q.eq('id', onlyPedidoId);

    const { data: pedidos, error: pErr } = await q;
    if (pErr) throw pErr;

    if (!pedidos || pedidos.length === 0) {
      return new Response(
        JSON.stringify({ success: true, total: 0, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`🔄 [RECONCILE] ${pedidos.length} pedido(s) para reconciliar`);

    const results: any[] = [];

    for (const pedido of pedidos) {
      const pedidoResult: any = {
        pedido_id: pedido.id,
        master_swaps: [],
        schedule_pushes: [],
        errors: [] as string[],
      };

      try {
        const lista: string[] = (pedido as any).lista_predios || [];
        if (lista.length === 0) {
          pedidoResult.skipped = 'sem lista_predios';
          results.push(pedidoResult);
          continue;
        }

        // 2) Vídeos aprovados do pedido
        const { data: pvs, error: pvErr } = await supabase
          .from('pedido_videos')
          .select('id, video_id, is_base_video, slot_position, videos(nome)')
          .eq('pedido_id', pedido.id)
          .eq('approval_status', 'approved')
          .not('video_id', 'is', null);

        if (pvErr) throw pvErr;
        if (!pvs || pvs.length === 0) {
          pedidoResult.skipped = 'sem vídeos aprovados';
          results.push(pedidoResult);
          continue;
        }

        const masterPv = pvs.find((p: any) => p.is_base_video);
        const masterTitulo = masterPv
          ? stripExt((masterPv as any).videos?.nome)
          : null;
        const nonMasters = pvs.filter((p: any) => !p.is_base_video);

        // 3) PATCH /master — garantir master:true no base
        if (masterTitulo) {
          if (nonMasters.length === 0) {
            // Apenas ativar
            const r = await invokeFn('update-video-master-aws', {
              pedido_id: pedido.id,
              ativar_titulo: masterTitulo,
              desativar_titulo: null,
            });
            pedidoResult.master_swaps.push({
              ativar: masterTitulo,
              desativar: null,
              ok: r.ok,
              status: r.status,
            });
            if (!r.ok) pedidoResult.errors.push(`master(only): ${JSON.stringify(r.data)}`);
          } else {
            // Para cada não-master, swap garantindo master no base e
            // forçando master:false naquele.
            for (const nm of nonMasters) {
              const nmTitulo = stripExt((nm as any).videos?.nome);
              if (!nmTitulo) continue;
              const r = await invokeFn('update-video-master-aws', {
                pedido_id: pedido.id,
                ativar_titulo: masterTitulo,
                desativar_titulo: nmTitulo,
              });
              pedidoResult.master_swaps.push({
                ativar: masterTitulo,
                desativar: nmTitulo,
                ok: r.ok,
                status: r.status,
              });
              if (!r.ok) pedidoResult.errors.push(`master(${nmTitulo}): ${JSON.stringify(r.data)}`);
            }
          }
        } else {
          pedidoResult.warnings = ['nenhum vídeo base (is_base_video=true)'];
        }

        // 4) PUT /programacao — uma chamada por vídeo aprovado
        for (const pv of pvs) {
          const isMaster = (pv as any).is_base_video === true;
          const r = await invokeFn('update-video-schedule-aws', {
            pedido_id: pedido.id,
            video_id: (pv as any).video_id,
            // Master nunca tem programação. Demais: a função busca regras
            // ativas do banco quando clear=false; se não houver, envia vazio.
            clear: isMaster,
          });
          pedidoResult.schedule_pushes.push({
            video_id: (pv as any).video_id,
            is_master: isMaster,
            ok: r.ok,
            status: r.status,
          });
          if (!r.ok) {
            pedidoResult.errors.push(
              `programacao(${(pv as any).video_id}): ${JSON.stringify(r.data)}`,
            );
          }
        }

        // 5) Log auditável
        await supabase.from('api_sync_logs').insert({
          pedido_id: pedido.id,
          action: 'reconcile',
          status: pedidoResult.errors.length === 0 ? 'success' : 'error',
          source: 'reconcile-external-api',
          aws_response: pedidoResult,
          error_message: pedidoResult.errors.length
            ? pedidoResult.errors.join(' | ').substring(0, 1000)
            : null,
        });
      } catch (err: any) {
        console.error(`❌ [RECONCILE] pedido ${pedido.id}:`, err?.message);
        pedidoResult.errors.push(err?.message || 'erro desconhecido');

        await supabase.from('api_sync_logs').insert({
          pedido_id: pedido.id,
          action: 'reconcile',
          status: 'error',
          source: 'reconcile-external-api',
          error_message: err?.message?.substring(0, 1000) || 'unknown',
        });
      }

      results.push(pedidoResult);
    }

    const totalErrors = results.reduce(
      (acc, r) => acc + (r.errors?.length || 0),
      0,
    );

    console.log(
      `✅ [RECONCILE] ${pedidos.length} pedido(s) processados. ${totalErrors} erro(s).`,
    );

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        total: pedidos.length,
        total_errors: totalErrors,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('❌ [RECONCILE] Erro fatal:', error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
