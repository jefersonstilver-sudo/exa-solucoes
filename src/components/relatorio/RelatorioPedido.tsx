// EXA (06/11/2026) — Relatório do pedido para o anunciante: o que foi exibido, onde, quantas vezes (estimado pela
// programação), disponibilidade das telas, histórico de vídeos publicados e PDF. Usado em /anunciante/relatorios/:id
// e na aba "Relatório" do pedido.
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, Clapperboard, Download, Eye, Film, Info, Loader2, MonitorPlay, Timer, Users, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { CARD, EYEBROW, H_SEC, BTN, BTN_SOFT, BADGE } from '@/components/pedido-v2/ui';
import { useRelatorio, nf, dataBR, mesBR, SITUACAO, SERIE, type Relatorio } from './useRelatorio';
import { baixarRelatorioPdf } from './relatorioPdf';

const Num = ({ icon: I, valor, rotulo, dica }: { icon: React.ElementType; valor: string; rotulo: string; dica?: string }) => (
  <div className={`${CARD} p-4`} title={dica}>
    <I className="mb-2 h-[18px] w-[18px] text-[#9C1E1E]" />
    <div className="text-[22px] font-extrabold leading-none tracking-tight text-[#1b1719] tabular-nums">{valor}</div>
    <div className="mt-1.5 text-[12px] font-semibold text-[#8b8285]">{rotulo}</div>
  </div>
);

