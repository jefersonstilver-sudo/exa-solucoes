/**
 * EXA 2.0 — Agenda efetiva (fonte única para TODO envio de programação aos painéis).
 * Espelho de src/lib/agenda/agendaEngine.ts. Usado por exa2-agenda-sync, update-video-schedule-aws
 * e sync-buildings-external-api: assim nenhuma rota manda "regras cruas" que o player interpretaria
 * diferente do app (ex.: duas programações no mesmo horário, data virando semanal).
 */
// ---------------- motor de agenda (espelho de src/lib/agenda/agendaEngine.ts) ----------------
type RuleType = 'principal' | 'recorrente' | 'data';
export interface Rule { id: string; slotId: string; rule_type?: string | null; days_of_week?: number[] | null; start_time?: string | null; end_time?: string | null; is_all_day?: boolean | null; is_active?: boolean | null; start_date?: string | null; end_date?: string | null; is_override?: boolean | null; created_at?: string | null; }
export interface Slot { id: string; videoId: string; slot_position: number; is_base_video: boolean; approved: boolean; titulo: string; }

const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (t?: string | null) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const endMin = (t?: string | null, s = 0) => { if (!t) return 1440; if (/^23:59/.test(t) || /^24:00/.test(t)) return 1440; const m = toMin(t); return m === 0 && s > 0 ? 1440 : m; };
export const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; // datas "BRT" representadas em UTC
const typeOf = (r: Rule): RuleType => (r.rule_type === 'data' || r.rule_type === 'principal' || r.rule_type === 'recorrente' ? r.rule_type : r.start_date ? 'data' : 'recorrente');
const inWindow = (r: Rule, m: number) => { if (r.is_all_day) return true; const s = toMin(r.start_time), e = endMin(r.end_time, s); if (s === e) return true; return s < e ? m >= s && m < e : m >= s || m < e; };
const active = (r: Rule, at: Date) => {
  if (r.is_active === false) return false;
  const t = typeOf(r);
  if (t === 'principal') return false;
  const m = at.getUTCHours() * 60 + at.getUTCMinutes();
  // Janela que vira a meia-noite (ex.: sáb 22h→02h): a parte da madrugada pertence ao DIA ANTERIOR.
  const s = toMin(r.start_time), e = endMin(r.end_time, s);
  const ref = !r.is_all_day && s > e && m < e ? new Date(at.getTime() - 864e5) : at;
  if (t === 'data') { const d = ymd(ref); if (r.start_date && d < r.start_date) return false; const fim = r.end_date || r.start_date; if (fim && d > fim) return false; }
  const days = r.days_of_week;
  if (t === 'recorrente' && (!days || !days.length)) return false;
  if (days && days.length && !days.includes(ref.getUTCDay())) return false;
  return inWindow(r, m);
};
const rank = (r: Rule) => (r.is_override ? 3 : typeOf(r) === 'data' ? 2 : 1);
const winner = (slots: Slot[], rules: Rule[], at: Date): { slot: Slot; rule: Rule | null } | null => {
  const by = new Map(slots.filter((s) => s.approved).map((s) => [s.id, s]));
  const a = rules.filter((r) => by.has(r.slotId) && active(r, at)).sort((x, y) => rank(y) - rank(x) || String(y.created_at || '').localeCompare(String(x.created_at || '')) || by.get(x.slotId)!.slot_position - by.get(y.slotId)!.slot_position);
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

export const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
export type Prog = Record<(typeof DIAS)[number], { inicio: string; fim: string }[]>;
export const emptyProg = (): Prog => ({ domingo: [], segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [] });
const hhmm = (m: number) => (m >= 1440 ? '23:59' : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`);

/** Programação semanal efetiva de cada vídeo para a janela [hoje .. hoje+6] (horário de Brasília). */
export function programacaoEfetiva(slots: Slot[], rules: Rule[], nowBrt: Date): Map<string, Prog> {
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
export function programacaoLegada(rules: Rule[]): Prog {
  const p = emptyProg();
  rules.filter((r) => r.is_active !== false && typeOf(r) === 'recorrente').forEach((r) => {
    (r.days_of_week || []).forEach((d) => p[DIAS[d]]?.push({ inicio: r.is_all_day ? '00:00' : (r.start_time || '').slice(0, 5), fim: r.is_all_day ? '23:59' : (r.end_time || '').slice(0, 5) }));
  });
  return p;
}


export const stableProg = (p: Prog) => JSON.stringify(DIAS.map((d) => [d, [...p[d]].sort((a, b) => a.inicio.localeCompare(b.inicio))]));
export const agoraBrasilia = () => new Date(Date.now() - 3 * 3600 * 1000); // UTC-3, sem horário de verão

/** Carrega vídeos + regras do pedido e devolve a programação efetiva por video_id (janela de 7 dias). */
export async function agendaDoPedido(admin: any, pedidoId: string) {
  const { data: pvs } = await admin
    .from('pedido_videos')
    .select('id, video_id, slot_position, is_base_video, approval_status, videos!inner(nome)')
    .eq('pedido_id', pedidoId);
  const slots: Slot[] = (pvs || [])
    .filter((p: any) => p.video_id)
    .map((p: any) => ({ id: p.id, videoId: p.video_id, slot_position: p.slot_position, is_base_video: !!p.is_base_video, approved: p.approval_status === 'approved', titulo: String(p.videos?.nome || '').replace(/\.[^/.]+$/, '') }));
  const byVideo = new Map(slots.map((s) => [s.videoId, s]));
  const videoIds = slots.map((s) => s.videoId);
  let rules: Rule[] = [];
  if (videoIds.length) {
    const { data: rr, error } = await admin
      .from('campaign_schedule_rules')
      .select('id, days_of_week, start_time, end_time, is_all_day, is_active, rule_type, start_date, end_date, is_override, created_at, campaign_video_schedules!inner(video_id)')
      .in('campaign_video_schedules.video_id', videoIds);
    if (error) throw error;
    rules = (rr || []).map((r: any) => ({ ...r, slotId: byVideo.get(r.campaign_video_schedules?.video_id)?.id })).filter((r: any) => r.slotId);
  }
  const efetivaPorSlot = programacaoEfetiva(slots, rules, agoraBrasilia());
  const porVideo = new Map<string, Prog>();
  slots.forEach((s) => porVideo.set(s.videoId, efetivaPorSlot.get(s.id) || emptyProg()));
  return { slots, rules, efetivaPorSlot, porVideo };
}
