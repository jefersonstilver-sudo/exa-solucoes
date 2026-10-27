import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Clock, MapPin, Monitor, Search, Users, WifiOff, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { AgendaRule, AgendaSlot, daySegments, fmtCountdown } from '@/lib/agenda/agendaEngine';
import { useNoArAgora } from '@/hooks/exa2/useNoArAgora';
import { useWeatherData } from '@/hooks/useWeatherData';
import { ReplicaPainel } from './ReplicaPainel';
import { descreverRegra, fmtQuando } from './OnAirCard';
import { corDoSlot } from './AgendaTab';
import { TipoBadge, tipoDaJanela } from './VideoPreview';
import { BADGE, CARD, EYEBROW } from './ui';

export interface PredioInfo {
  id: string;
  nome: string;
  bairro?: string;
  endereco?: string;
  imagem_principal?: string;
  imageurl?: string;
  quantidade_telas?: number;
  numero_elevadores?: number;
  publico_estimado?: number;
  numero_unidades?: number;
}

const imgUrl = (b: PredioInfo): string | null => {
  const p = b.imagem_principal || b.imageurl;
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return supabase.storage.from('building-images').getPublicUrl(p).data.publicUrl;
};

/** Situação da entrega no prédio (vigia exa2_telas_saude). */
type Saude = 'sincronizada' | 'aplicando' | 'offline' | 'sem_confirmacao';
const SAUDE: Record<Saude, { t: string; c: string; i: React.ElementType }> = {
  sincronizada: { t: 'Confirmado', c: BADGE.ar, i: CheckCircle2 },
  aplicando: { t: 'Aplicando mudança', c: BADGE.agendado, i: Clock },
  offline: { t: 'Sem internet agora', c: BADGE.parado, i: WifiOff },
  sem_confirmacao: { t: 'Em atualização', c: BADGE.parado, i: Clock },
};

