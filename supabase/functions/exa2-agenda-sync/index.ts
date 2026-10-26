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

// ---------------- motor de agenda (espelho de src/lib/agenda/agendaEngine.ts) ----------------
type RuleType = 'principal' | 'recorrente' | 'data';
interface Rule { id: string; slotId: string; rule_type?: string | null; days_of_week?: number[] | null; start_time?: string | null; end_time?: string | null; is_all_day?: boolean | null; is_active?: boolean | null; start_date?: string | null; end_date?: string | null; is_override?: boolean | null; }
interface Slot { id: string; videoId: string; slot_position: number; is_base_video: boolean; approved: boolean; titulo: string; }

const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (t?: string | null) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const endMin = (t?: string | null, s = 0) => { if (!t) return 1440; if (/^23:59/.test(t) || /^24:00/.test(t)) return 1440; const m = toMin(t); return m === 0 && s > 0 ? 1440 : m; };
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; // datas "BRT" representadas em UTC
const typeOf = (r: Rule): RuleType => (r.rule_type === 'data' || r.rule_type === 'principal' || r.rule_type === 'recorrente' ? r.rule_type : r.start_date ? 'data' : 'recorrente');
const inWindow = (r: Rule, m: number) => { if (r.is_all_day) return true; const s = toMin(r.start_time), e = endMin(r.end_time, s); if (s === e) return true; return s < e ? m >= s && m < e : m >= s || m < e; };
const active = (r: Rule, at: Date) => {
  if (r.is_active === false) return false;
  const t = typeOf(r);
  if (t === 'principal') return false;
  if (t === 'data') { const d = ymd(at); if (r.start_date && d < r.start_date) return false; const e = r.end_date || r.start_date; if (e && d > e) return false; }
  const days = r.days_of_week;
  if (t === 'recorrente' && (!days || !days.length)) return false;
  if (days && days.length && !days.includes(at.getUTCDay())) return false;
  return inWindow(r, at.getUTCHours() * 60 + at.getUTCMinutes());
};
const rank = (r: Rule) => (r.is_override ? 3 : typeOf(r) === 'data' ? 2 : 1);
const winner = (slots: Slot[], rules: Rule[], at: Date): { slot: Slot; rule: Rule | null } | null => {
  const by = new Map(slots.filter((s) => s.approved).map((s) => [s.id, s]));
  const a = rules.filter((r) => by.has(r.slotId) && active(r, at)).sort((x, y) => rank(y) - rank(x) || by.get(x.slotId)!.slot_position - by.get(y.slotId)!.slot_position);
  if (a.length) return { slot: by.get(a[0].slotId)!, rule: a[0] };
  const base = slots.find((s) => s.approved && s.is_base_video);
  return base ? { slot: base, rule: null } : null;
};
const segments = (slots: Slot[], rules: Rule[], day: Date) => {
  const midnight = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const cuts = new Set([0, 1440]);
  rules.forEach((r) => { if (r.is_all_day) return; if (r.start_time) cuts.add(toMin(r.start_time)); if (r.end_time) cuts.add(endMin(r.end_time, toMin(r.start_time))); });
  const s = [...cuts].sort((a, b) => a - b);
  const out: { a: number; b: number; w: ReturnType<typeof winner> }[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i + 1] <= s[i]) continue;
    const w = winner(slots, rules, new Date(midnight + s[i] * 60000));
    const last = out[out.length - 1];
    if (last && last.w?.slot.id === w?.slot.id && (last.w?.rule?.id || null) === (w?.rule?.id || null)) last.b = s[i + 1];
    else out.push({ a: s[i], b: s[i + 1], w });
  }
  return out;
};

