import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Plus, Repeat, Star, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgendaRule, AgendaSlot, daySegments } from '@/lib/agenda/agendaEngine';
import type { EntregaAgenda, NovaProgramacao } from '@/hooks/exa2/usePedidoAgenda';
import { descreverRegra } from './OnAirCard';

const CORES = ['#9e1b34', '#2563eb', '#0f8a5f', '#c2740a', '#7c3aed', '#0e7490', '#db2777', '#4d7c0f', '#b45309', '#475569'];
export const corDoSlot = (s?: AgendaSlot) => (s ? (s.is_base_video ? CORES[0] : CORES[(s.slot_position % (CORES.length - 1)) + 1]) : '#cbd5e1');

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

interface Props {
  slots: AgendaSlot[];
  rules: AgendaRule[];
  saving: boolean;
  entrega?: EntregaAgenda | null;
  onReenviar?: () => void;
  dataInicio?: string | null;
  dataFim?: string | null;
  disabled?: boolean;
  checarConflitos: (n: NovaProgramacao) => AgendaRule[];
  salvarProgramacao: (n: NovaProgramacao) => Promise<void>;
  removerProgramacao: (id: string) => Promise<void>;
  onIrParaVideos: () => void;
}

export const AgendaTab: React.FC<Props> = (p) => {
  const { slots, rules } = p;
  const [view, setView] = useState<'semana' | 'mes'>('semana');
  const [offset, setOffset] = useState(0); // semanas (view semana) ou meses (view mes)
  const [novaOpen, setNovaOpen] = useState(false);
  const aprovados = slots.filter((s) => s.approved);
  const principal = slots.find((s) => s.is_base_video && s.approved);
  const slotById = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);

  const hoje = new Date();
  const semana = useMemo(() => {
    const ini = addDays(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), offset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(ini, i));
  }, [offset]); // eslint-disable-line react-hooks/exhaustive-deps

  const programacoes = rules
    .filter((r) => slotById.get(r.slotId))
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '') || slotById.get(a.slotId)!.slot_position - slotById.get(b.slotId)!.slot_position);

  return (
    <div className="space-y-5">
      {/* Os 3 jeitos de programar */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Star, t: 'Principal', d: 'Toca sempre que nada estiver programado. O pedido nunca fica sem vídeo.' },
          { icon: Repeat, t: 'Toda semana', d: 'Ex.: happy hour toda quarta e sexta, das 18h às 21h.' },
          { icon: CalendarDays, t: 'Em datas', d: 'Ex.: promoção de 20 a 22/11, o dia todo. Pode programar meses à frente.' },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-exa-red/10 text-exa-red"><I className="h-4 w-4" /></span>
              {t}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{d}</p>
          </div>
        ))}
      </div>
      {p.entrega && <EntregaBanner e={p.entrega} onReenviar={p.onReenviar} />}

      <p className="rounded-xl border border-exa-red/15 bg-exa-red/5 px-4 py-2.5 text-xs text-gray-700">
        Regra de ouro: <b>nunca passam dois vídeos ao mesmo tempo</b>. O mesmo vídeo toca em <b>todos os prédios</b> deste pedido.
      </p>

      {/* Prévia dos vídeos */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <h3 className="text-base font-extrabold text-gray-900">Seus vídeos</h3>
          <span className="text-xs font-semibold text-gray-400">a cor de cada um aparece na agenda</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {slots.map((s) => (
            <div key={s.id} className="w-40 flex-none overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-video bg-black">
                {s.url && <video src={s.url} className="h-full w-full object-cover" autoPlay muted loop playsInline />}
                <span className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full ring-2 ring-white" style={{ background: corDoSlot(s) }} />
                {!s.approved && <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-0.5 text-center text-[10px] font-bold text-white">em aprovação</span>}
              </div>
              <div className="truncate px-2 py-1.5 text-[11.5px] font-bold text-gray-800">
                {s.is_base_video && '★ '}
                {s.nome || `Vídeo ${s.slot_position}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visão */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          {(['semana', 'mes'] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setOffset(0); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold ${view === v ? 'bg-exa-red text-white' : 'text-gray-500'}`}
            >
              {v === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} className="rounded-lg border border-gray-200 bg-white p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[150px] text-center text-sm font-bold text-gray-700">
            {view === 'semana'
              ? offset === 0 ? 'Próximos 7 dias' : `${semana[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${semana[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
              : new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setOffset((o) => Math.min(view === 'semana' ? 17 : 4, o + 1))} className="rounded-lg border border-gray-200 bg-white p-1.5"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <button
          disabled={p.disabled || !aprovados.length}
          onClick={() => setNovaOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-exa-red px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Nova programação
        </button>
      </div>

      {view === 'semana' ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 ml-[78px] flex justify-between text-[10px] font-bold text-gray-400">
            {['0h', '6h', '12h', '18h', '24h'].map((h) => <span key={h}>{h}</span>)}
          </div>
          <div className="space-y-2">
            {semana.map((dia) => {
              const segs = daySegments(slots, rules, dia);
              const ehHoje = dia.toDateString() === hoje.toDateString();
              const agoraPct = ((hoje.getHours() * 60 + hoje.getMinutes()) / 1440) * 100;
              return (
                <div key={ymd(dia)} className="grid grid-cols-[70px_1fr] items-center gap-2">
                  <div className={`text-xs font-bold ${ehHoje ? 'text-exa-red' : 'text-gray-800'}`}>
                    {ehHoje ? 'Hoje' : DIAS[dia.getDay()]}
                    <span className="block text-[10.5px] font-medium text-gray-400">{dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <div className="relative h-12 overflow-hidden rounded-xl bg-gray-100">
                    {segs.map((sg, i) => {
                      const s = sg.winner?.slot;
                      const w = ((sg.endMin - sg.startMin) / 1440) * 100;
                      return (
                        <div
                          key={i}
                          title={`${hhmm(sg.startMin)}–${hhmm(sg.endMin)} · ${s?.nome || 'sem vídeo'}`}
                          className="absolute inset-y-1 flex items-center gap-1.5 overflow-hidden rounded-lg text-[10.5px] font-bold text-white"
                          style={{ left: `${(sg.startMin / 1440) * 100}%`, width: `calc(${w}% - 2px)`, background: corDoSlot(s) }}
                        >
                          {s?.url && w > 6 && <video src={`${s.url}#t=1`} className="h-full w-9 flex-none object-cover" preload="metadata" muted playsInline />}
                          {w > 12 && <span className="truncate pr-1.5">{s?.nome?.replace(/_/g, ' ') || '—'}{sg.winner?.rule ? '' : ' · principal'}</span>}
                        </div>
                      );
                    })}
                    {ehHoje && <div className="absolute inset-y-0 w-0.5 bg-gray-900" style={{ left: `${agoraPct}%` }} title="agora" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <MesView slots={slots} rules={rules} offset={offset} />
      )}

      {/* Lista de programações */}
      <section>
        <h3 className="mb-2 text-base font-extrabold text-gray-900">Programações ativas</h3>
        <div className="space-y-2">
          {principal && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <span className="h-3 w-3 flex-none rounded-full" style={{ background: corDoSlot(principal) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-gray-900">★ {principal.nome}</div>
                <div className="text-xs text-gray-500">Principal — toca quando nada estiver programado</div>
              </div>
              <button onClick={p.onIrParaVideos} className="text-xs font-bold text-exa-red hover:underline">Trocar principal</button>
            </div>
          )}
          {programacoes.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">Nenhuma programação ainda — o principal está no ar o tempo todo.</p>}
          {programacoes.map((r) => {
            const s = slotById.get(r.slotId)!;
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <span className="h-3 w-3 flex-none rounded-full" style={{ background: corDoSlot(s) }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-gray-900">{s.nome}</div>
                  <div className="text-xs text-gray-500">{descreverRegra(r)}</div>
                </div>
                <span className={`hidden rounded-full px-2 py-0.5 text-[10.5px] font-bold sm:inline ${r.rule_type === 'data' || r.start_date ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.rule_type === 'data' || r.start_date ? 'Por data' : 'Toda semana'}
                </span>
                <button
                  disabled={p.saving || p.disabled}
                  onClick={async () => {
                    if (!window.confirm('Remover esta programação? Nesse horário volta a tocar o principal.')) return;
                    try { await p.removerProgramacao(r.id); toast.success('Programação removida'); } catch (e: any) { toast.error(e.message || 'Erro ao remover'); }
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <NovaProgramacaoDialog
        open={novaOpen}
        onOpenChange={setNovaOpen}
        slots={aprovados}
        slotById={slotById}
        saving={p.saving}
        dataInicio={p.dataInicio}
        dataFim={p.dataFim}
        checarConflitos={p.checarConflitos}
        salvar={p.salvarProgramacao}
      />
    </div>
  );
};

const MesView: React.FC<{ slots: AgendaSlot[]; rules: AgendaRule[]; offset: number }> = ({ slots, rules, offset }) => {
  const hoje = new Date();
  const ini = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
  const diasNoMes = new Date(ini.getFullYear(), ini.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(ini.getDay()).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => new Date(ini.getFullYear(), ini.getMonth(), i + 1))];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[10.5px] font-extrabold text-gray-400">
        {DIAS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const segs = daySegments(slots, rules, d);
          const vistos = new Map<string, AgendaSlot>();
          segs.forEach((s) => s.winner && vistos.set(s.winner.slot.id, s.winner.slot));
          const ehHoje = d.toDateString() === hoje.toDateString();
          return (
            <div key={i} className={`min-h-[64px] rounded-lg border p-1.5 ${ehHoje ? 'border-exa-red ring-1 ring-exa-red' : 'border-gray-200'}`}>
              <div className="text-xs font-bold text-gray-700">{d.getDate()}</div>
              <div className="mt-0.5 space-y-0.5">
                {[...vistos.values()].slice(0, 3).map((s) => (
                  <div key={s.id} className="truncate rounded px-1 text-[9px] font-bold text-white" style={{ background: corDoSlot(s), opacity: s.is_base_video ? 0.55 : 1 }}>
                    {s.is_base_video ? '★' : `V${s.slot_position}`} {s.nome?.split(/[_ ·-]/).slice(1, 3).join(' ')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slots: AgendaSlot[];
  slotById: Map<string, AgendaSlot>;
  saving: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  checarConflitos: (n: NovaProgramacao) => AgendaRule[];
  salvar: (n: NovaProgramacao) => Promise<void>;
}

const NovaProgramacaoDialog: React.FC<DialogProps> = ({ open, onOpenChange, slots, slotById, saving, dataInicio, dataFim, checarConflitos, salvar }) => {
  const hojeStr = new Date().toISOString().slice(0, 10);
  const minData = dataInicio && dataInicio > hojeStr ? dataInicio : hojeStr;
  const maxData = dataFim || undefined;
  const [slotId, setSlotId] = useState('');
  const [tipo, setTipo] = useState<'data' | 'recorrente'>('data');
  const [label, setLabel] = useState('');
  const [ini, setIni] = useState(minData);
  const [fim, setFim] = useState(minData);
  const [dias, setDias] = useState<number[]>([]);
  const [diaTodo, setDiaTodo] = useState(true);
  const [hIni, setHIni] = useState('18:00');
  const [hFim, setHFim] = useState('21:00');
  const [conflitos, setConflitos] = useState<AgendaRule[] | null>(null);

  const reset = () => { setConflitos(null); };
  const montar = (override = false): NovaProgramacao => ({
    slotId: slotId || slots.find((s) => !s.is_base_video)?.id || slots[0]?.id,
    rule_type: tipo,
    label: label.trim() || undefined,
    start_date: tipo === 'data' ? ini : null,
    end_date: tipo === 'data' ? (fim < ini ? ini : fim) : null,
    days_of_week: tipo === 'recorrente' ? dias : [],
    is_all_day: diaTodo,
    start_time: hIni,
    end_time: hFim,
    is_override: override,
  });

  const validar = (): string | null => {
    const n = montar();
    if (!n.slotId) return 'Escolha um vídeo';
    if (tipo === 'recorrente' && !dias.length) return 'Escolha pelo menos um dia da semana';
    if (tipo === 'data' && maxData && (n.end_date as string) > maxData) return `Seu pedido vai até ${maxData.split('-').reverse().join('/')}. Escolha datas dentro desse período.`;
    if (!diaTodo && hIni === hFim) return 'O horário de início e fim não podem ser iguais';
    return null;
  };

  const confirmar = async (override = false) => {
    const erro = validar();
    if (erro) { toast.error(erro); return; }
    const n = montar(override);
    if (!override) {
      const c = checarConflitos(n);
      if (c.length) { setConflitos(c); return; }
    }
    try {
      await salvar(n);
      toast.success(override ? 'Programado! Nessa janela o seu vídeo sobrepõe o que estava agendado.' : 'Programação salva!');
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível salvar');
    }
  };

  const input = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-exa-red focus:outline-none';

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova programação</DialogTitle>
        </DialogHeader>

        {conflitos ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle className="h-5 w-5" /> Já existe vídeo nesse horário</div>
              <p className="mt-1 text-sm text-amber-900">Como nunca passam dois vídeos ao mesmo tempo, você decide:</p>
              <ul className="mt-2 space-y-1">
                {conflitos.map((c) => (
                  <li key={c.id} className="text-xs text-amber-900">• <b>{slotById.get(c.slotId)?.nome}</b> — {descreverRegra(c)}</li>
                ))}
              </ul>
            </div>
            <button disabled={saving} onClick={() => confirmar(true)} className="w-full rounded-xl bg-exa-red px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Sobrepor só nessa janela'}
            </button>
            <p className="-mt-2 text-center text-[11px] text-gray-500">Fora dessa janela, a programação atual continua igual.</p>
            <button onClick={reset} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">Escolher outro horário</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Qual vídeo?</label>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((s) => {
                  const sel = (slotId || slots.find((x) => !x.is_base_video)?.id || slots[0]?.id) === s.id;
                  return (
                    <button key={s.id} onClick={() => setSlotId(s.id)} className={`overflow-hidden rounded-xl border-2 text-left ${sel ? 'border-exa-red' : 'border-gray-200'}`}>
                      <div className="aspect-video bg-black">{s.url && <video src={s.url} className="h-full w-full object-cover" muted autoPlay loop playsInline />}</div>
                      <div className="truncate px-2 py-1 text-[11px] font-bold">{s.is_base_video && '★ '}{s.nome}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Quando?</label>
              <div className="grid grid-cols-2 gap-2">
                {([['data', 'Em datas', CalendarDays], ['recorrente', 'Toda semana', Repeat]] as const).map(([v, t, I]) => (
                  <button key={v} onClick={() => setTipo(v)} className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold ${tipo === v ? 'border-exa-red bg-exa-red/5 text-exa-red' : 'border-gray-200 text-gray-600'}`}>
                    <I className="h-4 w-4" /> {t}
                  </button>
                ))}
              </div>
            </div>

            {tipo === 'data' ? (
              <div className="grid grid-cols-2 gap-2">
                <div><label className="mb-1 block text-xs font-bold text-gray-500">De</label><input type="date" className={input} min={minData} max={maxData} value={ini} onChange={(e) => { setIni(e.target.value); if (fim < e.target.value) setFim(e.target.value); }} /></div>
                <div><label className="mb-1 block text-xs font-bold text-gray-500">Até</label><input type="date" className={input} min={ini} max={maxData} value={fim} onChange={(e) => setFim(e.target.value)} /></div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">Dias da semana</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS.map((d, i) => (
                    <button key={d} onClick={() => setDias((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${dias.includes(i) ? 'bg-exa-red text-white' : 'bg-gray-100 text-gray-600'}`}>{d}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={diaTodo} onChange={(e) => setDiaTodo(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--exa-red))]" />
                O dia todo
              </label>
              {!diaTodo && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div><label className="mb-1 block text-xs font-bold text-gray-500">Das</label><input type="time" className={input} value={hIni} onChange={(e) => setHIni(e.target.value)} /></div>
                  <div><label className="mb-1 block text-xs font-bold text-gray-500">Até</label><input type="time" className={input} value={hFim} onChange={(e) => setHFim(e.target.value)} /></div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Nome (opcional)</label>
              <input className={input} placeholder="Ex.: Promo Black Friday" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
            </div>

            <button disabled={saving} onClick={() => confirmar(false)} className="w-full rounded-xl bg-exa-red px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Salvar programação'}
            </button>
            {maxData && <p className="-mt-2 text-center text-[11px] text-gray-500">Seu pedido vai até {maxData.split('-').reverse().join('/')}.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/** Situação do envio da agenda aos painéis — "enviado" não é "no ar": a confirmação vem do elevador. */
const EntregaBanner: React.FC<{ e: EntregaAgenda; onReenviar?: () => void }> = ({ e, onReenviar }) => {
  const hora = new Date(e.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const cfg = {
    enviando: { cls: 'border-blue-200 bg-blue-50 text-blue-800', txt: 'Enviando a programação para os painéis…' },
    enviado: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', txt: `Programação enviada aos painéis às ${hora}${e.telas ? ` (${e.telas} envio${e.telas > 1 ? 's' : ''})` : ''}. Os elevadores aplicam em até 5 minutos.` },
    parcial: { cls: 'border-amber-200 bg-amber-50 text-amber-800', txt: `Enviada, mas ${e.falhas} painel(is) não respondeu(ram). Vamos reenviar automaticamente.` },
    erro: { cls: 'border-amber-200 bg-amber-50 text-amber-800', txt: 'Sua programação foi salva, mas o envio aos painéis não completou agora. Vamos reenviar automaticamente.' },
  }[e.estado];
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-semibold ${cfg.cls}`}>
      <span className="flex items-center gap-2">{e.estado === 'enviando' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{cfg.txt}</span>
      {(e.estado === 'erro' || e.estado === 'parcial') && onReenviar && (
        <button onClick={onReenviar} className="shrink-0 rounded-lg bg-white/70 px-2.5 py-1 font-bold underline-offset-2 hover:underline">Reenviar agora</button>
      )}
    </div>
  );
};
