// Proxy HTTPS → HTTP para consultar o status de tasks da fila AWS
// (o front está em HTTPS e não pode chamar http://18.228.252.149:8000 direto)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';

type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'unknown';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_ids } = await req.json();
    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'task_ids (array) obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.all(
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
          let status: TaskStatus = 'unknown';
          try {
            const j = JSON.parse(text);
            const s = String(j?.status || '').toLowerCase();
            if (s === 'queued' || s === 'processing' || s === 'completed' || s === 'failed') {
              status = s as TaskStatus;
            }
          } catch { /* keep unknown */ }
          return { task_id, http_status: resp.status, status };
        } catch (err: any) {
          return { task_id, status: 'unknown' as TaskStatus, error: err?.message };
        }
      }),
    );

    return new Response(JSON.stringify({ statuses: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
