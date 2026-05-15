import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';

const DAY_NAMES_MAP: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

function emptyProgramacao() {
  return {
    segunda: [] as Array<{ inicio: string; fim: string }>,
    terca: [] as Array<{ inicio: string; fim: string }>,
    quarta: [] as Array<{ inicio: string; fim: string }>,
    quinta: [] as Array<{ inicio: string; fim: string }>,
    sexta: [] as Array<{ inicio: string; fim: string }>,
    sabado: [] as Array<{ inicio: string; fim: string }>,
    domingo: [] as Array<{ inicio: string; fim: string }>,
  };
}

function trimSeconds(t: string) {
  if (!t) return t;
  const p = t.split(':');
  return p.length >= 2 ? `${p[0]}:${p[1]}` : t;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { pedido_id, video_id, clear } = await req.json();
    if (!pedido_id || !video_id) {
      return new Response(JSON.stringify({ error: 'pedido_id e video_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 [SCHEDULE_AWS] Iniciando envio de programação:', { pedido_id, video_id, clear });

    // 1. Pedido + slot
    const { data: pedidoVideo, error: pvError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        slot_position,
        is_active,
        selected_for_display,
        videos!inner ( id, nome, url ),
        pedidos!inner ( id, lista_predios )
      `)
      .eq('pedido_id', pedido_id)
      .eq('video_id', video_id)
      .maybeSingle();

    if (pvError || !pedidoVideo) {
      throw new Error(`pedido_video não encontrado: ${pvError?.message || 'no row'}`);
    }

    const lista: string[] = (pedidoVideo as any).pedidos?.lista_predios || [];
    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error('Pedido sem lista_predios');
    }

    // titulo = nome do arquivo no storage sem extensão (mesmo padrão do upload)
    const url: string = (pedidoVideo as any).videos.url;
    const storageFileName = url.split('/').pop() || (pedidoVideo as any).videos.nome;
    const titulo = storageFileName.replace(/\.[^/.]+$/, '');

    // 2. Programação
    let programacao = emptyProgramacao();
    if (!clear) {
      const { data: schedules } = await supabase
        .from('campaign_video_schedules')
        .select('id, campaign_schedule_rules ( days_of_week, start_time, end_time, is_active, is_all_day )')
        .eq('video_id', video_id)
        .eq('slot_position', (pedidoVideo as any).slot_position);

      const rules: any[] = [];
      (schedules || []).forEach((s: any) => {
        (s.campaign_schedule_rules || []).filter((r: any) => r.is_active).forEach((r: any) => rules.push(r));
      });

      rules.forEach((rule) => {
        const slot = {
          inicio: rule.is_all_day ? '00:00' : trimSeconds(rule.start_time),
          fim: rule.is_all_day ? '23:59' : trimSeconds(rule.end_time),
        };
        (rule.days_of_week || []).forEach((d: number) => {
          const day = DAY_NAMES_MAP[d];
          if (day) (programacao as any)[day].push(slot);
        });
      });
    }

    // 3. master / ativo
    const ativo = (pedidoVideo as any).is_active === true && (pedidoVideo as any).selected_for_display === true;
    let master = ativo;
    if (!master) {
      const { data: others } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('pedido_id', pedido_id)
        .eq('selected_for_display', true)
        .eq('is_active', true)
        .neq('id', (pedidoVideo as any).id)
        .limit(1);
      if (!others || others.length === 0) master = true;
    }

    const body = {
      id_pedido: pedido_id,
      programacao,
      ativo,
      master,
    };

    console.log('📦 [SCHEDULE_AWS] Payload:', JSON.stringify(body));

    // 4. Enviar para todos os prédios
    const results: any[] = [];
    for (const buildingUuid of lista) {
      const clientId = buildingUuid.replace(/-/g, '').substring(0, 4);
      const endpoint = `${EXTERNAL_API_BASE}/programacao/${clientId}/${encodeURIComponent(titulo)}`;
      console.log(`📤 [SCHEDULE_AWS] PUT ${endpoint}`);
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const text = await resp.text();
        console.log(`📥 [SCHEDULE_AWS] ${clientId} -> ${resp.status} ${text.substring(0, 200)}`);
        results.push({ clientId, status: resp.status, ok: resp.ok, body: text.substring(0, 200) });
      } catch (err: any) {
        console.error(`❌ [SCHEDULE_AWS] erro em ${clientId}:`, err?.message);
        results.push({ clientId, ok: false, error: err?.message });
      }
    }

    return new Response(JSON.stringify({ success: true, titulo, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ [SCHEDULE_AWS] Erro:', error?.message);
    return new Response(JSON.stringify({ success: false, error: error?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
