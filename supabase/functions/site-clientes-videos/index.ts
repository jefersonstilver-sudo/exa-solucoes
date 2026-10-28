/**
 * Site público — "Alguns dos nossos clientes": os vídeos REAIS que estão no ar nos pedidos ativos.
 * Público (sem login), somente leitura, 1 vídeo por cliente (o principal do pedido), sem dados pessoais:
 * devolve só nome da empresa, segmento e o link do vídeo. Cache de 1 h.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: pedidos, error } = await db.from('pedidos')
      .select('id, client_id, data_fim, created_at')
      .in('status', ['ativo', 'video_aprovado'])
      .not('is_master', 'is', true)
      .not('is_test_order', 'is', true)
      .or(`data_fim.is.null,data_fim.gte.${hoje}`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    const ids = (pedidos || []).map((p) => p.id);
    if (!ids.length) return resposta([]);

    const { data: pvs } = await db.from('pedido_videos')
      .select('pedido_id, video_id, is_base_video, is_active, selected_for_display, approval_status, updated_at')
      .in('pedido_id', ids)
      .eq('approval_status', 'approved');
    const { data: vids } = await db.from('videos')
      .select('id, url, nome, orientacao')
      .in('id', [...new Set((pvs || []).map((v) => v.video_id))]);
    const clientes = [...new Set((pedidos || []).map((p) => p.client_id))];
    const { data: users } = await db.from('users').select('id, empresa_nome, nome, empresa_segmento').in('id', clientes);

    const vPorId = new Map((vids || []).map((v) => [v.id, v]));
    const uPorId = new Map((users || []).map((u) => [u.id, u]));
    const visto = new Set<string>();
    const out: { nome: string; segmento: string | null; video: string }[] = [];
    for (const p of pedidos || []) {
      if (visto.has(p.client_id)) continue;
      const doPedido = (pvs || []).filter((v) => v.pedido_id === p.id)
        .sort((a, b) => Number(b.is_base_video) - Number(a.is_base_video) || Number(b.is_active) - Number(a.is_active) || Number(b.selected_for_display) - Number(a.selected_for_display));
      const v = doPedido.map((x) => vPorId.get(x.video_id)).find((x) => x?.url && x.orientacao !== 'vertical');
      const u = uPorId.get(p.client_id);
      const nome = (u?.empresa_nome || '').trim();
      if (!v || !nome || /exa|indexa|teste/i.test(nome)) continue;
      visto.add(p.client_id);
      out.push({ nome, segmento: u?.empresa_segmento || null, video: v.url });
      if (out.length >= 16) break;
    }
    return resposta(out);
  } catch (e) {
    console.error('[site-clientes-videos]', (e as Error).message);
    return new Response(JSON.stringify({ clientes: [] }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});

function resposta(clientes: unknown[]) {
  return new Response(JSON.stringify({ clientes }), {
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  });
}
