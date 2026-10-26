import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Radio, Sparkles } from 'lucide-react';
import {
  AgendaRule,
  AgendaSlot,
  fmtCountdown,
  nextChange,
  winnerAt,
} from '@/lib/agenda/agendaEngine';

const fmtQuando = (d: Date) => {
  const now = new Date();
  const amanha = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `hoje às ${hh}`;
  if (d.toDateString() === amanha.toDateString()) return `amanhã às ${hh}`;
  return `${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} às ${hh}`;
};

export const descreverRegra = (r: AgendaRule | null) => {
  if (!r) return 'Vídeo principal — toca sempre que não há nada programado';
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const faixa = r.is_all_day ? 'dia todo' : `${(r.start_time || '').slice(0, 5)}–${(r.end_time || '').slice(0, 5)}`;
  if (r.rule_type === 'data' || r.start_date) {
    const fmt = (s?: string | null) => (s ? s.split('-').reverse().slice(0, 2).join('/') : '');
    const per = r.end_date && r.end_date !== r.start_date ? `${fmt(r.start_date)} a ${fmt(r.end_date)}` : fmt(r.start_date);
    return `${r.label ? r.label + ' · ' : ''}${per} · ${faixa}${r.is_override ? ' · sobreposição' : ''}`;
  }
  const d = (r.days_of_week || []).slice().sort().map((x) => dias[x]).join(', ');
  return `${r.label ? r.label + ' · ' : ''}toda ${d} · ${faixa}`;
};

interface Props {
  slots: AgendaSlot[];
  rules: AgendaRule[];
  totalPredios: number;
  /** Slot que o servidor marcou como exibindo agora (fonte da verdade dos painéis). */
  serverActiveSlotId?: string | null;
  onAgendar: () => void;
}

export const OnAirCard: React.FC<Props> = ({ slots, rules, totalPredios, serverActiveSlotId, onAgendar }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Recalcula o "próximo" só quando muda o minuto (o countdown em si roda a cada segundo).
  const minuteKey = Math.floor(now.getTime() / 60000);
  const computed = useMemo(() => winnerAt(slots, rules, now), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const proximo = useMemo(() => nextChange(slots, rules, now, 14), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Painéis são a verdade: se o servidor diz outro vídeo, mostramos o do servidor.
  const serverSlot = serverActiveSlotId ? slots.find((s) => s.id === serverActiveSlotId) : null;
  const atual = serverSlot && serverSlot.id !== computed?.slot.id ? { slot: serverSlot, rule: null } : computed;

  if (!atual) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
        <Radio className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="font-semibold text-gray-800">Nenhum vídeo no ar ainda</p>
        <p className="text-sm text-gray-500">Envie seu primeiro vídeo abaixo ou peça para a Sofia criar um para você.</p>
      </div>
    );
  }

  const falta = proximo ? proximo.at.getTime() - now.getTime() : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid md:grid-cols-[300px_1fr]">
      <div className="relative aspect-video bg-black md:aspect-auto md:min-h-[200px]">
        {atual.slot.url && (
          <video
            key={atual.slot.url}
            src={atual.slot.url}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          NO AR
        </span>
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1.5 p-5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-600">● No ar agora</span>
        <h3 className="truncate text-lg font-extrabold text-gray-900">{atual.slot.nome || `Vídeo ${atual.slot.slot_position}`}</h3>
        <p className="text-sm text-gray-600">
          {descreverRegra(atual.rule)}
          {totalPredios > 0 && <> · nos {totalPredios} prédios</>}
        </p>

        <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-exa-red/10 text-exa-red">
            <CalendarClock className="h-5 w-5" />
          </div>
          {proximo ? (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">A seguir</div>
                <div className="truncate text-sm font-bold text-gray-900">
                  {proximo.winner.slot.nome || `Vídeo ${proximo.winner.slot.slot_position}`}
                </div>
                <div className="text-xs text-gray-500">{fmtQuando(proximo.at)}</div>
              </div>
              <div className="rounded-xl bg-exa-red/10 px-3 py-2 text-center">
                <div className="font-mono text-lg font-extrabold leading-none text-exa-red tabular-nums">{fmtCountdown(falta)}</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-exa-red/70">faltam</div>
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">A seguir</div>
                <div className="text-sm font-semibold text-gray-700">Nada programado — o principal segue no ar</div>
              </div>
              <button
                onClick={onAgendar}
                className="inline-flex items-center gap-1.5 rounded-xl bg-exa-red px-3.5 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" /> Programar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
