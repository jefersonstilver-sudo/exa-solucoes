import React, { useMemo } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { AgendaRule, AgendaSlot, daySegments, fmtCountdown } from '@/lib/agenda/agendaEngine';
import { useNoArAgora } from '@/hooks/exa2/useNoArAgora';
import { HoverVideoPreview, LoopVideo, TipoBadge, tipoDaJanela, VideoPoster } from './VideoPreview';
import { CARD } from './ui';

export const fmtQuando = (d: Date) => {
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

const nomeDe = (s: AgendaSlot) => (s.nome || `Vídeo ${s.slot_position}`).replace(/_/g, ' ');

interface Props {
  slots: AgendaSlot[];
  rules: AgendaRule[];
  totalPredios: number;
  /** Slot que o servidor marcou como exibindo agora (fonte da verdade dos painéis). */
  serverActiveSlotId?: string | null;
  onAgendar: () => void;
  /** Palco: atalhos para ver a tela do prédio e enviar vídeo */
  onVerTela?: () => void;
  onEnviar?: () => void;
}

export const OnAirCard: React.FC<Props> = ({ slots, rules, totalPredios, serverActiveSlotId, onAgendar, onVerTela, onEnviar }) => {
  const { now, atual, proximo } = useNoArAgora(slots, rules, serverActiveSlotId);

  // Progresso da janela atual (do início do trecho de hoje até a próxima troca).
  const minuteKey = Math.floor(now.getTime() / 60000);
  const inicioJanela = useMemo(() => {
    const segs = daySegments(slots, rules, now);
    const min = now.getHours() * 60 + now.getMinutes();
    const seg = segs.find((s) => min >= s.startMin && min < s.endMin);
    return seg ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + seg.startMin * 60000 : now.getTime();
  }, [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!atual) {
    return (
      <div className={`${CARD} p-6 text-center`}>
        <Radio className="mx-auto mb-2 h-8 w-8 text-[#8b8285]" />
        <p className="font-extrabold text-[#1b1719]">Nenhum vídeo no ar ainda</p>
        <p className="text-sm text-[#8b8285]">Envie seu primeiro vídeo abaixo ou peça para a Sofia criar um para você.</p>
      </div>
    );
  }

  const falta = proximo ? proximo.at.getTime() - now.getTime() : 0;
  const pct = proximo ? Math.min(100, Math.max(2, ((now.getTime() - inicioJanela) / (proximo.at.getTime() - inicioJanela)) * 100)) : 100;
  const tipoAtual = tipoDaJanela(atual.rule);

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* Vídeo atual tocando (mudo, em loop) */}
        <div className="relative aspect-[1080/890] bg-black">
          <LoopVideo url={atual.slot.url} nome={nomeDe(atual.slot)} fit="contain" />
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white backdrop-blur">
            <span className="relative h-2 w-2 rounded-full bg-[#2fe17a]">
              <span className="absolute -inset-1 animate-ping rounded-full border-2 border-[#2fe17a]" />
            </span>
            NO AR
          </span>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-2.5 p-5 lg:p-7">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#13a24a]">
            <span className="relative h-2 w-2 rounded-full bg-[#13a24a]">
              <span className="absolute -inset-1 animate-ping rounded-full border-2 border-[#13a24a]" />
            </span>
            NO AR AGORA
          </span>
          <h3 className="truncate text-xl font-extrabold tracking-tight text-[#1b1719] sm:text-2xl lg:text-[28px]">{nomeDe(atual.slot)}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <TipoBadge tipo={tipoAtual} />
            <span className="text-[12.5px] text-[#8b8285]">
              {descreverRegra(atual.rule)}
              {totalPredios > 0 && <> · nos {totalPredios} prédios</>}
            </span>
          </div>
          {proximo && (
            <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-[#ebe6e7]" title="Quanto já passou desta janela">
              <i className="block h-full rounded-full bg-gradient-to-r from-[#9e1b34] to-[#c0304b] transition-[width] duration-1000" style={{ width: `${pct}%` }} />
            </div>
          )}
          {/* Palco: ações principais do pedido */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onAgendar} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] bg-[#9C1E1E] px-4 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(156,30,30,.9)] hover:bg-[#7c1428]">
              <Sparkles className="h-4 w-4" /> Programar vídeos
            </button>
            {onVerTela && (
              <button type="button" onClick={onVerTela} className="inline-flex min-h-[44px] items-center rounded-[14px] border border-[#e6dfe1] bg-white px-4 text-sm font-semibold text-[#1b1719] hover:bg-[#f7f5f6]">
                Ver a tela {totalPredios === 1 ? 'do prédio' : 'dos prédios'}
              </button>
            )}
            {onEnviar && (
              <button type="button" onClick={onEnviar} className="inline-flex min-h-[44px] items-center rounded-[14px] border border-[#e6dfe1] bg-white px-4 text-sm font-semibold text-[#1b1719] hover:bg-[#f7f5f6]">
                Enviar vídeo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* A seguir — passar o mouse (ou tocar) mostra o próximo vídeo tocando */}
      <div className="border-t border-[#f1edee] px-4 py-3 sm:px-5">
        {proximo ? (
          <HoverVideoPreview
            info={{
              url: proximo.winner.slot.url,
              nome: nomeDe(proximo.winner.slot),
              tipo: tipoDaJanela(proximo.winner.rule),
              faixa: `entra ${fmtQuando(proximo.at)}`,
              extra: descreverRegra(proximo.winner.rule),
            }}
          >
            <div className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-[#fdf6f7]">
              <div className="relative h-11 w-11 flex-none overflow-hidden rounded-[11px] bg-black">
                {proximo.winner.slot.url ? (
                  <video src={`${proximo.winner.slot.url}#t=1`} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                ) : (
                  <VideoPoster small className="absolute inset-0" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8b8285]">A seguir</div>
                <div className="truncate text-sm font-bold text-[#1b1719]">{nomeDe(proximo.winner.slot)}</div>
                <div className="truncate text-xs text-[#8b8285]">{fmtQuando(proximo.at)} · <span className="hidden sm:inline">passe o mouse para ver</span><span className="sm:hidden">toque para ver</span></div>
              </div>
              <div className="rounded-[10px] bg-[#f8e9ec] px-2.5 py-1.5 text-center">
                <div className="whitespace-nowrap font-mono text-base font-extrabold leading-none tabular-nums text-[#9C1E1E] sm:text-lg">{fmtCountdown(falta)}</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9C1E1E]/70">faltam</div>
              </div>
            </div>
          </HoverVideoPreview>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-[#8b8285]">A seguir</div>
              <div className="text-sm font-semibold text-[#554e50]">Nada programado — o principal segue no ar</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#f1edee] px-5 py-2.5 text-[11.5px] text-[#8b8285]">
        {[
          ['#13a24a', 'No ar'],
          ['#9e1b34', 'Principal'],
          ['#2563eb', 'Agendado'],
          ['#c2740a', 'Em aprovação'],
        ].map(([c, t]) => (
          <span key={t} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded" style={{ background: c }} />{t}</span>
        ))}
      </div>
    </div>
  );
};
