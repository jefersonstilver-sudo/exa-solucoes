// EXA (06/11/2026) — Relatório do pedido para o anunciante (layout aprovado pelo Jeferson em 06/11):
// herói com o total e a tela do elevador com o vídeo no ar, números, "como sua marca aparece" (a rodada desenhada),
// linha do tempo dos vídeos por série + barras por mês, cartões de vídeo com miniatura, mapa e ranking de prédios, PDF.
// Usado em /anunciante/relatorios/:id e na aba "Relatório" do pedido.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Info, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useLogoEmpresa } from '@/hooks/exa2/useLogoEmpresa';
import { useRelatorio, nf, dataBR, mesCurto, periodoTexto, SERIE, type Relatorio, type RelatorioVideo } from './useRelatorio';
import { miniaturaDoVideo, montarMapa } from './midia';
import { baixarRelatorioPdf } from './relatorioPdf';

const CARD = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const EYEBROW = 'text-[12px] font-bold uppercase tracking-[0.11em] text-[#9C1E1E]';
const H2 = 'mt-1 text-[21px] font-extrabold tracking-tight text-[#1b1719]';
const COR_SERIE: Record<string, string[]> = { cinema: ['#9E1B34', '#B63B52'], hotel: ['#2563EB', '#5B8DEF'], geral: ['#6F6669', '#9A9194'] };

export const useMiniatura = (url?: string | null) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { let vivo = true; miniaturaDoVideo(url).then((s) => vivo && setSrc(s)); return () => { vivo = false; }; }, [url]);
  return src;
};

const Miniatura = ({ v, className }: { v?: RelatorioVideo | null; className: string }) => {
  const src = useMiniatura(v?.url);
  const fundo = v?.serie === 'hotel' ? 'bg-[#1E2C4F]' : 'bg-[#3B1F27]';
  return (
    <div className={`${className} ${fundo} relative flex flex-none items-center justify-center overflow-hidden`}>
      {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Play className="h-5 w-5 text-white/70" />}
    </div>
  );
};