const useSaudePredios = (ids: string[]) => {
  const [mapa, setMapa] = useState<Record<string, Saude>>({});
  const chave = ids.join(',');
  useEffect(() => {
    if (!ids.length) return;
    let vivo = true;
    const ler = async () => {
      const { data, error } = await (supabase as any).from('exa2_telas_saude').select('building_id, status').in('building_id', ids);
      if (!vivo || error || !data) return;
      const m: Record<string, Saude> = {};
      // Pior estado do prédio vence: offline > aplicando > sem confirmação > confirmado.
      const peso: Record<Saude, number> = { offline: 3, aplicando: 2, sem_confirmacao: 1, sincronizada: 0 };
      for (const l of data as { building_id: string; status: string }[]) {
        const s: Saude = l.status === 'atrasada' ? 'aplicando' : (['sincronizada', 'aplicando', 'offline', 'sem_confirmacao'].includes(l.status) ? (l.status as Saude) : 'sem_confirmacao');
        if (!m[l.building_id] || peso[s] > peso[m[l.building_id]]) m[l.building_id] = s;
      }
      setMapa(m);
    };
    ler();
    const t = setInterval(ler, 60000);
    return () => { vivo = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return mapa;
};

interface Props {
  /** Apenas prédios ATIVOS do pedido. */
  predios: PredioInfo[];
  slots: AgendaSlot[];
  rules: AgendaRule[];
  serverActiveSlotId?: string | null;
  /** Pedido bloqueado: nada no ar. */
  bloqueado?: boolean;
}

export const PrediosTab: React.FC<Props> = ({ predios, slots, rules, serverActiveSlotId, bloqueado }) => {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState<PredioInfo | null>(null);
  const { atual } = useNoArAgora(slots, rules, serverActiveSlotId, 30000);
  const noAr = bloqueado ? null : atual?.slot || null;
  const saude = useSaudePredios(predios.map((p) => p.id));

  const lista = useMemo(
    () =>
      predios
        .filter((b) => `${b.nome} ${b.bairro || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [predios, q],
  );
  const telas = predios.reduce((s, b) => s + (b.quantidade_telas || b.numero_elevadores || 0), 0);
  const publico = predios.reduce((s, b) => s + (b.publico_estimado || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <div className={EYEBROW}>Onde seu vídeo aparece</div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1b1719]">Meus prédios</h2>
        <p className="mt-1 text-sm text-[#8b8285]">{predios.length} prédios ativos · toque em um prédio para ver a tela do elevador ao vivo</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { i: Building2, n: predios.length, l: 'prédios' },
          { i: Monitor, n: telas || '—', l: 'telas' },
          { i: Users, n: publico ? publico.toLocaleString('pt-BR') : '—', l: 'pessoas/mês' },
        ].map(({ i: I, n, l }) => (
          <div key={l} className={`${CARD} p-3 text-center sm:p-4`}>
            <I className="mx-auto mb-1 h-4 w-4 text-[#9e1b34]" />
            <div className="text-xl font-extrabold leading-none text-[#1b1719] sm:text-2xl">{n}</div>
            <div className="text-[11px] font-semibold text-[#8b8285]">{l}</div>
          </div>
        ))}
      </div>

      <div className={`${CARD} flex items-center gap-2 px-3.5 py-2.5`}>
        <Search className="h-4 w-4 text-[#8b8285]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prédio ou bairro…" className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((b) => {
          const img = imgUrl(b);
          const sd = saude[b.id] ? SAUDE[saude[b.id]] : null;
          return (
            <button key={b.id} onClick={() => setAberto(b)} className={`${CARD} group flex overflow-hidden text-left transition active:scale-[.99] hover:shadow-[0_2px_6px_rgba(30,15,18,.06),0_24px_48px_-22px_rgba(30,15,18,.3)]`}>
              <div className="relative min-h-[104px] w-[120px] flex-none bg-gradient-to-br from-[#5b6b8c] to-[#2d3a56] sm:w-[132px]">
                {img ? (
                  <img src={img} alt={b.nome} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.04]" />
                ) : (
                  <Building2 className="absolute inset-0 m-auto h-9 w-9 text-white/40" />
                )}
                {noAr && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2fe17a] shadow-[0_0_6px_#2fe17a]" /> No ar
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3.5">
                <div className="truncate text-[15.5px] font-extrabold text-[#1b1719]">{b.nome}</div>
                <div className="flex items-center gap-1 truncate text-xs text-[#8b8285]">
                  <MapPin className="h-3 w-3 flex-none" /> {b.bairro || 'Foz do Iguaçu'}
                  {(b.quantidade_telas || b.numero_elevadores) ? <> · {b.quantidade_telas || b.numero_elevadores} tela(s)</> : null}
                </div>
                {noAr && (
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#554e50]">
                    <span className={`truncate rounded-full px-2 py-0.5 text-[10.5px] font-bold ${BADGE.ar}`}>● {(noAr.nome || 'Seu vídeo').replace(/_/g, ' ')}</span>
                    <span className="flex-none">no ar agora</span>
                  </div>
                )}
                {sd && (
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${sd.c}`}>
                    <sd.i className="h-3 w-3" /> {sd.t}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {!lista.length && <p className="py-8 text-center text-sm text-[#8b8285]">Nenhum prédio encontrado.</p>}

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[92dvh] max-w-5xl gap-0 overflow-y-auto rounded-[22px] border-0 bg-[#f3f1f2] p-0 sm:rounded-[22px]">
          {aberto && (
            <PredioAoVivo
              predio={aberto}
              slots={slots}
              rules={rules}
              serverActiveSlotId={serverActiveSlotId}
              bloqueado={bloqueado}
              saude={saude[aberto.id] || null}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const hhmm = (m: number) => (m >= 1440 ? '24:00' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

/** Conteúdo do modal: réplica ao vivo + o que está passando + programação de hoje. */
const PredioAoVivo: React.FC<{
  predio: PredioInfo;
  slots: AgendaSlot[];
  rules: AgendaRule[];
  serverActiveSlotId?: string | null;
  bloqueado?: boolean;
  saude: Saude | null;
}> = ({ predio, slots, rules, serverActiveSlotId, bloqueado, saude }) => {
  // Relógio ao vivo (segundo a segundo); o vídeo vencedor troca sozinho quando a agenda muda.
  const { now, atual, proximo } = useNoArAgora(slots, rules, serverActiveSlotId, 1000);
  const { weatherData } = useWeatherData();
  const slot = bloqueado ? null : atual?.slot || null;
  const minuteKey = Math.floor(now.getTime() / 60000);
  const segsHoje = useMemo(() => daySegments(slots, rules, now), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const minAgora = now.getHours() * 60 + now.getMinutes();
  const img = imgUrl(predio);
  const sd = saude ? SAUDE[saude] : null;

  return (
    <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
      <DialogPrimitive.Close className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#554e50] shadow hover:text-[#9C1E1E]" aria-label="Fechar">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>

      {/* Réplica */}
      <div className="mx-auto w-full min-w-[220px]" style={{ maxWidth: 'min(100%, 340px, calc((100dvh - 120px) * 0.5625))' }}>
        <div className="relative">
          <span className="absolute -top-2 right-3 z-10 flex items-center gap-1.5 rounded-full bg-[#1b1719] px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide text-white shadow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d5e]" /> AO VIVO
          </span>
          <ReplicaPainel predioNome={predio.nome} slot={slot} now={now} clima={weatherData} />
        </div>
      </div>

      {/* Informações */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3 pr-10">
          {img && <img src={img} alt="" className="h-14 w-14 flex-none rounded-2xl object-cover" />}
          <div className="min-w-0">
            <div className={EYEBROW}>Prédio contratado</div>
            <DialogTitle className="truncate text-2xl font-extrabold tracking-tight text-[#1b1719]">{predio.nome}</DialogTitle>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#8b8285]">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{predio.bairro || 'Foz do Iguaçu'}</span>
              {(predio.quantidade_telas || predio.numero_elevadores) ? <span>· {predio.quantidade_telas || predio.numero_elevadores} tela(s)</span> : null}
              {sd && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${sd.c}`}><sd.i className="h-3 w-3" />{sd.t}</span>}
            </div>
          </div>
        </div>

        <div className={`${CARD} p-4`}>
          <div className="text-xs font-extrabold tracking-wide text-[#13a24a]">● PASSANDO AGORA NESTA TELA</div>
          {slot ? (
            <>
              <div className="mt-1 truncate text-lg font-extrabold text-[#1b1719]">{(slot.nome || `Vídeo ${slot.slot_position}`).replace(/_/g, ' ')}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <TipoBadge tipo={tipoDaJanela(atual?.rule)} />
                <span className="text-xs text-[#8b8285]">{descreverRegra(atual?.rule || null)}</span>
              </div>
              {proximo && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#f1edee] pt-3 text-sm">
                  <span className="min-w-0 truncate text-[#554e50]">
                    A seguir: <b className="text-[#1b1719]">{(proximo.winner.slot.nome || '').replace(/_/g, ' ')}</b> · {fmtQuando(proximo.at)}
                  </span>
                  <span className="flex-none rounded-[10px] bg-[#f8e9ec] px-2.5 py-1 font-mono text-sm font-extrabold tabular-nums text-[#9C1E1E]">{fmtCountdown(proximo.at.getTime() - now.getTime())}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-1 text-sm text-[#8b8285]">{bloqueado ? 'Pedido bloqueado — nada no ar no momento.' : 'Nenhum vídeo aprovado no ar ainda.'}</div>
          )}
        </div>

        {!bloqueado && segsHoje.length > 0 && (
          <div className={`${CARD} p-4`}>
            <div className="mb-2.5 text-sm font-extrabold text-[#1b1719]">Programação de hoje nesta tela</div>
            <div className="space-y-1.5">
              {segsHoje.map((sg, i) => {
                const s = sg.winner?.slot;
                const agoraAqui = minAgora >= sg.startMin && minAgora < sg.endMin;
                return (
                  <div key={i} className={`grid grid-cols-[86px_1fr] items-center gap-2 rounded-xl px-1 py-0.5 ${agoraAqui ? 'bg-[#e6f6ec]' : ''}`}>
                    <span className="text-[11.5px] font-semibold tabular-nums text-[#8b8285]">{hhmm(sg.startMin)}–{hhmm(sg.endMin)}</span>
                    <div className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[13px] font-bold text-white" style={{ background: corDoSlot(s) }}>
                      <span className="truncate">{s?.nome?.replace(/_/g, ' ') || 'sem vídeo'}</span>
                      <small className="flex-none text-[10.5px] font-semibold opacity-90">{agoraAqui ? '● agora' : sg.winner?.rule ? 'agendado' : 'principal'}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { n: predio.quantidade_telas || predio.numero_elevadores || '—', l: 'telas' },
            { n: predio.publico_estimado ? predio.publico_estimado.toLocaleString('pt-BR') : '—', l: 'pessoas/mês' },
            { n: predio.numero_unidades || '—', l: 'unidades' },
          ].map(({ n, l }) => (
            <div key={l} className={`${CARD} p-3 text-center`}>
              <div className="text-lg font-extrabold text-[#1b1719]">{n}</div>
              <div className="text-[11px] text-[#8b8285]">{l}</div>
            </div>
          ))}
        </div>

        <p className="flex gap-2 rounded-xl border border-[#f8e9ec] bg-[#fdf6f7] px-3 py-2.5 text-xs text-[#554e50]">
          <span aria-hidden>👁️</span>
          <span>
            Esta é a réplica da tela do <b>{predio.nome}</b> agora, com o vídeo do seu pedido que está no ar neste momento. A área de avisos do condomínio fica <b>oculta</b> — essas informações são privadas dos moradores.
          </span>
        </p>
      </div>
    </div>
  );
};
