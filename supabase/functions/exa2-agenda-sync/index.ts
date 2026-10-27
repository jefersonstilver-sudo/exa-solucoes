/**
 * EXA 2.0 — Sincronizador da agenda do pedido com os painéis (API externa / AWS).
 *
 * Regra de ouro: A TELA OBEDECE AO SISTEMA, venha a mudança de onde vier (site, Sofia, admin, banco).
 * Por isso este sincronizador RECONCILIA: compara o estado desejado (banco do site) com o estado real
 * de cada tela (manifesto do prédio no ExaSistema, o mesmo que o NUC baixa) e corrige só o que diverge:
 *   1. ARQUIVO  — vídeo principal ou com programação que não está no manifesto da tela -> reenvia o arquivo
 *   2. MASTER   — o principal do pedido na tela é diferente do principal do site -> PATCH /master
 *   3. PROGRAMA — a programação da tela é diferente da agenda efetiva -> PUT /programacao
 *
 * Agenda efetiva: janela móvel de 7 dias, mesmas regras do app (override > data > semanal; empate = a
 * instrução mais recente; principal como fallback). Cada dia da semana = 1 data da janela.
 *
 * Quem chama: o app e a Sofia (na hora da mudança), o gatilho do banco (qualquer mudança em vídeos ou
 * programação de um pedido) e o cron a cada 5 min (rede de segurança para todos os pedidos).
 * Se o manifesto não puder ser lido, cai no modo antigo (envia programação só quando o hash muda).
 *
 * Segurança / custo:
 *  - Só envia o que diverge. Sem divergência, nenhuma chamada à API das telas.
 *  - Reenvio de arquivo no máx. 1x a cada 15 min por vídeo (registrado em exa2_alertas_entrega, tipo 'reenvio').
 *  - dry_run = true calcula e mostra o que faria, sem tocar em nenhum painel.
 *  - Cron/gatilho autenticam por token guardado no banco; app autentica com o JWT do usuário.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa2-cron',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

import { agendaDoPedido, agoraBrasilia, programacaoLegada, stableProg as stable, ymd, DIAS, emptyProg } from '../_shared/exa2-agenda.ts';
async function sha(s: string) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
const normT = (t: unknown) => String(t ?? '').replace(/\.[^/.]+$/, '').normalize('NFC').trim().toLowerCase();
const telaDe = (b: unknown) => String(b).replace(/-/g, '').substring(0, 4);
const progDoManifesto = (p: any) => { const o = emptyProg(); for (const d of DIAS) o[d] = Array.isArray(p?.[d]) ? p[d].map((f: any) => ({ inicio: String(f?.inicio || '').slice(0, 5), fim: String(f?.fim || '').slice(0, 5) })) : []; return o; };

async function chamarFuncao(nome: string, body: unknown) {
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${nome}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }, body: JSON.stringify(body),
  });
  const j: any = await r.json().catch(() => ({}));
  return { ok: r.ok && j?.success !== false && !(j?.failed_buildings || []).length, resposta: j };
}

// ---------------- handler ----------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dry_run;
    const force = !!body.force;
    let pedidoIds: string[] | null = Array.isArray(body.pedido_ids) ? body.pedido_ids : body.pedido_id ? [body.pedido_id] : null;

    // --- autenticação: cron/gatilho (token no banco) ou usuário (JWT) ---
    const cronToken = req.headers.get('x-exa2-cron');
    let origem = 'app';
    if (cronToken) {
      const { data: cfg } = await admin.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
      if (!cfg?.valor || cfg.valor !== cronToken) return json({ success: false, error: 'unauthorized' }, 401);
      origem = body.origem === 'gatilho' ? 'gatilho' : 'cron';
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

    // --- estado REAL das telas: manifesto de cada prédio envolvido (uma leitura por rodada) ---
    const telasEnvolvidas = [...new Set((pedidos || []).flatMap((p: any) => (Array.isArray(p.lista_predios) ? p.lista_predios : []).map(telaDe)))];
    const manifestoPor = new Map<string, any[]>();
    let manifestoOk = false;
    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    if (exaKey && telasEnvolvidas.length) {
      try {
        const telas = createClient(EXASISTEMA_URL, exaKey);
        const { data: mans, error: me } = await telas.from('updates_clientes').select('cliente_id, json_data').in('cliente_id', telasEnvolvidas);
        if (me) throw me;
        for (const m of mans || []) manifestoPor.set(m.cliente_id, Array.isArray(m.json_data?.Propagandas) ? m.json_data.Propagandas : []);
        manifestoOk = true;
      } catch (e: any) { console.error('[exa2-agenda-sync] manifesto ilegível, modo hash', e?.message); }
    }

    const nowBrt = agoraBrasilia();
    const relatorio: any[] = [];
    const correcoes: any[] = [];

    for (const ped of pedidos || []) {
      const lista: string[] = Array.isArray(ped.lista_predios) ? ped.lista_predios : [];
      const { slots, rules, efetivaPorSlot: efetiva } = await agendaDoPedido(admin, ped.id);
      const { data: estados } = await admin.from('exa2_agenda_sync_estado').select('*').eq('pedido_id', ped.id);
      const estadoPorVideo = new Map((estados || []).map((e: any) => [e.video_id, e]));
      const base = slots.find((x) => x.approved && x.is_base_video) || null;
      const itensNaTela = (tela: string) => (manifestoPor.get(tela) || []).filter((p: any) => String(p?.id_pedido) === String(ped.id) && p?.status !== 'deleted');

      // 1) ARQUIVO: principal e vídeos com programação precisam existir em cada tela do pedido
      // Só a rede de segurança (cron) reenvia arquivo, e só para vídeo aprovado há mais de 10 min:
      // o envio normal (site/Sofia) leva alguns minutos e não pode ser duplicado.
      let aprovadoRecente = new Set<string>();
      if (manifestoOk && origem === 'cron') {
        const { data: pv } = await admin.from('pedido_videos').select('id, approved_at, updated_at').eq('pedido_id', ped.id);
        aprovadoRecente = new Set((pv || []).filter((p: any) => Date.now() - new Date(p.approved_at || p.updated_at || 0).getTime() < 10 * 60000).map((p: any) => p.id));
      }
      if (manifestoOk && origem === 'cron') {
        const precisam =slots.filter((s) => s.approved && s.titulo && (s.is_base_video || rules.some((r) => r.slotId === s.id && r.is_active !== false)));
        for (const s of precisam) {
          if (aprovadoRecente.has(s.id)) continue;
          const faltaEm = lista.map(telaDe).filter((t) => manifestoPor.has(t) && !itensNaTela(t).some((p: any) => normT(p.titulo) === normT(s.titulo)));
          if (!faltaEm.length) continue;
          const item: any = { pedido_id: ped.id, tipo: 'arquivo', video: s.titulo, falta_em: faltaEm };
          if (!dryRun) {
            const { data: recente } = await admin.from('exa2_alertas_entrega').select('id').eq('tipo', 'reenvio').ilike('mensagem', `%${s.id}%`).gte('criado_em', new Date(Date.now() - 15 * 60000).toISOString()).limit(1);
            if ((recente || []).length) { item.aguardando = 'reenvio feito há menos de 15 min'; correcoes.push(item); continue; }
            const r = await chamarFuncao('upload-video-to-external-api', { pedido_video_id: s.id });
            item.ok = r.ok; if (!r.ok) item.erro = String(r.resposta?.error || r.resposta?.message || '').slice(0, 200);
            await admin.from('exa2_alertas_entrega').insert({ cliente_id: faltaEm[0], tipo: 'reenvio', mensagem: `Arquivo reenviado (${r.ok ? 'ok' : 'falhou'}): "${s.titulo}" [${s.id}] faltava em ${faltaEm.join(', ')}`, resolvido_em: new Date().toISOString() });
          }
          correcoes.push(item);
        }
      }

      // 2) MASTER: o principal na tela tem que ser o principal do site
      if (manifestoOk && base) {
        const divergentes: string[] = []; let desativar = '';
        for (const t of lista.map(telaDe)) {
          const itens = itensNaTela(t); if (!itens.length) continue;
          if (!itens.some((p: any) => normT(p.titulo) === normT(base.titulo))) continue; // arquivo ainda não chegou: o passo 1 cuida
          const masters = itens.filter((p: any) => p.master === true || p.master === 'true');
          const certo = masters.length === 1 && normT(masters[0].titulo) === normT(base.titulo);
          if (!certo) { divergentes.push(t); const errado = masters.find((p: any) => normT(p.titulo) !== normT(base.titulo)); if (errado && !desativar) desativar = String(errado.titulo); }
        }
        if (divergentes.length || (force && origem === 'app')) {
          const item: any = { pedido_id: ped.id, tipo: 'master', principal: base.titulo, divergente_em: divergentes };
          if (!dryRun && divergentes.length) { const r = await chamarFuncao('update-video-master-aws', { pedido_id: ped.id, ativar_titulo: base.titulo, desativar_titulo: desativar }); item.ok = r.ok; if (!r.ok) item.erro = String(r.resposta?.error || JSON.stringify(r.resposta?.failed_buildings || '')).slice(0, 200); }
          correcoes.push(item);
        }
      }

      // 3) PROGRAMA: cada vídeo (não principal) com a programação efetiva
      for (const s of slots.filter((x) => x.approved && !x.is_base_video)) {
        const temRegra = rules.some((r) => r.slotId === s.id);
        const anterior = estadoPorVideo.get(s.videoId);
        const naTela = manifestoOk && lista.map(telaDe).some((t) => itensNaTela(t).some((p: any) => normT(p.titulo) === normT(s.titulo)));
        if (!temRegra && !anterior && !naTela) continue; // nunca teve agenda e nem está na tela: nada a fazer
        const prog = efetiva.get(s.id)!;
        const hash = await sha(stable(prog));
        const legado = programacaoLegada(rules.filter((r) => r.slotId === s.id));
        // telas onde a programação diverge (com manifesto) ou todas, quando o hash mudou (sem manifesto)
        let alvo: string[];
        if (manifestoOk) {
          alvo = lista.filter((b) => {
            const it = itensNaTela(telaDe(b)).find((p: any) => normT(p.titulo) === normT(s.titulo));
            return it && (force || stable(progDoManifesto(it.programacao)) !== stable(prog));
          });
          // trava anti-laço: se já enviamos ESTA programação há menos de 30 min e a tela ainda "difere"
          // (ex.: formato diferente no manifesto), não reenvia a cada 5 min — evita a tela sincronizar à toa
          const recente = anterior?.payload_hash === hash && anterior?.sincronizado_em && Date.now() - new Date(anterior.sincronizado_em).getTime() < 30 * 60000;
          if (alvo.length && recente && !force && origem !== 'app') alvo = [];
        } else {
          alvo = force || anterior?.payload_hash !== hash ? lista : [];
        }
        const item: any = { pedido_id: ped.id, tipo: 'programa', video: s.titulo, igual_ao_legado: stable(prog) === stable(legado), mudou: alvo.length > 0, telas_divergentes: alvo.map(telaDe), programacao: prog };

        if (!dryRun && alvo.length) {
          if (!s.titulo) { item.erro = 'sem título'; relatorio.push(item); continue; }
          const results: any[] = [];
          for (const b of alvo) {
            const tela = telaDe(b);
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
          await admin.from('exa2_agenda_sync_estado').upsert({
            pedido_id: ped.id, video_id: s.videoId, titulo: s.titulo, payload: prog,
            payload_hash: falhas.length ? (anterior?.payload_hash || null) : hash,
            status: falhas.length ? 'falha_parcial' : 'aceito_pela_api',
            ultimo_resultado: results, sincronizado_em: new Date().toISOString(), origem,
          }, { onConflict: 'pedido_id,video_id' });
        } else if (!dryRun && manifestoOk && !alvo.length && anterior?.payload_hash !== hash) {
          // tela já está certa: só atualiza o registro (sem chamar a API)
          await admin.from('exa2_agenda_sync_estado').upsert({ pedido_id: ped.id, video_id: s.videoId, titulo: s.titulo, payload: prog, payload_hash: hash, status: 'aceito_pela_api', sincronizado_em: new Date().toISOString(), origem }, { onConflict: 'pedido_id,video_id' });
        }
        if (item.mudou || !manifestoOk) relatorio.push(item);
      }
    }

    return json({
      success: true,
      dry_run: dryRun,
      origem,
      modo: manifestoOk ? 'reconciliacao_com_manifesto' : 'hash',
      janela: { de: ymd(nowBrt), ate: ymd(new Date(nowBrt.getTime() + 6 * 864e5)) },
      pedidos: (pedidos || []).length,
      correcoes,
      videos_enviados: relatorio.filter((r) => r.telas).length,
      itens: relatorio,
    });
  } catch (e: any) {
    console.error('[exa2-agenda-sync] erro', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});
