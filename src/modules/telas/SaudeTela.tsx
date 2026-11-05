/**
 * Saúde da tela (equipe): hardware do aparelho, fluidez e saúde agora, gráfico das últimas 24 h,
 * gravações da tela (app Android 1.0.5+) e ajustes de desempenho (modo leve, margem da TV).
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clapperboard, Cpu, Gauge, Loader2, RefreshCw, Thermometer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const db = supabase as any;

type Props = { tela: any; onFechar: () => void; onAtualizou?: () => void };

const n = (v: unknown, suf = '') => (v === null || v === undefined || v === '' || Number.isNaN(v as number) ? '—' : `${v}${suf}`);
const maxTemp = (t: any) => {
  const v = Object.values(t || {}).map(Number).filter((x) => Number.isFinite(x));
  return v.length ? Math.max(...v) : null;
};
const corFps = (f: number | null | undefined) => (f == null ? '#6A6B70' : f >= 50 ? '#1E6B47' : f >= 30 ? '#8A5A00' : '#9C1E1E');

function Linha({ r, v, c }: { r: string; v: React.ReactNode; c?: string }) {
  return (
    <>
      <dt className="text-[#6A6B70]">{r}</dt>
      <dd className="min-w-0 break-words font-semibold" style={{ color: c }}>{v}</dd>
    </>
  );
}

function Grafico({ pontos, cor, rotulo, max }: { pontos: { t: number; v: number | null }[]; cor: string; rotulo: string; max?: number }) {
  const val = pontos.filter((p) => p.v != null) as { t: number; v: number }[];
  if (val.length < 2) return <div className="rounded-xl bg-black/[0.035] p-3 text-[12px] text-[#6A6B70]">{rotulo}: ainda sem histórico (registra a cada 5 min)</div>;
  const W = 520, H = 90;
  const t0 = val[0].t, t1 = val[val.length - 1].t;
  const vmax = max || Math.max(...val.map((p) => p.v)) * 1.1 || 1;
  const d = val.map((p, i) => `${i ? 'L' : 'M'}${(((p.t - t0) / Math.max(1, t1 - t0)) * W).toFixed(1)},${(H - (p.v / vmax) * H).toFixed(1)}`).join(' ');
  const ult = val[val.length - 1].v;
  return (
    <div className="rounded-xl bg-black/[0.035] p-3">
      <div className="flex items-baseline justify-between text-[12px] font-bold text-[#6A6B70]"><span>{rotulo}</span><span style={{ color: cor }}>agora {ult}</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-[90px] w-full" preserveAspectRatio="none"><path d={d} fill="none" stroke={cor} strokeWidth={2} vectorEffect="non-scaling-stroke" /></svg>
      <div className="flex justify-between text-[11px] text-[#8A8B90]"><span>{new Date(t0).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><span>{new Date(t1).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
    </div>
  );
}

export function SaudeTela({ tela, onFechar, onAtualizou }: Props) {
  const info = tela.info || {};
  const saude = tela.saude || {};
  const fl = saude.fluidez || {};
  const ap = saude.aparelho || {};
  const android = String(tela.plataforma || '').startsWith('android');
  const appVer = String(info.app || '');
  const podeGravar = android && /^1\.0\.(\d+)/.test(appVer) && Number(appVer.split('.')[2]) >= 5;
  const [pedindo, setPedindo] = useState(false);
  const [leve, setLeve] = useState<string>(typeof tela.config?.leve === 'boolean' ? (tela.config.leve ? 'sim' : 'nao') : 'auto');
  const [margem, setMargem] = useState<number>(Number(tela.config?.margem) || 0);

  const dados = useQuery({
    queryKey: ['exa-tela-saude', tela.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('exa-tela', { body: { acao: 'gravacoes', tela_id: tela.id } });
      if (error) throw error;
      return data as { gravacoes: any[]; saude: { criado_em: string; dados: any }[] };
    },
    refetchInterval: 20000,
  });

  const hist = useMemo(() => (dados.data?.saude || []).map((h) => ({ t: Date.parse(h.criado_em), d: h.dados || {} })), [dados.data]);
  const gravacaoPendente = String(tela.comando || '').startsWith('gravar');

  const gravar = async (seg: number) => {
    setPedindo(true);
    const { error } = await db.from('exa_telas').update({ comando: `gravar:${seg}`, comando_em: new Date().toISOString() }).eq('id', tela.id);
    setPedindo(false);
    if (error) toast.error(error.message);
    else { toast.success(`Gravação de ${seg} s pedida`, { description: 'A TV começa em até 1 minuto; o vídeo aparece aqui uns segundos depois de terminar.' }); onAtualizou?.(); }
  };
  const salvarAjustes = async () => {
    const config = { ...(tela.config || {}), margem: margem || undefined, leve: leve === 'auto' ? undefined : leve === 'sim' };
    const { error } = await db.from('exa_telas').update({ config }).eq('id', tela.id);
    if (error) toast.error(error.message); else { toast.success('Ajustes salvos', { description: 'A TV aplica no próximo batimento (até 1 min).' }); onAtualizou?.(); }
  };

  const decHw = (Array.isArray(info.decodificadores) ? info.decodificadores : []).filter((d: any) => !d.software && /avc|hevc|vp9/.test(String(d.tipo)));

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saúde · {tela.nome || 'tela'}</DialogTitle>
          <DialogDescription>Hardware, fluidez medida na própria TV, histórico de 24 h e gravações da tela.</DialogDescription>
        </DialogHeader>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-black/[0.035] p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]"><Gauge className="h-4 w-4" />Fluidez agora</h3>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px]">
              <Linha r="Quadros/s" v={`${n(fl.fps)} (pior segundo ${n(fl.fps_pior_segundo)})`} c={corFps(fl.fps)} />
              <Linha r="Travadas > 50 ms" v={`${n(fl.travadas_50ms)} em 10 s · pior ${n(fl.pior_quadro_ms, ' ms')}`} />
              <Linha r="Vídeo perdendo quadros" v={`${n(fl.video_pct_perdidos, '%')} (${n(fl.video_perdidos)} de ${n(fl.video_quadros)})`} c={(fl.video_pct_perdidos || 0) > 5 ? '#9C1E1E' : undefined} />
              <Linha r="Vídeo parou p/ carregar" v={`${n(fl.video_esperas)}× · ${n(fl.video_esperando_ms ? Math.round(fl.video_esperando_ms / 100) / 10 : 0, ' s')}`} />
              <Linha r="Tarefas pesadas" v={`${n(fl.tarefas_longas)} · ${n(fl.tarefas_longas_ms, ' ms')}`} />
              <Linha r="Modo leve" v={fl.leve ? 'ligado' : 'desligado'} />
              <Linha r="Memória da página" v={`${n(saude.memoria_mb, ' MB')} de ${n(saude.memoria_limite_mb, ' MB')}`} />
              <Linha r="Atualizado" v={saude.em ? new Date(saude.em).toLocaleTimeString('pt-BR') : '—'} />
            </dl>
          </div>
          <div className="rounded-2xl bg-black/[0.035] p-4">
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]"><Thermometer className="h-4 w-4" />Aparelho agora</h3>
            {!saude.aparelho ? (
              <p className="text-[13px] text-[#6A6B70]">{android ? `O app ${appVer || 'antigo'} não manda CPU, temperatura e memória. Instale a versão nova (examidia.com.br/baixar-tela).` : 'Só o app Android manda CPU, temperatura e memória.'}</p>
            ) : (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px]">
                <Linha r="CPU (MHz por núcleo)" v={(ap.cpu_mhz || []).join(' · ') || '—'} />
                <Linha r="CPU do app" v={n(ap.cpu_app_pct, '%')} />
                <Linha r="Carga" v={n(ap.carga)} />
                <Linha r="Temperatura" v={Object.entries(ap.temperaturas || {}).map(([k, v]) => `${k} ${v}°`).join(' · ') || '—'} c={(maxTemp(ap.temperaturas) || 0) >= 75 ? '#9C1E1E' : undefined} />
                <Linha r="Aquecimento" v={n(ap.aquecimento)} />
                <Linha r="Memória livre" v={`${n(ap.memoria_livre_mb, ' MB')}${ap.memoria_baixa ? ' · BAIXA' : ''}`} c={ap.memoria_baixa ? '#9C1E1E' : undefined} />
                <Linha r="Memória do app" v={n(ap.memoria_app_mb, ' MB')} />
                <Linha r="Armazenamento livre" v={n(ap.armazenamento_livre_mb, ' MB')} />
                <Linha r="Wi-Fi" v={ap.rede?.wifi_sinal_dbm != null ? `${ap.rede.wifi_sinal_dbm} dBm · ${n(ap.rede.wifi_velocidade_mbps, ' Mb/s')} · ${n(ap.rede.wifi_frequencia_mhz, ' MHz')}` : n(ap.rede?.tipo)} />
                <Linha r="Quadros do app" v={`${n(ap.app_travadas_50ms)} travadas · pior ${n(ap.app_pior_quadro_ms, ' ms')}`} />
                <Linha r="Ligado há" v={ap.ligado_min != null ? `${Math.round(ap.ligado_min / 60)} h` : '—'} />
              </dl>
            )}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Grafico rotulo="Quadros por segundo (24 h)" cor="#1E6B47" max={65} pontos={hist.map((h) => ({ t: h.t, v: h.d.fluidez?.fps ?? null }))} />
          <Grafico rotulo="Temperatura máxima °C (24 h)" cor="#9C1E1E" pontos={hist.map((h) => ({ t: h.t, v: maxTemp(h.d.aparelho?.temperaturas) }))} />
          <Grafico rotulo="Vídeo perdendo quadros % (24 h)" cor="#8A5A00" pontos={hist.map((h) => ({ t: h.t, v: h.d.fluidez?.video_pct_perdidos ?? null }))} />
          <Grafico rotulo="Memória livre MB (24 h)" cor="#2B4FD8" pontos={hist.map((h) => ({ t: h.t, v: h.d.aparelho?.memoria_livre_mb ?? null }))} />
        </section>

        <section className="rounded-2xl bg-black/[0.035] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]"><Cpu className="h-4 w-4" />Hardware</h3>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px]">
            <Linha r="Aparelho" v={[info.fabricante, info.modelo, info.marca && info.marca !== info.fabricante ? `(${info.marca})` : ''].filter(Boolean).join(' ') || '—'} />
            <Linha r="Sistema" v={`Android ${n(info.android)} (API ${n(info.sdk)})${info.patch_seguranca ? ` · patch ${info.patch_seguranca}` : ''}`} />
            <Linha r="Processador" v={[info.soc || info.hardware, info.cpu_nucleos ? `${info.cpu_nucleos} núcleos` : '', Array.isArray(info.cpu_max_mhz) && info.cpu_max_mhz.length ? `até ${Math.max(...info.cpu_max_mhz.filter((x: any) => x))} MHz` : ''].filter(Boolean).join(' · ') || '—'} />
            <Linha r="Placa de vídeo" v={n(info.gpu)} />
            <Linha r="Memória" v={`${n(info.memoria_mb, ' MB')}${info.aparelho_pouca_memoria ? ' · aparelho de pouca memória' : ''} · app até ${n(info.memoria_app_grande_mb, ' MB')}`} />
            <Linha r="Armazenamento" v={`${n(info.armazenamento_livre_mb, ' MB')} livres de ${n(info.armazenamento_mb, ' MB')}`} />
            <Linha r="Saída de vídeo" v={`${n(info.tela_px || (info.largura && `${info.largura}x${info.altura}`))} @ ${n(info.tela_hz, ' Hz')}`} />
            <Linha r="Navegador interno" v={`${n(info.chrome || (String(info.ua || '').match(/Chrome\/[\d.]+/) || [''])[0])}${info.webview ? ` · ${info.webview}` : ''}`} />
            <Linha r="Decodificador de vídeo" v={decHw.length ? decHw.map((d: any) => `${String(d.tipo).replace('video/', '')} ${d.max || ''}${d.max_fps_1080p ? ` (${d.max_fps_1080p} fps em 1080p)` : ''}`).join(' · ') : '—'} />
            <Linha r="App" v={`${n(appVer)}${info.app_inicial ? ' · app inicial' : ''}`} />
          </dl>
        </section>

        <section className="rounded-2xl bg-black/[0.035] p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]"><Clapperboard className="h-4 w-4" />Gravações da tela</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => dados.refetch()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5" title="Atualizar"><RefreshCw className={`h-4 w-4 ${dados.isFetching ? 'animate-spin' : ''}`} /></button>
              {[15, 30, 60].map((s) => (
                <button key={s} type="button" disabled={!podeGravar || pedindo || gravacaoPendente} onClick={() => gravar(s)}
                  className="h-9 rounded-xl bg-[#9C1E1E] px-3 text-[13px] font-bold text-white disabled:opacity-40">Gravar {s} s</button>
              ))}
            </div>
          </div>
          {!podeGravar && <p className="mb-2 text-[12px] text-[#8A5A00]">{android ? `Gravar precisa do app 1.0.5 ou mais novo (esta TV está com ${appVer || 'versão antiga'}). Instale por examidia.com.br/baixar-tela.` : 'Só o app Android grava a tela.'}</p>}
          {gravacaoPendente && <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#8A5A00]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Gravação pedida: a TV começa no próximo batimento.</p>}
          <div className="space-y-3">
            {(dados.data?.gravacoes || []).filter((g) => g.tipo === 'gravacao').map((g, i) => (
              <div key={i} className="rounded-xl bg-white/70 p-2">
                <div className="mb-1 text-[12px] font-semibold text-[#5E5F63]">{new Date(g.em).toLocaleString('pt-BR')} · {g.segundos || '?'} s · {g.quadros || 0} quadros{g.bytes ? ` · ${Math.round(g.bytes / 1024)} KB` : ''}</div>
                {g.url ? <video src={g.url} controls playsInline className="w-full rounded-lg bg-black" /> : <div className="text-[12px] text-[#9C1E1E]">Não gravou: {g.erro || 'motivo desconhecido'}</div>}
              </div>
            ))}
            {!dados.isLoading && !(dados.data?.gravacoes || []).some((g) => g.tipo === 'gravacao') && <p className="text-[12px] text-[#6A6B70]">Nenhuma gravação ainda.</p>}
          </div>
        </section>

        <section className="rounded-2xl bg-black/[0.035] p-4">
          <h3 className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Ajustes de desempenho</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-[13px] font-semibold">Modo leve
              <select value={leve} onChange={(e) => setLeve(e.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-black/10 bg-white px-3">
                <option value="auto">Automático (liga em aparelho fraco)</option>
                <option value="sim">Sempre ligado</option>
                <option value="nao">Desligado</option>
              </select>
            </label>
            <label className="text-[13px] font-semibold">Margem da TV (corta as bordas?) · {margem}%
              <input type="range" min={0} max={6} step={0.5} value={margem} onChange={(e) => setMargem(Number(e.target.value))} className="mt-3 block w-full" />
            </label>
          </div>
          <button type="button" onClick={salvarAjustes} className="mt-3 h-10 rounded-xl bg-[#17181A] px-4 text-[13px] font-bold text-white">Salvar ajustes</button>
        </section>
      </DialogContent>
    </Dialog>
  );
}
