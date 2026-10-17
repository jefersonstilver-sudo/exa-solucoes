import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkAwsClient, summarizeMasterResults } from "../_shared/aws-master.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';

function stripExt(s: string | null | undefined) {
  return (s || '').replace(/\.[^/.]+$/, '');
}

function extractTaskId(raw: string): string | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    return j?.task_id || j?.taskId || j?.id || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));

    // ---- MODO PROXY: consultar status de tasks da fila AWS ----
    // (o front está em HTTPS e não pode chamar http://18.228.252.149:8000 direto)
    if (payload?.action === 'check_status') {
      const task_ids: string[] = Array.isArray(payload.task_ids) ? payload.task_ids : [];
      if (task_ids.length === 0) {
        return new Response(JSON.stringify({ statuses: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const statuses = await Promise.all(
        task_ids.map(async (task_id: string) => {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 8000);
            const resp = await fetch(
              `${EXTERNAL_API_BASE}/status/${encodeURIComponent(task_id)}`,
              { method: 'GET', signal: ctrl.signal },
            );
            clearTimeout(timer);
            const text = await resp.text();
            let status = 'unknown';
            try {
              const j = JSON.parse(text);
              const s = String(j?.status || '').toLowerCase();
              if (['queued', 'processing', 'completed', 'failed'].includes(s)) status = s;
            } catch { /* keep unknown */ }
            return { task_id, http_status: resp.status, status };
          } catch (err: any) {
            return { task_id, status: 'unknown', error: err?.message };
          }
        }),
      );
      return new Response(JSON.stringify({ statuses }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- MODO PADRÃO: PATCH /master em cada prédio ----
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { pedido_id, ativar_titulo, desativar_titulo } = payload;
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
    const task_ids: string[] = [];
    for (const buildingUuid of [...new Set(lista)]) {
      const clientId = buildingUuid.replace(/-/g, '').substring(0, 4);
      const endpoint = `${EXTERNAL_API_BASE}/master/${clientId}`;
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
        const task_id = extractTaskId(text);
        if (task_id) task_ids.push(task_id);
        console.log(`📥 [MASTER_AWS] ${clientId} -> ${resp.status} task_id=${task_id || 'n/a'} ${text.substring(0, 200)}`);
        results.push({ building_id: buildingUuid, clientId, status: resp.status, ok: resp.ok, task_id, body: text.substring(0, 200) });
      } catch (err: any) {
        console.error(`❌ [MASTER_AWS] erro em ${clientId}:`, err?.message);
        results.push({ building_id: buildingUuid, clientId, ok: false, error: err?.message });
      }
    }

    // Classify failed buildings: missing AWS client vs. real failure.
    for (const r of results.filter((x) => !x.ok)) {
      r.presence = (await checkAwsClient(r.clientId)).presence;
    }
    const summary = summarizeMasterResults(results);
    const failed = results.filter((r) => !r.ok && r.presence !== 'missing');
    const missing = results.filter((r) => r.presence === 'missing');

    const source = typeof payload.source === 'string' ? payload.source.slice(0, 60) : 'update-video-master-aws';
    const logs = [
      ...failed.map((r) => ({
        pedido_id, building_id: r.building_id, video_name: ativar, action: 'master_update', status: 'error', source,
        aws_response: { client_id: r.clientId, http_status: r.status ?? null, body: r.body ?? null, ativar, desativar },
        error_message: r.error || `PATCH /master/${r.clientId} retornou HTTP ${r.status}`,
      })),
      ...missing.map((r) => ({
        pedido_id, building_id: r.building_id, video_name: ativar, action: 'master_update', status: 'warning', source,
        aws_response: { client_id: r.clientId, ativar, desativar },
        error_message: `Prédio sem cliente na AWS (${r.clientId})`,
      })),
    ];
    if (logs.length === 0) {
      logs.push({ pedido_id, building_id: null, video_name: ativar, action: 'master_update', status: 'success', source,
        aws_response: { ativar, desativar, buildings: results.length, task_ids }, error_message: null } as any);
    }
    const { error: logErr } = await supabase.from('api_sync_logs').insert(logs);
    if (logErr) console.warn('⚠️ [MASTER_AWS] falha ao gravar api_sync_logs:', logErr.message);

    const failedLabels = failed.map((r) => r.clientId);
    return new Response(JSON.stringify({
      success: summary.success,
      ativar, desativar, task_ids, results,
      failed_buildings: failed.map((r) => ({ building_id: r.building_id, client_id: r.clientId, status: r.status ?? null, error: r.error ?? null })),
      missing_clients: missing.map((r) => ({ building_id: r.building_id, client_id: r.clientId })),
      error: summary.success ? null : `PATCH /master falhou em ${failed.length} de ${results.length} prédio(s): ${failedLabels.join(', ')}`,
    }), {
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
