/**
 * EXA 2.0 — Limpeza de vídeos ÓRFÃOS nas telas (04/11/2026).
 *
 * Problema que motivou: o Du Quintal foi suspenso, mas continuou passando. A suspensão tira das telas só os vídeos
 * que ESTÃO no pedido; vídeos que saíram do pedido antes (trocados, apagados pelo banco) nunca foram tirados das telas
 * e seguiam com programação no manifesto (updates_clientes do ExaSistema). Também havia vídeo de um cliente gravado
 * dentro do pedido de outro (ex.: "duquinbtal" no pedido da Caliu).
 *
 * Regra de órfão: item do manifesto (status != deleted) cujo pedido não existe, não está ativo, ou cujo título não é
 * de nenhum vídeo APROVADO do próprio pedido. Telas internas (bancada, tablet comercial, tela de teste) ficam de fora.
 *
 * Uso (só super_admin logado ou cron com x-exa2-cron):
 *   { "dry_run": true }                    -> lista o que seria removido
 *   { "dry_run": false, "telas": ["0077"]} -> remove só nessas telas (sem "telas": remove em todas)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa2-cron' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const AWS = 'http://18.228.252.149:8000';
const ATIVOS = ['ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado', 'aguardando_video'];
const INTERNAS = ['2904', '1110', '1234'];
const normT = (t: unknown) => String(t ?? '').replace(/\.[^/.]+$/, '').normalize('NFC').trim().toLowerCase();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const main = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const soTelas: string[] | null = Array.isArray(body.telas) && body.telas.length ? body.telas.map(String) : null;

    // --- autenticação ---
    const cronTok = req.headers.get('x-exa2-cron');
    const { data: cfg } = await main.from('exa2_config').select('chave, valor').in('chave', ['cron_token', 'aws_api_key']);
    const cfgv = (k: string) => String((cfg || []).find((x: any) => x.chave === k)?.valor || '');
    if (cronTok) {
      if (!cfgv('cron_token') || cfgv('cron_token') !== cronTok) return json({ success: false, error: 'unauthorized' }, 401);
    } else {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await main.auth.getUser(jwt);
      if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
      const { data: papeis } = await main.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((r: any) => r.role === 'super_admin')) return json({ success: false, error: 'forbidden' }, 403);
    }

    // --- manifesto real das telas ---
    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    if (!exaKey) return json({ success: false, error: 'EXASISTEMA_SERVICE_KEY ausente' }, 500);
    const telasDb = createClient(EXASISTEMA_URL, exaKey);
    const { data: mans, error: me } = await telasDb.from('updates_clientes').select('cliente_id, json_data');
    if (me) throw me;

    const itens: any[] = [];
    for (const m of mans || []) {
      const tela = String(m.cliente_id);
      if (INTERNAS.includes(tela) || (soTelas && !soTelas.includes(tela))) continue;
      for (const p of (Array.isArray(m.json_data?.Propagandas) ? m.json_data.Propagandas : [])) {
        if (p?.status === 'deleted') continue;
        const prog = p?.programacao && Object.values(p.programacao).some((v: any) => Array.isArray(v) && v.length);
        itens.push({ tela, predio: m.json_data?.ScreenName || '', pedido: String(p?.id_pedido || ''), titulo: String(p?.titulo || ''), arquivo: String(p?.video || '').split('/').pop(), master: !!p?.master, programado: !!prog });
      }
    }

    // --- pedidos e vídeos aprovados ---
    const ids = [...new Set(itens.map((i) => i.pedido).filter((x) => /^[0-9a-f-]{36}$/i.test(x)))];
    const { data: peds } = ids.length ? await main.from('pedidos').select('id, status, client_name').in('id', ids) : { data: [] as any[] };
    const pedPor = new Map((peds || []).map((p: any) => [String(p.id), p]));
    const { data: pvs } = ids.length ? await main.from('pedido_videos').select('pedido_id, videos(nome)').in('pedido_id', ids).eq('approval_status', 'approved') : { data: [] as any[] };
    const titulosPor = new Map<string, Set<string>>();
    for (const pv of pvs || []) { const k = String(pv.pedido_id); if (!titulosPor.has(k)) titulosPor.set(k, new Set()); titulosPor.get(k)!.add(normT((pv as any).videos?.nome)); }

    const orfaos = itens.filter((i) => {
      const p: any = pedPor.get(i.pedido);
      if (!p) return true;
      if (!ATIVOS.includes(String(p.status))) return true;
      return !titulosPor.get(i.pedido)?.has(normT(i.titulo));
    }).map((i) => {
      const p: any = pedPor.get(i.pedido);
      return { ...i, cliente: p?.client_name || null, status_pedido: p?.status || 'inexistente', motivo: !p ? 'pedido inexistente' : !ATIVOS.includes(String(p.status)) ? 'pedido ' + p.status : 'video fora do pedido' };
    });

    // --- remoção ---
    const resultados: any[] = [];
    if (!dryRun) {
      const chave = cfgv('aws_api_key');
      for (let k = 0; k < orfaos.length; k += 6) {
        await Promise.all(orfaos.slice(k, k + 6).map(async (o) => {
          try {
            const fd = new FormData(); fd.append('video_name', o.arquivo);
            const r = await fetch(`${AWS}/propagandas/admin/delete-propaganda/${o.tela}`, { method: 'DELETE', headers: chave ? { 'x-exa-key': chave } : {}, body: fd, signal: AbortSignal.timeout(20000) });
            resultados.push({ tela: o.tela, titulo: o.titulo, ok: r.ok, status: r.status, resp: r.ok ? undefined : (await r.text()).slice(0, 160) });
          } catch (e: any) { resultados.push({ tela: o.tela, titulo: o.titulo, ok: false, erro: String(e?.message || e).slice(0, 160) }); }
        }));
      }
      try { await main.from('log_eventos_sistema').insert({ tipo_evento: 'EXA2_LIMPEZA_ORFAOS', descricao: JSON.stringify({ removidos: resultados.filter((r) => r.ok).length, falhas: resultados.filter((r) => !r.ok).length, itens: orfaos.map((o) => `${o.tela}:${o.titulo}`) }).slice(0, 4000) }); } catch (_) { /* log opcional */ }
    }

    return json({ success: true, dry_run: dryRun, total_itens: itens.length, orfaos: orfaos.length, tocando: orfaos.filter((o) => o.programado || o.master).length, lista: orfaos, resultados });
  } catch (e: any) {
    return json({ success: false, error: String(e?.message || e) }, 500);
  }
});
