import { useEffect, useMemo, useState } from 'react';
import { AgendaRule, AgendaSlot, nextChange, winnerAt, Winner } from '@/lib/agenda/agendaEngine';

/**
 * Quem está no ar AGORA (e quem vem a seguir) segundo o motor de agenda.
 * O relógio anda a cada `tickMs`; o vencedor só é recalculado quando muda o minuto.
 * Se o servidor marcou outro slot como exibindo, o do servidor vence (os painéis são a verdade).
 */
export function useNoArAgora(
  slots: AgendaSlot[],
  rules: AgendaRule[],
  serverActiveSlotId?: string | null,
  tickMs = 1000,
) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(t);
  }, [tickMs]);

  const minuteKey = Math.floor(now.getTime() / 60000);
  const computed = useMemo(() => winnerAt(slots, rules, now), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const proximo = useMemo(() => nextChange(slots, rules, now, 14), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const serverSlot = serverActiveSlotId ? slots.find((s) => s.id === serverActiveSlotId) : null;
  // A agenda calculada (mesmo motor que monta a programação das telas) é a verdade. selected_for_display no banco
  // marca o vídeo PRINCIPAL, não o programado da vez — por isso só é usado quando a agenda não tem resposta.
  const atual: Winner | null = computed || (serverSlot ? { slot: serverSlot, rule: null } : null);

  return { now, atual, proximo };
}