const BotaoPdf = ({ r }: { r: Relatorio }) => {
  const [gerando, setGerando] = useState(false);
  return (
    <button
      className={BTN}
      disabled={gerando}
      onClick={async () => {
        setGerando(true);
        try { await baixarRelatorioPdf(r); } catch { toast.error('Não consegui gerar o PDF agora.'); } finally { setGerando(false); }
      }}
    >
      {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Baixar PDF
    </button>
  );
};

export const RelatorioPedido = ({ pedidoId, compacto = false }: { pedidoId: string; compacto?: boolean }) => {
  const q = useRelatorio(pedidoId);
  const [todosPredios, setTodosPredios] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'cinema' | 'hotel' | 'geral'>('todos');
  const r = q.data;
  const videos = useMemo(() => (r?.videos || []).filter((v) => filtro === 'todos' || v.serie === filtro), [r, filtro]);

  if (q.isLoading) return <div className={`${CARD} flex items-center justify-center gap-2 p-10 text-sm text-[#8b8285]`}><Loader2 className="h-4 w-4 animate-spin" /> Montando seu relatório…</div>;
  if (q.error) return <div className={`${CARD} p-6 text-sm text-[#8b8285]`}>{(q.error as Error).message}</div>;
  if (!r) return null;
  if (r.pendente) return <div className={`${CARD} p-6 text-sm text-[#8b8285]`}>{r.aviso}</div>;

  const series = Object.entries(r.publicacoes.series);
  const temSeries = series.length > 1 || series.some(([k]) => k !== 'geral');
  const predios = todosPredios ? r.predios : r.predios.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* topo */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="bg-[#9C1E1E] bg-[radial-gradient(120%_90%_at_0%_0%,#b2272d_0%,rgba(178,39,45,0)_60%)] px-5 py-5 text-white sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.11em] text-white/70">Relatório de veiculação</div>
              {!compacto && <h2 className="mt-1 text-xl font-extrabold tracking-tight">{r.pedido.nome}</h2>}
              <div className="mt-1 text-[13px] text-white/85">{r.formato.produto} · {dataBR(r.pedido.inicio)} a {dataBR(r.pedido.fim)}</div>
            </div>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#9C1E1E] transition hover:bg-[#f8e9ec]"
              onClick={() => baixarRelatorioPdf(r).catch(() => toast.error('Não consegui gerar o PDF agora.'))}
            >
              <Download className="h-4 w-4" /> Baixar PDF
            </button>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[12px] text-white/80">
              <span>{r.pedido.dias_no_ar} dias no ar</span>
              {r.pedido.dias_restantes != null && <span>{r.pedido.dias_restantes} dias restantes</span>}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${r.pedido.progresso}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* números */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Num icon={Eye} valor={nf(r.totais.exibicoes)} rotulo="exibições (estimadas)" dica="Estimadas pela programação dos painéis; veja a metodologia no fim." />
        <Num icon={Timer} valor={nf(r.totais.media_dia)} rotulo="exibições por dia" />
        <Num icon={MonitorPlay} valor={`${nf(r.totais.predios)} · ${nf(r.totais.telas)}`} rotulo="prédios · telas" />
        <Num icon={Wifi} valor={`${r.totais.disponibilidade.toLocaleString('pt-BR')}%`} rotulo="do tempo com telas no ar" />
        <Num icon={Clapperboard} valor={nf(r.totais.horas_tela)} rotulo="horas da sua marca na tela" />
        <Num icon={Film} valor={nf(r.totais.videos_publicados)} rotulo={`vídeos publicados · ${r.totais.videos_no_ar} no ar`} />
        <Num icon={Users} valor={nf(r.totais.publico)} rotulo="moradores e visitantes" dica="Público estimado dos prédios onde sua marca aparece." />
        <Num icon={Building2} valor={nf(r.formato.exibicoes_dia_tela)} rotulo="vezes por tela por dia" />
      </div>

      {/* gráfico */}
      {r.meses.length > 0 && (
        <section className={`${CARD} p-5`}>
          <div className={EYEBROW}>Ao longo do contrato</div>
          <h3 className={H_SEC}>Exibições por mês</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.meses.map((m) => ({ ...m, rotulo: mesBR(m.mes) }))} margin={{ left: 0, right: 4, top: 6, bottom: 0 }}>
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b8285' }} />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 11, fill: '#8b8285' }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip cursor={{ fill: '#f7f5f6' }} formatter={(v: number) => [nf(v), 'exibições']} labelStyle={{ fontWeight: 700 }} contentStyle={{ borderRadius: 12, border: '1px solid #ebe6e7', fontSize: 12 }} />
                <Bar dataKey="exibicoes" fill="#9C1E1E" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* vídeos */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3">
          <div>
            <div className={EYEBROW}>Histórico</div>
            <h3 className={H_SEC}>Vídeos publicados</h3>
          </div>
          {temSeries && (
            <div className="flex gap-1 rounded-xl bg-[#f7f5f6] p-1">
              {(['todos', ...series.map(([k]) => k)] as const).map((k) => (
                <button key={k} onClick={() => setFiltro(k as any)} className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${filtro === k ? 'bg-white text-[#9C1E1E] shadow-sm' : 'text-[#8b8285]'}`}>
                  {k === 'todos' ? 'Todos' : SERIE[k as keyof typeof SERIE] || k}
                </button>
              ))}
            </div>
          )}
        </div>
        {temSeries && (
          <div className="grid gap-2 px-5 pb-3 sm:grid-cols-3">
            {series.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#f7f5f6] px-3 py-2.5">
                <div className="text-[18px] font-extrabold text-[#1b1719]">{v.videos}</div>
                <div className="text-[12px] text-[#8b8285]">vídeos de {SERIE[k as keyof typeof SERIE]?.toLowerCase() || k} em {v.semanas} semana{v.semanas === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        )}
        <ul className="divide-y divide-[#f1edee] border-t border-[#f1edee]">
          {videos.map((v) => (
            <li key={v.id} className="flex items-start gap-3 px-5 py-3">
              <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl ${v.serie === 'cinema' ? 'bg-[#f8e9ec] text-[#9e1b34]' : v.serie === 'hotel' ? 'bg-[#e8eefd] text-[#2563eb]' : 'bg-[#f7f5f6] text-[#8b8285]'}`}>
                {v.serie === 'cinema' ? <Clapperboard className="h-4 w-4" /> : <Film className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[14px] font-bold text-[#1b1719]">{v.nome}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${v.situacao === 'no_ar' ? BADGE.ar : BADGE.parado}`}>{SITUACAO[v.situacao]}</span>
                  {v.principal && <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${BADGE.principal}`}>Principal</span>}
                </div>
                <div className="mt-0.5 text-[12.5px] text-[#8b8285]">
                  Publicado em {dataBR(v.publicado_em)} · {v.duracao}s · {v.orientacao}
                  {v.periodo && v.situacao !== 'no_ar' && <> · no ar até {dataBR(v.periodo.ate)}</>}
                  {v.programacao && <> · {v.programacao}</>}
                </div>
              </div>
              {v.exibicoes != null && (
                <div className="flex-none text-right">
                  <div className="text-[14px] font-extrabold tabular-nums text-[#1b1719]">{nf(v.exibicoes)}</div>
                  <div className="text-[11px] text-[#8b8285]">exibições</div>
                </div>
              )}
            </li>
          ))}
          {!videos.length && <li className="px-5 py-6 text-sm text-[#8b8285]">Nenhum vídeo neste filtro.</li>}
        </ul>
      </section>

      {/* prédios */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="p-5 pb-3">
          <div className={EYEBROW}>Onde sua marca aparece</div>
          <h3 className={H_SEC}>Prédios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-y border-[#f1edee] text-left text-[11px] font-bold uppercase tracking-wide text-[#8b8285]">
                <th className="px-5 py-2">Prédio</th><th className="px-2 py-2 text-right">Telas</th><th className="px-2 py-2 text-right">No ar</th><th className="px-5 py-2 text-right">Exibições</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1edee]">
              {predios.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5"><div className="font-semibold text-[#1b1719]">{p.nome}</div><div className="text-[11.5px] text-[#8b8285]">{p.bairro}</div></td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.telas}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.disponibilidade.toLocaleString('pt-BR')}%</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums">{nf(p.exibicoes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.predios.length > 8 && (
          <div className="p-3 text-center">
            <button className={BTN_SOFT} onClick={() => setTodosPredios((x) => !x)}>{todosPredios ? 'Mostrar menos' : `Ver os ${r.predios.length} prédios`}</button>
          </div>
        )}
      </section>

      {/* metodologia */}
      <section className={`${CARD} flex gap-3 p-5`}>
        <Info className="mt-0.5 h-4 w-4 flex-none text-[#8b8285]" />
        <div>
          <div className="text-[13px] font-bold text-[#1b1719]">Como calculamos</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8b8285]">{r.metodologia}</p>
          <p className="mt-1 text-[11.5px] text-[#a79fa2]">Atualizado em {new Date(r.gerado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.</p>
        </div>
      </section>

      <div className="flex justify-center pb-2"><BotaoPdf r={r} /></div>
    </div>
  );
};

export default RelatorioPedido;
