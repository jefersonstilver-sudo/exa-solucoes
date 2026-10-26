/**
 * EXA 2.0 — Motor de agenda do pedido (lógica pura, sem React/Supabase).
 *
 * Regras de negócio:
 *  - Nunca dois vídeos ao mesmo tempo no mesmo pedido: existe sempre UM vencedor.
 *  - Sempre existe um vídeo principal (fallback) que toca quando nada está agendado.
 *  - Tipos de regra: 'principal' | 'recorrente' (dias da semana + horário) | 'data' (janela de datas + horário).
 *  - Prioridade quando duas regras batem no mesmo instante:
 *      override  >  data  >  recorrente  >  (slot menor vence empate)
 *    Conflito nunca é resolvido "por baixo dos panos": o override só existe se o cliente escolheu.
 *
 * Esta mesma lógica deve ser espelhada no motor do servidor (Fase 3) para a tela e os painéis concordarem.
 */

export type RuleType = 'principal' | 'recorrente' | 'data';

export interface AgendaRule {
  id: string;
  slotId: string;            // pedido_videos.id
  videoId: string;
  rule_type?: RuleType | null;
  days_of_week?: number[] | null; // 0=Dom..6=Sáb
  start_time?: string | null;     // 'HH:MM' ou 'HH:MM:SS'
  end_time?: string | null;
  is_all_day?: boolean | null;
  is_active?: boolean | null;
  start_date?: string | null;     // 'YYYY-MM-DD'
  end_date?: string | null;
  is_override?: boolean | null;
  label?: string | null;
}