const LogoCliente = ({ clientId, nome }: { clientId?: string; nome: string }) => {
  const logo = useLogoEmpresa(clientId || null, null);
  return logo ? (
    <img src={logo} alt={nome} className="h-[52px] w-[52px] flex-none rounded-2xl bg-white object-contain p-1 shadow-sm" />
  ) : (
    <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-[#1b1719] text-lg font-extrabold text-white">{nome.slice(0, 1).toUpperCase()}</div>
  );
};

/** A rodada típica de hoje: horizontais em cinza, a marca em vermelho (tela cheia), notícia em azul. */
const Rodada = ({ r }: { r: Relatorio }) => {
  const t = r.rodada_tipica || { horizontais: 12, verticais: 3, verticais_por_rodada: 4, segundos: 0 };
  const nH = Math.min(15, t.horizontais);
  const blocos: ('h' | 'v' | 'n' | 'o')[] = [];
  const vertical = r.formato.tela_cheia;
  let nV = 0;
  const pushV = () => { blocos.push(vertical ? (nV % Math.max(1, t.verticais) === 0 ? 'v' : 'o') : 'o'); nV++; };
  for (let h = 0; h < nH; h++) { blocos.push(vertical ? 'h' : h === 0 ? 'v' : 'h'); if ((h + 1) % 3 === 0 && h + 1 < nH && t.verticais) pushV(); }
  blocos.push('n');
  if (t.verticais) pushV();
  const seg = t.segundos || r.formato.ciclo_s;
  const tempo = seg >= 60 ? `${Math.floor(seg / 60)} min ${String(seg % 60).padStart(2, '0')} s` : `${seg} s`;
  return (
    <section className={`${CARD} p-6 sm:p-7`}>
      <div className={EYEBROW}>Em cada tela</div>
      <h2 className={H2}>Como a sua marca aparece</h2>
      <p className="mt-1.5 max-w-[700px] text-[15px] leading-relaxed text-[#6F6669]">
        Os anúncios tocam em rodadas.{' '}
        {vertical ? 'A sua marca entra em tela cheia, sozinha na tela inteira, revezando com os outros verticais.' : 'A sua marca aparece uma vez em cada rodada.'} Uma rodada dura cerca de {tempo}: são{' '}
        <strong className="text-[#1b1719]">{nf(r.formato.exibicoes_dia_tela)} vezes por dia em cada tela</strong>.
      </p>
      <div className="mt-5 flex items-end gap-1.5 overflow-x-auto pb-1">
        {blocos.map((b, i) => (
          <div
            key={i}
            className={
              b === 'v' ? 'flex h-[84px] w-[46px] flex-none items-center justify-center rounded-[10px] bg-[#9C1E1E] text-[10px] font-extrabold text-white'
              : b === 'o' ? 'h-[84px] w-[46px] flex-none rounded-[10px] bg-[#E9D3D7]'
              : b === 'n' ? 'flex h-[38px] w-[92px] flex-none items-center justify-center rounded-lg bg-[#C9D6F2] text-[10px] font-bold text-[#2A3F6E]'
              : 'h-[38px] w-[46px] flex-none rounded-lg bg-[#E4DEE0]'
            }
          >
            {b === 'v' ? 'VOCÊ' : b === 'n' ? 'Notícia' : ''}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-[#6F6669]">
        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-[#9C1E1E]" />Sua marca</span>
        {vertical && <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-[#E9D3D7]" />Outros verticais</span>}
        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-[#E4DEE0]" />{vertical ? 'Anúncios horizontais' : 'Outros anunciantes'}</span>
        <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-[#C9D6F2]" />Notícias</span>
      </div>
    </section>
  );
};

/** Faixas por série (cinema, hotel…) no período do contrato + barras por mês. */
const LinhaDoTempo = ({ r }: { r: Relatorio }) => {
  const ini = Date.parse(r.pedido.inicio + 'T00:00:00');
  const fim = Date.now();
  const tot = Math.max(1, fim - ini);
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - ini) / tot) * 100));
  const series = ['cinema', 'hotel', 'geral'].filter((s) => r.videos.some((v) => v.serie === s && v.periodo));
  const max = Math.max(1, ...r.meses.map((m) => m.exibicoes));
  return (
    <section className={`${CARD} p-6 sm:p-7`}>
      <div className={EYEBROW}>Linha do tempo</div>
      <h2 className={H2}>O que esteve nas telas, mês a mês</h2>
      <p className="mt-1.5 text-[15px] text-[#6F6669]">Cada bloco é um vídeo. Quando um vídeo novo entra, ele toma o lugar do anterior.</p>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[560px] space-y-3">
          {series.map((s) => (
            <div key={s} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
              <div className="text-[13px] font-extrabold" style={{ color: COR_SERIE[s][0] }}>{SERIE[s as keyof typeof SERIE]}</div>
              <div className="relative h-10 rounded-xl bg-[#F7F5F6]">
                {r.videos.filter((v) => v.serie === s && v.periodo).map((v, i) => {
                  const a = pct(Date.parse(v.periodo!.de)), b = pct(Date.parse(v.periodo!.ate));
                  return (
                    <div
                      key={v.id}
                      title={`${v.titulo} · ${periodoTexto(v)}`}
                      className="absolute bottom-[5px] top-[5px] rounded-[7px] shadow-[inset_-2px_0_0_#fff]"
                      style={{ left: `${a}%`, width: `${Math.max(0.9, b - a)}%`, background: COR_SERIE[s][i % 2] }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3">
            <div />
            <div className="grid items-end gap-2" style={{ gridTemplateColumns: `repeat(${r.meses.length}, minmax(0, 1fr))`, height: 140 }}>
              {r.meses.map((m, i) => {
                const parcial = i === 0 || i === r.meses.length - 1;
                return (
                  <div key={m.mes} className="flex h-[140px] flex-col items-center justify-end gap-1.5">
                    <div className="text-[11px] font-bold text-[#6F6669]">{nf(m.exibicoes / 1000)} mil</div>
                    <div className="w-full max-w-[44px] rounded-t-lg rounded-b-sm" style={{ height: Math.max(4, Math.round((m.exibicoes / max) * 90)), background: parcial ? '#D9A3AC' : '#9C1E1E' }} />
                    <div className="text-[12px] font-bold text-[#1b1719]">{mesCurto(m.mes)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-[13px] text-[#6F6669]">Exibições por mês. O primeiro e o mês atual estão incompletos.</div>
    </section>
  );
};

const CartaoVideo = ({ v }: { v: RelatorioVideo }) => (
  <article className={`${CARD} flex gap-3.5 p-3.5`}>
    <Miniatura v={v} className="h-[118px] w-[66px] rounded-xl" />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${v.serie === 'hotel' ? 'bg-[#E8EEFD] text-[#2557C7]' : v.serie === 'cinema' ? 'bg-[#F8E9EC] text-[#9E1B34]' : 'bg-[#F0ECEA] text-[#6F6669]'}`}>{SERIE[v.serie]}</span>
        {v.situacao === 'no_ar' && <span className="rounded-full bg-[#E6F6EC] px-2.5 py-0.5 text-[11px] font-extrabold text-[#13A24A]">No ar</span>}
        {v.situacao === 'pausado' && <span className="rounded-full bg-[#F0ECEA] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6F6669]">Em pausa</span>}
      </div>
      <div className="text-[14px] font-extrabold leading-snug text-[#1b1719]">{v.titulo}</div>
      <div className="text-[12.5px] leading-snug text-[#6F6669]">{periodoTexto(v)}</div>
      {v.exibicoes != null && (
        <div className="mt-auto">
          <div className="text-[20px] font-extrabold tracking-tight text-[#1b1719] tabular-nums">{nf(v.exibicoes)}</div>
          <div className="-mt-0.5 text-[11.5px] text-[#6F6669]">exibições</div>
        </div>
      )}
    </div>
  </article>
);

const Mapa = ({ r }: { r: Relatorio }) => {
  const W = 560, H = 340;
  const m = useMemo(() => montarMapa(r.predios.map((p) => ({ lat: p.lat || 0, lng: p.lng || 0, nome: p.nome })), W, H), [r]);
  const caixa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const el = caixa.current; if (!el) return;
    const ajustar = () => setEscala(el.clientWidth / W);
    ajustar();
    const ro = new ResizeObserver(ajustar); ro.observe(el);
    return () => ro.disconnect();
  }, [m]);
  if (!m) return <div className="flex h-[300px] items-center justify-center rounded-[20px] bg-[#F7F5F6] text-sm text-[#6F6669]">Mapa indisponível</div>;
  return (
    <div ref={caixa} className="relative w-full overflow-hidden rounded-[20px] bg-[#EEF1EE]" style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${escala})` }}>
        {m.tiles.map((t) => <img key={t.url} src={t.url} alt="" className="absolute h-[256px] w-[256px] max-w-none" style={{ left: t.left, top: t.top }} />)}
        <div className="absolute inset-0 bg-white/15" />
        {m.pos.map((p) => (
          <span key={p.nome + p.left} title={p.nome} className="absolute h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#9C1E1E] shadow-[0_2px_6px_rgba(0,0,0,.3)]" style={{ left: p.left, top: p.top }} />
        ))}
      </div>
      <span className="absolute bottom-1 right-2 rounded bg-white/70 px-1 text-[10px] text-black/60">© OpenStreetMap</span>
    </div>
  );
};

export const RelatorioPedido = ({ pedidoId, compacto = false }: { pedidoId: string; compacto?: boolean }) => {
  const q = useRelatorio(pedidoId);
  const [filtro, setFiltro] = useState<'todos' | 'cinema' | 'hotel' | 'geral'>('todos');
  const [todosVideos, setTodosVideos] = useState(false);
  const [todosPredios, setTodosPredios] = useState(false);
  const [gerando, setGerando] = useState(false);
  const r = q.data;
  const logo = useLogoEmpresa(r?.pedido.client_id || null, null);

  if (q.isLoading) return <div className={`${CARD} flex items-center justify-center gap-2 p-10 text-sm text-[#6F6669]`}><Loader2 className="h-4 w-4 animate-spin" /> Montando seu relatório…</div>;
  if (q.error) return <div className={`${CARD} p-6 text-sm text-[#6F6669]`}>{(q.error as Error).message}</div>;
  if (!r) return null;
  if (r.pendente) return <div className={`${CARD} p-6 text-sm text-[#6F6669]`}>{r.aviso}</div>;

  const noAr = r.videos.find((v) => v.situacao === 'no_ar') || r.videos[0];
  const series = [...new Set(r.videos.map((v) => v.serie))];
  const filtrados = r.videos.filter((v) => filtro === 'todos' || v.serie === filtro);
  const videos = todosVideos ? filtrados : filtrados.slice(0, 8);
  const predios = todosPredios ? r.predios : r.predios.slice(0, 6);
  const nomeCampanha = r.pedido.cliente || r.pedido.nome;
  const pdf = async () => {
    setGerando(true);
    try { await baixarRelatorioPdf(r, logo); } catch { toast.error('Não consegui gerar o PDF agora.'); } finally { setGerando(false); }
  };
  const qtdSerie = (s: string) => r.videos.filter((v) => v.serie === s).length;

  return (
    <div className="space-y-5 font-[inherit]">
      {/* topo */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <LogoCliente clientId={r.pedido.client_id} nome={nomeCampanha} />
          <div className="min-w-0">
            <div className={EYEBROW}>Relatório da campanha</div>
            {!compacto && <h1 className="truncate text-[24px] font-extrabold tracking-tight text-[#1b1719]">{r.pedido.nome}</h1>}
            <div className="text-[14px] text-[#6F6669]">{r.formato.tela_cheia ? 'Vertical Premium' : 'Horizontal'} · {dataBR(r.pedido.inicio)} a {dataBR(r.pedido.fim)}</div>
          </div>
        </div>
        <button onClick={pdf} disabled={gerando} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#9C1E1E] px-5 text-sm font-bold text-white transition hover:bg-[#7c1428] disabled:opacity-60">
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {gerando ? 'Gerando PDF…' : 'Baixar PDF'}
        </button>
      </header>

      {/* herói */}
      <section className="flex flex-wrap items-center gap-8 overflow-hidden rounded-[28px] bg-[#6D1317] bg-[radial-gradient(120%_90%_at_0%_0%,#8f1f24_0%,rgba(143,31,36,0)_60%)] p-7 text-white sm:p-9">
        <div className="min-w-0 flex-[999_1_420px] space-y-4">
          <div className="text-[15px] font-semibold text-[#F4CFD3]">Desde {dataBR(r.pedido.inicio)}, a sua marca apareceu</div>
          <div className="text-[52px] font-extrabold leading-[.95] tracking-[-0.04em] sm:text-[72px]">
            {nf(r.totais.exibicoes)}<span className="text-[24px] font-bold tracking-normal sm:text-[30px]"> vezes</span>
          </div>
          <div className="max-w-[520px] text-[16px] leading-relaxed text-[#F9E4E6]">
            {r.formato.tela_cheia ? 'em tela cheia, ' : ''}nos elevadores de <strong className="text-white">{r.totais.predios} prédios</strong> de Foz do Iguaçu, onde moradores passam todos os dias.
          </div>
          <div className="max-w-[520px] space-y-2">
            <div className="flex justify-between text-[13px] text-[#F4CFD3]">
              <span>{r.pedido.dias_no_ar} dias no ar</span>
              {r.pedido.dias_restantes != null && <span>{r.pedido.dias_restantes} dias restantes</span>}
            </div>
            <div className="h-2.5 rounded-full bg-white/20"><div className="h-2.5 rounded-full bg-white" style={{ width: `${r.pedido.progresso}%` }} /></div>
          </div>
        </div>
        <div className="flex flex-[1_1_200px] flex-col items-center gap-3">
          <div className="rounded-[22px] bg-[#141012] p-[9px] shadow-[0_24px_50px_-18px_rgba(0,0,0,.6)]">
            <Miniatura v={noAr} className={r.formato.tela_cheia ? 'h-[320px] w-[180px] rounded-[15px]' : 'h-[150px] w-[180px] rounded-[15px]'} />
          </div>
          {noAr && <div className="flex items-center gap-2 text-[13px] font-bold"><span className="h-2 w-2 rounded-full bg-[#3DDC84]" />{noAr.situacao === 'no_ar' ? 'No ar agora' : 'Último vídeo'} · {noAr.titulo}</div>}
        </div>
      </section>

      {/* números */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [nf(r.totais.media_dia), 'exibições por dia', 'somando todas as telas onde a sua marca está'],
          [`${r.formato.minutos_dia_tela} min`, 'por dia em cada tela', `${r.formato.participacao.toLocaleString('pt-BR')}% de todo o tempo da tela${r.formato.tela_cheia ? ', em tela cheia' : ''}`],
          [`${nf(r.totais.horas_tela)} h`, 'da sua marca na tela', 'desde o início do contrato'],
          [`${r.totais.predios} · ${r.totais.telas}`, 'prédios · telas', 'residenciais de Foz do Iguaçu'],
        ].map(([v, t, d]) => (
          <div key={t} className={`${CARD} p-5`}>
            <div className="text-[26px] font-extrabold tracking-tight text-[#1b1719] tabular-nums sm:text-[30px]">{v}</div>
            <div className="mt-1 text-[14px] font-bold text-[#1b1719]">{t}</div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-[#6F6669]">{d}</div>
          </div>
        ))}
      </section>

      <Rodada r={r} />
      {r.meses.length > 0 && <LinhaDoTempo r={r} />}

      {/* vídeos */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className={EYEBROW}>Seus vídeos</div>
            <h2 className={H2}>
              {r.videos.length} vídeo{r.videos.length === 1 ? '' : 's'} nas telas{qtdSerie('cinema') ? ` · ${qtdSerie('cinema')} da programação do cinema` : ''}
            </h2>
          </div>
          {series.length > 1 && (
            <div className="flex gap-1 rounded-2xl bg-[#E9E4E5] p-1">
              {(['todos', ...series] as const).map((k) => (
                <button key={k} onClick={() => setFiltro(k as any)} className={`h-9 rounded-xl px-3.5 text-[13px] font-bold ${filtro === k ? 'bg-white text-[#9C1E1E] shadow-sm' : 'text-[#6F6669]'}`}>
                  {k === 'todos' ? 'Todos' : SERIE[k as keyof typeof SERIE]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {videos.map((v) => <CartaoVideo key={v.id} v={v} />)}
        </div>
        {filtrados.length > 8 && (
          <div className="text-center">
            <button onClick={() => setTodosVideos((x) => !x)} className="h-11 rounded-2xl bg-white px-5 text-sm font-bold text-[#9C1E1E] shadow-sm">{todosVideos ? 'Mostrar menos' : `Ver os ${filtrados.length} vídeos`}</button>
          </div>
        )}
      </section>

      {/* prédios */}
      <section className={`${CARD} flex flex-wrap gap-6 p-6 sm:p-7`}>
        <div className="min-w-0 flex-[1_1_360px] space-y-3.5">
          <div>
            <div className={EYEBROW}>Onde</div>
            <h2 className={H2}>{r.totais.predios} prédios · {r.totais.telas} telas</h2>
          </div>
          <Mapa r={r} />
        </div>
        <div className="min-w-0 flex-[1_1_360px] space-y-2.5">
          <div className="pt-1 text-[14px] font-extrabold text-[#1b1719]">Prédios com mais exibições</div>
          {predios.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#F7F5F6] p-2">
              {p.foto ? <img src={p.foto} alt="" loading="lazy" className="h-14 w-14 flex-none rounded-xl object-cover" /> : <div className="h-14 w-14 flex-none rounded-xl bg-[#E4DEE0]" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-extrabold text-[#1b1719]">{p.nome}</div>
                <div className="text-[12.5px] text-[#6F6669]">{p.bairro} · {p.telas} tela{p.telas === 1 ? '' : 's'}</div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-extrabold tabular-nums text-[#1b1719]">{nf(p.exibicoes)}</div>
                <div className="text-[11px] text-[#6F6669]">exibições</div>
              </div>
            </div>
          ))}
          {r.predios.length > 6 && (
            <button onClick={() => setTodosPredios((x) => !x)} className="px-1 py-1.5 text-sm font-bold text-[#9C1E1E]">{todosPredios ? 'Mostrar menos' : `Ver os ${r.predios.length} prédios`}</button>
          )}
        </div>
      </section>

      <section className="flex items-start gap-3 px-2 text-[13px] leading-relaxed text-[#6F6669]">
        <Info className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <strong className="text-[#1b1719]">Como contamos.</strong> As telas ficam ligadas {r.formato.horas_dia} horas por dia. Para cada prédio e cada dia, somamos quantos anúncios estavam no ar, a duração de cada vídeo e quantas telas o prédio tem. Atualizado em {new Date(r.gerado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.
        </div>
      </section>
    </div>
  );
};

export default RelatorioPedido;
