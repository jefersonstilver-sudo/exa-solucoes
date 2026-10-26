/**
 * EXA 2.0 — Sincronizador da agenda do pedido com os painéis (API externa / AWS).
 *
 * Problema que resolve: a API dos painéis (PUT /programacao/{tela}/{titulo}) só entende
 * "dia da semana + horário" — não tem data. O player do NUC repete a semana em ciclo.
 *
 * Solução: janela móvel de 7 dias. Para cada pedido, calcula o vencedor de cada minuto dos
 * próximos 7 dias (mesmas regras do app: 1 vídeo por vez, principal como fallback,
 * override > data > semanal) e envia para cada vídeo SÓ as janelas em que ele vence.
 * Cada dia da semana corresponde a exatamente 1 data dentro da janela, então "data" vira
 * "dia da semana" sem ambiguidade, e sai sozinha depois que passa (cron re-sincroniza).
 *
 * Segurança / custo:
 *  - Só envia quando o resultado calculado muda (hash em exa2_agenda_sync_estado).
 *  - dry_run = true calcula e compara com o formato legado, sem tocar em nenhum painel.
 *  - Não altera master/vídeo principal (isso continua com update-video-master-aws).
 *  - Cron autentica por token guardado no banco (sem chave do Supabase em comando de cron).
 *  - App autentica com o JWT do usuário: só sincroniza pedido do próprio cliente (ou admin).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa2-cron',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

import { agendaDoPedido, agoraBrasilia, programacaoLegada, stableProg as stable, ymd } from '../_shared/exa2-agenda.ts';
async function sha(s: string) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''); }

// ---------------- handler ----------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dry_run;
    const force = !!body.force;
    let pedidoIds: string[] | null = Array.isArray(body.pedido_ids) ? body.pedido_ids : body.pedido_id ? [body.pedido_id] : null;

    // --- autenticação: cron (token no banco) ou usuário (JWT) ---
    const cronToken = req.headers.get('x-exa2-cron');
    let origem = 'app';
    if (cronToken) {
      const { data: cfg } = await admin.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
      if (!cfg?.valor || cfg.valor !== cronToken) return json({ success: false, error: 'unauthorized' }, 401);
      origem = 'cron';
    } else {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await admin.auth.getUser(jwt);
      if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
      if (!pedidoIds?.length) return json({ success: false, error: 'pedido_id obrigatório' }, 400);
      const { data: papeis } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
      const ehAdmin = (papeis || []).some((r: any) => ['admin', 'super_admin'].includes(String(r.role)));
      if (!ehAdmin) {
        const { data: own } = await admin.from('pedidos').select('id').in('id', pedidoIds).eq('client_id', u.user.id);
        if ((own || []).length !== pedidoIds.length) return json({ success: false, error: 'forbidden' }, 403);
      }
    }

    // --- pedidos alvo ---
    let q = admin.from('pedidos').select('id, lista_predios, status').in('status', ['ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado', 'aguardando_video']);
    if (pedidoIds?.length) q = q.in('id', pedidoIds);
    const { data: pedidos, error: pe } = await q;
    if (pe) throw pe;

    const nowBrt = agoraBrasilia();
    const relatorio: any[] = [];

    for (const ped of pedidos || []) {
      const lista: string[] = Array.isArray(ped.lista_predios) ? ped.lista_predios : [];
      const { slots, rules, efetivaPorSlot: efetiva } = await agendaDoPedido(admin, ped.id);
      const { data: estados } = await admin.from('exa2_agenda_sync_estado').select('*').eq('pedido_id', ped.id);
      const estadoPorVideo = new Map((estados || []).map((e: any) => [e.video_id, e]));

      for (const s of slots.filter((x) => x.approved && !x.is_base_video)) {
        const temRegra = rules.some((r) => r.slotId === s.id);
        const anterior = estadoPorVideo.get(s.videoId);
        if (!temRegra && !anterior) continue; // nunca teve agenda: nada a fazer
        const prog = efetiva.get(s.id)!;
        const hash = await sha(stable(prog));
        const legado = programacaoLegada(rules.filter((r) => r.slotId === s.id));
        const item: any = { pedido_id: ped.id, video: s.titulo, igual_ao_legado: stable(prog) === stable(legado), mudou: force || anterior?.payload_hash !== hash, programacao: prog };
        if (!item.igual_ao_legado) item.legado = legado;

        if (!dryRun && item.mudou) {
          if (!s.titulo || !lista.length) { item.erro = 'sem título ou sem prédios'; relatorio.push(item); continue; }
          const results: any[] = [];
          for (const b of lista) {
            const tela = String(b).replace(/-/g, '').substring(0, 4);
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 20000);
              const resp = await fetch(`${EXTERNAL_API_BASE}/programacao/${tela}/${encodeURIComponent(s.titulo)}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_pedido: ped.id, programacao: prog }), signal: ctrl.signal,
              });
              clearTimeout(t);
              const txt = await resp.text();
              let task: string | null = null;
              try { const j = JSON.parse(txt); task = j?.task_id || j?.taskId || j?.id || null; } catch { /* texto */ }
              results.push({ tela, ok: resp.ok, status: resp.status, task });
            } catch (e: any) {
              results.push({ tela, ok: false, erro: e?.message });
            }
          }
          const falhas = results.filter((r) => !r.ok);
          item.telas = results.length;
          item.falhas = falhas.length;
          // Só grava o hash quando TODAS as telas aceitaram — senão tenta de novo na próxima rodada.
          await admin.from('exa2_agenda_sync_estado').upsert({
            pedido_id: ped.id,
            video_id: s.videoId,
            titulo: s.titulo,
            payload: prog,
            payload_hash: falhas.length ? (anterior?.payload_hash || null) : hash,
            status: falhas.length ? 'falha_parcial' : 'aceito_pela_api',
            ultimo_resultado: results,
            sincronizado_em: new Date().toISOString(),
            origem,
          }, { onConflict: 'pedido_id,video_id' });
        }
        relatorio.push(item);
      }
    }

    return json({
      success: true,
      dry_run: dryRun,
      origem,
      janela: { de: ymd(nowBrt), ate: ymd(new Date(nowBrt.getTime() + 6 * 864e5)) },
      pedidos: (pedidos || []).length,
      videos_avaliados: relatorio.length,
      videos_enviados: relatorio.filter((r) => r.telas).length,
      diferentes_do_legado: relatorio.filter((r) => !r.igual_ao_legado).length,
      itens: relatorio,
    });
  } catch (e: any) {
    console.error('[exa2-agenda-sync] erro', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});