const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
type Prog = Record<(typeof DIAS)[number], { inicio: string; fim: string }[]>;
const emptyProg = (): Prog => ({ domingo: [], segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [] });
const hhmm = (m: number) => (m >= 1440 ? '23:59' : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`);

/** Programação semanal efetiva de cada vídeo para a janela [hoje .. hoje+6] (horário de Brasília). */
function programacaoEfetiva(slots: Slot[], rules: Rule[], nowBrt: Date): Map<string, Prog> {
  const out = new Map<string, Prog>();
  slots.forEach((s) => out.set(s.id, emptyProg()));
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.UTC(nowBrt.getUTCFullYear(), nowBrt.getUTCMonth(), nowBrt.getUTCDate() + i));
    for (const sg of segments(slots, rules, day)) {
      if (!sg.w || !sg.w.rule) continue; // principal não recebe programação: ele é o master/fallback
      const p = out.get(sg.w.slot.id)!;
      p[DIAS[day.getUTCDay()]].push({ inicio: hhmm(sg.a), fim: hhmm(sg.b) });
    }
  }
  return out;
}

/** Formato legado (regras cruas, como update-video-schedule-aws monta hoje) — só para comparação no dry_run. */
function programacaoLegada(rules: Rule[]): Prog {
  const p = emptyProg();
  rules.filter((r) => r.is_active !== false && typeOf(r) === 'recorrente').forEach((r) => {
    (r.days_of_week || []).forEach((d) => p[DIAS[d]]?.push({ inicio: r.is_all_day ? '00:00' : (r.start_time || '').slice(0, 5), fim: r.is_all_day ? '23:59' : (r.end_time || '').slice(0, 5) }));
  });
  return p;
}

const stable = (p: Prog) => JSON.stringify(DIAS.map((d) => [d, [...p[d]].sort((a, b) => a.inicio.localeCompare(b.inicio))]));
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
      const { data: isAdm } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' }).then((r) => r, () => ({ data: false }));
      const { data: isSup } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'super_admin' }).then((r) => r, () => ({ data: false }));
      if (!isAdm && !isSup) {
        const { data: own } = await admin.from('pedidos').select('id').in('id', pedidoIds).eq('client_id', u.user.id);
        if ((own || []).length !== pedidoIds.length) return json({ success: false, error: 'forbidden' }, 403);
      }
    }

    // --- pedidos alvo ---
    let q = admin.from('pedidos').select('id, lista_predios, status').in('status', ['ativo', 'video_aprovado', 'video_enviado', 'aguardando_video']);
    if (pedidoIds?.length) q = q.in('id', pedidoIds);
    const { data: pedidos, error: pe } = await q;
    if (pe) throw pe;

    const nowBrt = new Date(Date.now() - 3 * 3600 * 1000); // Brasília (UTC-3, sem horário de verão)
    const relatorio: any[] = [];

    for (const ped of pedidos || []) {
      const lista: string[] = Array.isArray(ped.lista_predios) ? ped.lista_predios : [];
      const { data: pvs } = await admin
        .from('pedido_videos')
        .select('id, video_id, slot_position, is_base_video, approval_status, videos!inner(nome)')
        .eq('pedido_id', ped.id);
      const slots: Slot[] = (pvs || [])
        .filter((p: any) => p.video_id)
        .map((p: any) => ({ id: p.id, videoId: p.video_id, slot_position: p.slot_position, is_base_video: !!p.is_base_video, approved: p.approval_status === 'approved', titulo: String(p.videos?.nome || '').replace(/\.[^/.]+$/, '') }));
      const byVideo = new Map(slots.map((s) => [s.videoId, s]));
      const videoIds = slots.map((s) => s.videoId);
      let rules: Rule[] = [];
      if (videoIds.length) {
        const { data: rr } = await admin
          .from('campaign_schedule_rules')
          .select('id, days_of_week, start_time, end_time, is_all_day, is_active, rule_type, start_date, end_date, is_override, campaign_video_schedules!inner(video_id)')
          .in('campaign_video_schedules.video_id', videoIds);
        rules = (rr || []).map((r: any) => ({ ...r, slotId: byVideo.get(r.campaign_video_schedules?.video_id)?.id })).filter((r: any) => r.slotId);
      }

      const { data: estados } = await admin.from('exa2_agenda_sync_estado').select('*').eq('pedido_id', ped.id);
      const estadoPorVideo = new Map((estados || []).map((e: any) => [e.video_id, e]));
      const efetiva = programacaoEfetiva(slots, rules, nowBrt);

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
