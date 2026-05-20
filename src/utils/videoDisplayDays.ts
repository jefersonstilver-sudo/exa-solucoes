/**
 * Cálculo de "dias em exibição" — derivado 100% de dados reais.
 *
 * Regras:
 * - Vídeo base ou sem regras de agendamento: dias corridos desde approved_at.
 * - Vídeo agendado: conta apenas dias entre a criação da regra e hoje
 *   que caem nos days_of_week ativos da regra (mesma lógica que
 *   useVideoReportData usa para exibições por dia).
 * - Sem approved_at → retorna null (sem badge).
 */

export interface ScheduleRuleLite {
  days_of_week: number[];
  is_active: boolean;
  is_all_day?: boolean;
  created_at?: string;
}

export interface VideoDaysInput {
  approved_at?: string | null;
  is_base_video?: boolean | null;
  schedule_rules?: ScheduleRuleLite[] | null;
  schedule_created_at?: string | null;
}

export type DaysSeverity = 'fresh' | 'aging' | 'stale';

export interface DaysResult {
  days: number;
  severity: DaysSeverity;
  label: string;
  tooltip: string;
}

const MS_DAY = 1000 * 60 * 60 * 24;

export function calcDisplayDays(input: VideoDaysInput, now: Date = new Date()): number | null {
  const rules = (input.schedule_rules ?? []).filter((r) => r.is_active);
  const hasSchedule = rules.length > 0;

  if (input.is_base_video || !hasSchedule) {
    if (!input.approved_at) return null;
    const start = new Date(input.approved_at).getTime();
    if (Number.isNaN(start)) return null;
    return Math.max(0, Math.floor((now.getTime() - start) / MS_DAY));
  }

  // Agendado: usa created_at da regra mais antiga (ou schedule_created_at) como início
  const ruleStarts = rules
    .map((r) => (r.created_at ? new Date(r.created_at).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  const fallback = input.schedule_created_at
    ? new Date(input.schedule_created_at).getTime()
    : input.approved_at
    ? new Date(input.approved_at).getTime()
    : NaN;
  const startMs = ruleStarts.length ? Math.min(...ruleStarts) : fallback;
  if (Number.isNaN(startMs)) return null;

  // Conjunto de dias-da-semana ativos (0=Domingo … 6=Sábado)
  const activeDow = new Set<number>();
  rules.forEach((r) => (r.days_of_week ?? []).forEach((d) => activeDow.add(d)));
  if (activeDow.size === 0) return 0;

  // Contar dias entre start e hoje que caem nesses dias da semana
  const start = new Date(startMs);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(start);
  // Limite de segurança: 5 anos
  const maxDays = 365 * 5;
  let i = 0;
  while (cursor.getTime() <= end.getTime() && i < maxDays) {
    if (activeDow.has(cursor.getDay())) count++;
    cursor.setDate(cursor.getDate() + 1);
    i++;
  }
  return count;
}

export function severityFromDays(days: number): DaysSeverity {
  if (days <= 14) return 'fresh';
  if (days <= 29) return 'aging';
  return 'stale';
}

export function buildDaysResult(input: VideoDaysInput, now?: Date): DaysResult | null {
  const days = calcDisplayDays(input, now);
  if (days === null) return null;
  const severity = severityFromDays(days);
  const label = `${days} ${days === 1 ? 'dia' : 'dias'}`;
  const base = `Este vídeo está em exibição há ${label}.`;
  const tip =
    severity === 'stale'
      ? `${base} Vídeos com mais de 30 dias rendem menos — recomendamos trocar agora para manter o engajamento da campanha.`
      : severity === 'aging'
      ? `${base} Já está chegando perto dos 30 dias — quanto mais frequente a troca, melhor o resultado.`
      : `${base} Quanto mais vídeos novos sua campanha tiver, melhor o desempenho.`;
  return { days, severity, label, tooltip: tip };
}
