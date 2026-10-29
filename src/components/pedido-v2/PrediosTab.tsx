import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, ChevronRight, Clock, MapPin, Monitor, Search, Users, WifiOff, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { AgendaRule, AgendaSlot, daySegments, fmtCountdown } from '@/lib/agenda/agendaEngine';
import { useNoArAgora } from '@/hooks/exa2/useNoArAgora';
import { useWeatherData } from '@/hooks/useWeatherData';
import { ReplicaPainel, type ItemReplica } from './ReplicaPainel';
import { descreverRegra, fmtQuando } from './OnAirCard';
import { corDoSlot } from './AgendaTab';
import { TipoBadge, tipoDaJanela } from './VideoPreview';
import { BADGE, CARD } from './ui';

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
  /** Equipe EXA: mostra a confirmação de entrega por prédio e a fila completa da tela. */
  visaoInterna?: boolean;
}

export const PrediosTab: React.FC<Props> = ({ predios, slots, rules, serverActiveSlotId, bloqueado, visaoInterna }) => {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState<PredioInfo | null>(null);
  const { atual } = useNoArAgora(slots, rules, serverActiveSlotId, 30000);
  const noAr = bloqueado ? null : atual?.slot || null;
  const saude = useSaudePredios(visaoInterna ? predios.map((p) => p.id) : []);

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
    <div className="space-y-4">
      {/* Resumo numa linha só (antes: título + 3 cartões de números + texto) */}
      <div className="px-0.5">
        <h2 className="text-[22px] font-extrabold tracking-tight text-[#1b1719] sm:text-2xl">Prédios</h2>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#8b8285]">
          <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{predios.length} {predios.length === 1 ? 'prédio' : 'prédios'}</span>
          {telas > 0 && <span className="inline-flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />{telas} telas</span>}
          {publico > 0 && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{publico.toLocaleString('pt-BR')} pessoas/mês</span>}
        </p>
      </div>

      {noAr && (
        <div className={`${CARD} flex items-center gap-2.5 px-3.5 py-2.5`}>
          <span className="relative h-2.5 w-2.5 flex-none rounded-full bg-[#13a24a]"><span className="absolute -inset-1 animate-ping rounded-full border-2 border-[#13a24a]/60" /></span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#554e50]">No ar em todos agora: <b className="text-[#1b1719]">{(noAr.nome || 'Seu vídeo').replace(/_/g, ' ')}</b></span>
        </div>
      )}

      {predios.length > 6 && (
        <div className={`${CARD} flex items-center gap-2 px-3.5 py-2.5`}>
          <Search className="h-4 w-4 text-[#8b8285]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prédio ou bairro" className="flex-1 bg-transparent text-[15px] outline-none" />
        </div>
      )}

      <div className={`${CARD} divide-y divide-[#f1edee] overflow-hidden md:grid md:grid-cols-2 md:divide-y-0 md:gap-px md:bg-[#f1edee]`}>
        {lista.map((b) => {
          const img = imgUrl(b);
          const sd = visaoInterna && saude[b.id] ? SAUDE[saude[b.id]] : null;
          const nTelas = b.quantidade_telas || b.numero_elevadores;
          return (
            <button key={b.id} onClick={() => setAberto(b)} className="flex w-full items-center gap-3 bg-white px-3 py-2.5 text-left transition active:bg-[#f7f5f6] md:hover:bg-[#fdf6f7]">
              <span className="relative h-12 w-12 flex-none overflow-hidden rounded-[12px] bg-gradient-to-br from-[#5b6b8c] to-[#2d3a56]">
                {img ? <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <Building2 className="absolute inset-0 m-auto h-5 w-5 text-white/50" />}
                {noAr && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#2fe17a] shadow-[0_0_0_2px_rgba(0,0,0,.35)]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-[#1b1719]">{b.nome}</span>
                <span className="flex items-center gap-1 truncate text-[12.5px] text-[#8b8285]">
                  <MapPin className="h-3 w-3 flex-none" />{b.bairro || 'Foz do Iguaçu'}{nTelas ? ` · ${nTelas} ${nTelas === 1 ? 'tela' : 'telas'}` : ''}
                </span>
                {sd && (
                  <span className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${sd.c}`}>
                    <sd.i className="h-3 w-3" /> {sd.t}
                  </span>
                )}
              </span>
              <span className="flex flex-none items-center gap-0.5 text-[12px] font-semibold text-[#9C1E1E]">
                <span className="hidden sm:inline">Ver tela</span><ChevronRight className="h-4 w-4 text-[#c9c1c3] sm:text-[#9C1E1E]" />
              </span>
            </button>
          );
        })}
      </div>
      {!lista.length && <p className="py-8 text-center text-sm text-[#8b8285]">Nenhum prédio encontrado.</p>}

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[92dvh] max-w-5xl gap-0 overflow-y-auto rounded-[22px] border-0 bg-[#f3f1f2] p-0 sm:rounded-[22px] max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)] [&>button:last-child]:hidden">
          {aberto && (
            <PredioAoVivo
              predio={aberto}
              slots={slots}
              rules={rules}
              serverActiveSlotId={serverActiveSlotId}
              bloqueado={bloqueado}
              saude={visaoInterna ? saude[aberto.id] || null : null}
              visaoInterna={visaoInterna}
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
  visaoInterna?: boolean;
}> = ({ predio, slots, rules, serverActiveSlotId, bloqueado, saude, visaoInterna }) => {
  // Relógio ao vivo (segundo a segundo); o vídeo vencedor troca sozinho quando a agenda muda.
  const { now, atual, proximo } = useNoArAgora(slots, rules, serverActiveSlotId, 1000);
  const { weatherData } = useWeatherData();
  // Playlist REAL do prédio (todos os anunciantes, notícias, curiosidades e verticais), na ordem do painel
  const [playlist, setPlaylist] = useState<ItemReplica[] | null>(null);
  const [tocando, setTocando] = useState(0);
  useEffect(() => {
    let vivo = true;
    const ler = async () => {
      try {
        const { data } = await supabase.functions.invoke('exa2-replica-playlist', { body: { building_id: predio.id } });
        if (vivo && data?.ok && Array.isArray(data.itens)) setPlaylist(data.itens);
      } catch { /* sem playlist: mostra só o vídeo do pedido */ }
    };
    ler();
    const t = window.setInterval(ler, 5 * 60000);
    return () => { vivo = false; window.clearInterval(t); };
  }, [predio.id]);
  const slot = bloqueado ? null : atual?.slot || null;
  const minuteKey = Math.floor(now.getTime() / 60000);
  const segsHoje = useMemo(() => daySegments(slots, rules, now), [slots, rules, minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const minAgora = now.getHours() * 60 + now.getMinutes();
  const img = imgUrl(predio);
  const sd = saude ? SAUDE[saude] : null;

  return (
    <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
      <DialogPrimitive.Close className="absolute right-3 top-3 max-sm:top-[calc(env(safe-area-inset-top)+10px)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#554e50] shadow hover:text-[#9C1E1E]" aria-label="Fechar">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>

      {/* Réplica */}
      <div className="mx-auto w-full min-w-[220px]" style={{ maxWidth: 'min(100%, 340px, calc((100dvh - 120px) * 0.5625))' }}>
        <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1b1719] px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d5e]" /> AO VIVO
          </span>
          <span className="mr-12 truncate text-[11px] font-semibold text-[#8b8285] sm:mr-0">
            {visaoInterna && playlist?.length ? `${new Set(playlist.map((x) => x.url)).size} vídeos na programação` : 'tela do elevador'}
          </span>
        </div>
        <ReplicaPainel predioNome={predio.nome} slot={slot} now={now} clima={weatherData} playlist={playlist || undefined} onAtual={setTocando} />
      </div>

      {/* Informações */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3 pr-10">
          {img && <img src={img} alt="" className="h-14 w-14 flex-none rounded-2xl object-cover" />}
          <div className="min-w-0">
            <DialogTitle className="truncate text-2xl font-extrabold tracking-tight text-[#1b1719]">{predio.nome}</DialogTitle>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#8b8285]">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{predio.bairro || 'Foz do Iguaçu'}</span>
              {(predio.quantidade_telas || predio.numero_elevadores) ? <span>· {predio.quantidade_telas || predio.numero_elevadores} tela(s)</span> : null}
              {sd && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${sd.c}`}><sd.i className="h-3 w-3" />{sd.t}</span>}
            </div>
          </div>
        </div>

        {visaoInterna && playlist && playlist.length > 0 && (() => {
          const atualPl = playlist[tocando % playlist.length];
          const rotulo = (x: ItemReplica) => (x.seu ? 'Seu anúncio' : x.tipo === 'editorial' ? (x.titulo.split(/\s\d/)[0] || 'Notícias') : x.vertical ? 'Vertical premium · tela cheia' : 'Anúncio');
          const cor = (x: ItemReplica) => (x.seu ? 'bg-[#9C1E1E] text-white' : x.tipo === 'editorial' ? 'bg-[#e8f0fe] text-[#1d4ed8]' : x.vertical ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-[#f3f1f2] text-[#554e50]');
          const fila = Array.from({ length: Math.min(12, playlist.length) }, (_, k) => ({ k, x: playlist[(tocando + k) % playlist.length] }));
          return (
            <div className={`${CARD} p-4`}>
              <div className="text-xs font-extrabold tracking-wide text-[#13a24a]">● NA TELA AGORA</div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <span className="truncate text-lg font-extrabold text-[#1b1719]">{atualPl.seu ? atualPl.titulo : rotulo(atualPl)}</span>
                <span className={`flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold ${cor(atualPl)}`}>{rotulo(atualPl)}</span>
              </div>
              <div className="mt-3 border-t border-[#f1edee] pt-3">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b8285]">Fila desta tela · igual ao elevador</div>
                <ol className="space-y-1">
                  {fila.map(({ k, x }) => (
                    <li key={k} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] ${k === 0 ? 'bg-[#e6f6ec]' : ''}`}>
                      <span className="w-5 flex-none text-right text-[11px] font-bold tabular-nums text-[#b3aaad]">{k === 0 ? '▶' : k}</span>
                      <span className={`min-w-0 flex-1 truncate ${x.seu ? 'font-extrabold text-[#9C1E1E]' : 'font-semibold text-[#1b1719]'}`}>{x.seu ? x.titulo : rotulo(x)}</span>
                      <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ${cor(x)}`}>{x.seu ? 'seu' : x.tipo === 'editorial' ? 'notícias' : x.vertical ? 'vertical' : 'anúncio'}</span>
                      <span className="w-8 flex-none text-right text-[11px] tabular-nums text-[#8b8285]">{x.duracao}s</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          );
        })()}

        <div className={`${CARD} p-4`}>
          <div className="text-xs font-extrabold tracking-wide text-[#9C1E1E]">● SEU VÍDEO NESTE PRÉDIO</div>
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
            <div className="mb-2.5 text-sm font-extrabold text-[#1b1719]">Seus vídeos hoje nesta tela</div>
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


        <p className="flex gap-2 rounded-xl border border-[#f8e9ec] bg-[#fdf6f7] px-3 py-2.5 text-xs text-[#554e50]">
          <span aria-hidden>👁️</span>
          <span>
            Réplica da tela do <b>{predio.nome}</b> agora. Os avisos do condomínio ficam ocultos — são privados dos moradores.
          </span>
        </p>
      </div>
    </div>
  );
};
