/**
 * EXA 2.0 — Playlist real de um prédio para a réplica da tela (área do anunciante).
 *
 * Lê a playlist que o player do prédio reportou (exa2_telas_saude.playlist, enviada pelo player v8)
 * e resolve cada título no vídeo real (pedido_videos + videos). Devolve a lista na ordem do painel:
 * todos os horizontais → 1 editorial (Notícias Brasil → Notícias Foz → Curiosidades, em rodízio) → 1 vertical premium.
 *
 * Acesso: cliente com pedido que inclui o prédio (ou admin). Os vídeos já são públicos nas telas;
 * aqui só se devolve título, URL, orientação e duração (nada de cliente, valor ou contrato).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const EDITORIAL = /^(noticias|curiosidades)\b/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const buildingId = String(body.building_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(buildingId)) return json({ ok: false, error: 'building_id inválido' }, 400);

    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ ok: false, error: 'unauthorized' }, 401);
    const { data: papeis } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
    const ehAdmin = (papeis || []).some((r: any) => ['admin', 'super_admin', 'comercial'].includes(String(r.role)));
    const { data: meus } = await admin.from('pedidos').select('id, lista_predios').eq('client_id', u.user.id);
    const meusIds = new Set((meus || []).map((p: any) => String(p.id)));
    if (!ehAdmin && !(meus || []).some((p: any) => (p.lista_predios || []).map(String).includes(buildingId))) return json({ ok: false, error: 'forbidden' }, 403);

    const { data: saude } = await admin.from('exa2_telas_saude').select('playlist, sinal_em, status').eq('building_id', buildingId).limit(1).maybeSingle();
    const lista: any[] = Array.isArray(saude?.playlist) ? saude!.playlist : [];
    if (!lista.length) return json({ ok: true, itens: [], fonte: 'sem_playlist' });

    const pedIds = [...new Set(lista.map((e) => String(e.id_pedido || '')).filter(Boolean))];
    const { data: pvs } = await admin.from('pedido_videos').select('pedido_id, videos!inner(nome, url, orientacao, duracao)').in('pedido_id', pedIds);
    const porPedido = new Map<string, any[]>();
    for (const pv of pvs || []) { const k = String((pv as any).pedido_id); porPedido.set(k, [...(porPedido.get(k) || []), (pv as any).videos]); }

    const itens = lista.map((e) => {
      const vs = porPedido.get(String(e.id_pedido)) || [];
      const t = norm(e.titulo);
      const v = vs.find((x) => norm(x.nome) === t) || vs.find((x) => norm(x.url).includes(t.replace(/\s+/g, '_')) || norm(x.url).includes(t));
      if (!v?.url) return null;
      const vertical = String(v.orientacao || '').startsWith('vert');
      const editorial = EDITORIAL.test(t);
      return {
        titulo: String(e.titulo || v.nome || '').trim(),
        url: v.url,
        vertical,
        tipo: editorial ? 'editorial' : vertical ? 'vertical' : 'anuncio',
        duracao: Number(v.duracao) || (editorial ? 50 : vertical ? 15 : 10),
        origem: e.origem || null,
        seu: meusIds.has(String(e.id_pedido)),
      };
    }).filter(Boolean) as any[];

    // Ordem do painel: horizontais → 1 editorial (rodízio) → 1 vertical (rodízio). Devolve um ciclo
    // longo o bastante para passar por todos os editoriais e verticais.
    const hor = itens.filter((i) => i.tipo === 'anuncio');
    const ord = ['noticias brasil', 'noticias foz', 'curiosidades'];
    const edi = itens.filter((i) => i.tipo === 'editorial').sort((a, b) => ord.findIndex((o) => norm(a.titulo).startsWith(o)) - ord.findIndex((o) => norm(b.titulo).startsWith(o)));
    const ver = itens.filter((i) => i.tipo === 'vertical');
    const voltas = Math.max(1, edi.length, ver.length);
    const ciclo: any[] = [];
    for (let k = 0; k < voltas; k++) {
      ciclo.push(...hor);
      if (edi.length) ciclo.push(edi[k % edi.length]);
      if (ver.length) ciclo.push(ver[k % ver.length]);
    }
    return json({ ok: true, itens: ciclo, sinal_em: saude?.sinal_em || null, status: saude?.status || null });
  } catch (e) {
    console.error('exa2-replica-playlist', e);
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