export interface AgendaSlot {
  id: string;                // pedido_videos.id
  videoId?: string;
  slot_position: number;
  is_base_video: boolean;
  approved: boolean;
  nome?: string;
  url?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const toMinutes = (t?: string | null): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Fim de faixa em minutos. O sistema grava "até o fim do dia" como 23:59 → tratamos como 24:00. */
export const endMinutes = (t?: string | null, startMin = 0): number => {
  if (!t) return 1440;
  if (/^23:59/.test(t) || /^24:00/.test(t)) return 1440;
  const m = toMinutes(t);
  return m === 0 && startMin > 0 ? 1440 : m;
};

/** Data/hora cai dentro da faixa horária (suporta virada da meia-noite, ex 22:00→02:00). */
const inTimeWindow = (rule: AgendaRule, minutes: number): boolean => {
  if (rule.is_all_day) return true;
  const s = toMinutes(rule.start_time);
  const e = endMinutes(rule.end_time, s);
  if (s === e) return true; // faixa "cheia"
  if (s < e) return minutes >= s && minutes < e;
  return minutes >= s || minutes < e; // vira a meia-noite
};

export const ruleTypeOf = (r: AgendaRule): RuleType => {
  if (r.rule_type === 'data' || r.rule_type === 'principal' || r.rule_type === 'recorrente') return r.rule_type;
  return r.start_date ? 'data' : 'recorrente';
};

/** A regra está valendo neste instante? */
export const ruleActiveAt = (rule: AgendaRule, at: Date): boolean => {
  if (rule.is_active === false) return false;
  const type = ruleTypeOf(rule);
  if (type === 'principal') return false; // principal não é regra de janela: é o fallback
  const day = at.getDay();
  const minutes = at.getHours() * 60 + at.getMinutes();
  if (type === 'data') {
    const today = ymd(at);
    if (rule.start_date && today < rule.start_date) return false;
    const end = rule.end_date || rule.start_date;
    if (end && today > end) return false;
  }
  const days = rule.days_of_week;
  if (type === 'recorrente' && (!days || days.length === 0)) return false;
  if (days && days.length > 0 && !days.includes(day)) return false;
  return inTimeWindow(rule, minutes);
};

const rank = (r: AgendaRule) => (r.is_override ? 3 : ruleTypeOf(r) === 'data' ? 2 : 1);

export interface Winner {
  slot: AgendaSlot;
  rule: AgendaRule | null; // null = está no ar como principal (fallback)
}

/** Quem está no ar neste instante. Sempre devolve 1 (ou null se o pedido não tem nenhum vídeo aprovado). */
export const winnerAt = (slots: AgendaSlot[], rules: AgendaRule[], at: Date): Winner | null => {
  const bySlot = new Map(slots.filter((s) => s.approved).map((s) => [s.id, s]));
  const active = rules
    .filter((r) => bySlot.has(r.slotId) && ruleActiveAt(r, at))
    .sort((a, b) => rank(b) - rank(a) || bySlot.get(a.slotId)!.slot_position - bySlot.get(b.slotId)!.slot_position);
  if (active.length) return { slot: bySlot.get(active[0].slotId)!, rule: active[0] };
  const base = slots.find((s) => s.approved && s.is_base_video) || null;
  return base ? { slot: base, rule: null } : null;
};

/** Instantes candidatos a troca (início/fim de cada regra) nos próximos `days` dias. */
const boundaries = (rules: AgendaRule[], from: Date, days: number): Date[] => {
  const out: number[] = [];
  for (let i = 0; i <= days; i++) {
    const base = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    out.push(base.getTime()); // meia-noite (regras de data/dia mudam aqui)
    for (const r of rules) {
      if (r.is_all_day) continue;
      if (r.start_time) out.push(base.getTime() + toMinutes(r.start_time) * 60000);
      if (r.end_time) out.push(base.getTime() + endMinutes(r.end_time, toMinutes(r.start_time)) * 60000);
    }
  }
  return [...new Set(out)].filter((t) => t > from.getTime()).sort((a, b) => a - b).map((t) => new Date(t));
};

export interface NextChange {
  at: Date;
  winner: Winner;
}

/** Próxima troca de vídeo (dentro de `days` dias). null = nada muda nesse período. */
export const nextChange = (slots: AgendaSlot[], rules: AgendaRule[], from: Date, days = 14): NextChange | null => {
  const now = winnerAt(slots, rules, from);
  const key = (w: Winner | null) => (w ? `${w.slot.id}|${w.rule?.id || 'base'}` : 'none');
  const nowKey = key(now);
  for (const t of boundaries(rules, from, days)) {
    const w = winnerAt(slots, rules, t);
    if (key(w) !== nowKey && w && w.slot.id !== now?.slot.id) return { at: t, winner: w };
  }
  return null;
};

export interface DaySegment {
  startMin: number; // 0..1440
  endMin: number;
  winner: Winner | null;
}

/** Faixas de um dia inteiro (para a timeline da semana). */
export const daySegments = (slots: AgendaSlot[], rules: AgendaRule[], day: Date): DaySegment[] => {
  const midnight = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const cuts = new Set<number>([0, 1440]);
  for (const r of rules) {
    if (r.is_all_day) continue;
    if (r.start_time) cuts.add(toMinutes(r.start_time));
    if (r.end_time) cuts.add(endMinutes(r.end_time, toMinutes(r.start_time)));
  }
  const sorted = [...cuts].filter((m) => m >= 0 && m <= 1440).sort((a, b) => a - b);
  const segs: DaySegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b <= a) continue;
    const w = winnerAt(slots, rules, new Date(midnight.getTime() + a * 60000));
    const last = segs[segs.length - 1];
    if (last && last.winner?.slot.id === w?.slot.id && (last.winner?.rule?.id || null) === (w?.rule?.id || null)) {
      last.endMin = b;
    } else {
      segs.push({ startMin: a, endMin: b, winner: w });
    }
  }
  return segs;
};

/** Detecta se uma nova regra colide com o que já está agendado (para avisar, nunca resolver sozinho). */
export const findConflicts = (
  rules: AgendaRule[],
  candidate: AgendaRule,
  from: Date,
  days = 120,
  slots?: AgendaSlot[],
): AgendaRule[] => {
  // Só vídeos aprovados contam: um vídeo pendente nunca vai ao ar, então não é conflito real.
  if (slots) {
    const approved = new Set(slots.filter((s) => s.approved).map((s) => s.id));
    rules = rules.filter((r) => approved.has(r.slotId));
  }
  const hits = new Set<string>();
  for (let i = 0; i < days; i++) {
    const base = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const probes = candidate.is_all_day
      ? [0, 360, 720, 1080, 1380]
      : [toMinutes(candidate.start_time), Math.max(toMinutes(candidate.start_time), endMinutes(candidate.end_time, toMinutes(candidate.start_time)) - 1)];
    for (const m of probes) {
      const t = new Date(base.getTime() + m * 60000);
      if (!ruleActiveAt(candidate, t)) continue;
      for (const r of rules) if (r.id !== candidate.id && r.slotId !== candidate.slotId && ruleActiveAt(r, t)) hits.add(r.id);
    }
  }
  return rules.filter((r) => hits.has(r.id));
};

export const fmtCountdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
};
