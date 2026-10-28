import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Thermometer, Wifi, Cable, Gauge, HardDrive, MemoryStick, MonitorCheck, MonitorX, Play, Square, Power,
  Clock, RefreshCw, Activity, AlertTriangle, CircleCheck, Info, Router, Globe, Server, Loader2,
} from "lucide-react";

/**
 * Aba "Diagnóstico" do painel: estado atual do NUC (coletor de saúde a cada 15 min), gráficos do período
 * e o LOG completo — quedas com causa provável, perda de pacotes, latência, temperatura, monitor, player,
 * reinícios, mudanças de rede e atualizações de conteúdo. Dados: função exa2-saude-painel.
 */

interface Props { computerId: string }

type Nivel = "critico" | "atencao" | "info" | "ok";
const NIVEL: Record<Nivel, { cor: string; icone: any; rotulo: string }> = {
  critico: { cor: "border-l-red-500 bg-red-500/5", icone: AlertTriangle, rotulo: "Crítico" },
  atencao: { cor: "border-l-amber-500 bg-amber-500/5", icone: AlertTriangle, rotulo: "Atenção" },
  info: { cor: "border-l-sky-500 bg-sky-500/5", icone: Info, rotulo: "Info" },
  ok: { cor: "border-l-emerald-500 bg-emerald-500/5", icone: CircleCheck, rotulo: "OK" },
};
const corNivel: Record<Nivel, string> = { critico: "text-red-500", atencao: "text-amber-500", info: "text-sky-500", ok: "text-emerald-500" };

const hora = (iso?: string | null, comDia = true) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", ...(comDia ? { day: "2-digit", month: "2-digit" } : {}), hour: "2-digit", minute: "2-digit" });
};
const atras = (iso?: string | null) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  if (m < 2880) return `há ${Math.round(m / 60)} h`;
  return `há ${Math.round(m / 1440)} dias`;
};

const Kpi = ({ icon: Icon, rotulo, valor, sub, tom = "neutro" }: { icon: any; rotulo: string; valor: any; sub?: any; tom?: "bom" | "atencao" | "critico" | "neutro" }) => (
  <div className={cn(
    "rounded-xl border p-3 min-w-0 transition-colors",
    tom === "bom" && "border-emerald-500/30 bg-emerald-500/5",
    tom === "atencao" && "border-amber-500/40 bg-amber-500/5",
    tom === "critico" && "border-red-500/40 bg-red-500/10",
    tom === "neutro" && "border-module bg-module-card",
  )}>
    <p className="text-[11px] uppercase tracking-wide text-module-secondary flex items-center gap-1.5 truncate"><Icon className="h-3.5 w-3.5 shrink-0" />{rotulo}</p>
    <p className="text-lg font-semibold text-module-primary mt-1 truncate">{valor ?? "—"}</p>
    {sub ? <p className="text-xs text-module-secondary truncate">{sub}</p> : null}
  </div>
);

const Grafico = ({ titulo, dados, linhas, unidade, dominio }: { titulo: string; dados: any[]; linhas: { k: string; nome: string; cor: string }[]; unidade: string; dominio?: [number, number] }) => (
  <div className="rounded-xl border border-module bg-module-card p-3">
    <p className="text-sm font-medium text-module-primary mb-2">{titulo}</p>
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis dataKey="rot" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis tick={{ fontSize: 10 }} domain={dominio || ["auto", "auto"]} unit={unidade} width={48} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any, n: any) => [`${v}${unidade}`, n]} />
          {linhas.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {linhas.map((l) => <Line key={l.k} type="monotone" dataKey={l.k} name={l.nome} stroke={l.cor} dot={false} strokeWidth={2} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const DiagnosticoTab = ({ computerId }: Props) => {
  const [horas, setHoras] = useState(24);
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "problemas" | "quedas">("problemas");

  const carregar = async () => {
    setCarregando(true); setErro(null);
    const { data, error } = await supabase.functions.invoke("exa2-saude-painel", { body: { device_id: computerId, horas } });
    if (error || !data?.success) setErro(error?.message || data?.error || "Não foi possível carregar o diagnóstico");
    else setDados(data);
    setCarregando(false);
  };
  useEffect(() => { carregar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [computerId, horas]);
  useEffect(() => { const t = setInterval(carregar, 60000); return () => clearInterval(t); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [computerId, horas]);

  const serie = useMemo(() => (dados?.serie || []).map((p: any) => ({ ...p, rot: hora(p.t, horas > 24) })), [dados, horas]);
  const eventos = useMemo(() => {
    const ev = dados?.eventos || [];
    if (filtro === "quedas") return ev.filter((e: any) => e.tipo === "queda" || e.tipo === "silencio" || e.tipo === "reinicio");
    if (filtro === "problemas") return ev.filter((e: any) => e.nivel === "critico" || e.nivel === "atencao" || e.tipo === "queda");
    return ev;
  }, [dados, filtro]);

  if (carregando && !dados) return <div className="flex items-center justify-center py-16 text-module-secondary"><Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando diagnóstico…</div>;
  if (erro && !dados) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-module-primary">
      {erro}<Button size="sm" variant="outline" className="ml-3" onClick={carregar}>Tentar de novo</Button>
    </div>
  );

  const a = dados?.atual || {};
  const r = a.rede || {}; const s = a.sistema || {}; const m = a.monitor || {}; const p = a.player || {};
  const res = dados?.resumo || {};
  const T = typeof a.temp_c === "number" ? a.temp_c : null;
  const perda = r.internet?.perda_pct;
  const coletorOk = dados?.coletor?.instalado;
  const velho = coletorOk && Date.now() - new Date(dados.coletor.visto_em).getTime() > 45 * 60000;

  return (
    <div className="space-y-4">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("text-xs", dados?.painel?.status === "online" ? "bg-emerald-600" : "bg-red-600")}>{dados?.painel?.status === "online" ? "Online" : "Offline"}</Badge>
          <Badge variant="outline" className="text-xs">Tela {dados?.painel?.tela || "?"}</Badge>
          {p.app_versao && <Badge variant="outline" className="text-xs">Player {p.app_versao}</Badge>}
          {coletorOk
            ? <Badge variant="outline" className={cn("text-xs", velho && "border-amber-500 text-amber-600")}>Diagnóstico {atras(dados.coletor.visto_em)}</Badge>
            : <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Coletor não instalado</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {[24, 72, 168].map((h) => (
            <Button key={h} size="sm" variant={horas === h ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setHoras(h)}>{h === 24 ? "24 h" : h === 72 ? "3 dias" : "7 dias"}</Button>
          ))}
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={carregar} title="Atualizar"><RefreshCw className={cn("h-3.5 w-3.5", carregando && "animate-spin")} /></Button>
        </div>
      </div>

      {!coletorOk && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-module-primary">
          Este NUC ainda não envia diagnóstico (temperatura, rede, monitor, player). As quedas abaixo vêm só do AnyDesk, sem causa.
          Instale o coletor de saúde neste NUC para ver tudo.
        </div>
      )}

      {/* resumo do período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi icon={Activity} rotulo="Disponibilidade" valor={res.disponibilidade_pct != null ? `${res.disponibilidade_pct}%` : "—"} sub={`${res.quedas ?? 0} queda(s) · ${res.tempo_fora || "0 min"} fora`} tom={res.disponibilidade_pct >= 99 ? "bom" : res.disponibilidade_pct >= 95 ? "atencao" : "critico"} />
        <Kpi icon={Globe} rotulo="Perda média internet" valor={res.perda_media != null ? `${res.perda_media}%` : "—"} sub={res.lat_media != null ? `latência média ${res.lat_media} ms` : undefined} tom={res.perda_media == null ? "neutro" : res.perda_media < 2 ? "bom" : res.perda_media < 10 ? "atencao" : "critico"} />
        <Kpi icon={Thermometer} rotulo="Temperatura (período)" valor={res.temp_max != null ? `máx ${res.temp_max}°C` : "—"} sub={res.temp_media != null ? `média ${res.temp_media}°C` : undefined} tom={res.temp_max == null ? "neutro" : res.temp_max < 75 ? "bom" : res.temp_max < 85 ? "atencao" : "critico"} />
        <Kpi icon={Power} rotulo="Reinícios" valor={res.reinicios ?? "—"} sub={`${res.amostras ?? 0} leituras no período`} tom={(res.reinicios || 0) === 0 ? "bom" : "atencao"} />
      </div>

      {/* estado atual */}
      {coletorOk && (
        <div>
          <p className="text-xs uppercase tracking-wide text-module-secondary mb-2">Agora · leitura de {hora(dados.coletor.visto_em)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <Kpi icon={Thermometer} rotulo="Temperatura" valor={T != null ? `${T}°C` : "—"} tom={T == null ? "neutro" : T < 75 ? "bom" : T < 85 ? "atencao" : "critico"} />
            <Kpi icon={Globe} rotulo="Internet" valor={perda != null ? `${perda}% perda` : "—"} sub={r.internet?.lat_ms != null ? `${r.internet.lat_ms} ms · variação ${r.internet.jitter_ms ?? "?"} ms` : undefined} tom={perda == null ? "neutro" : perda < 2 ? "bom" : perda < 10 ? "atencao" : "critico"} />
            <Kpi icon={Router} rotulo="Roteador do prédio" valor={r.gw?.perda_pct != null ? `${r.gw.perda_pct}% perda` : "—"} sub={r.gateway ? `${r.gateway} · ${r.gw?.lat_ms ?? "?"} ms` : undefined} tom={r.gw?.perda_pct == null ? "neutro" : r.gw.perda_pct < 2 ? "bom" : "atencao"} />
            <Kpi icon={Server} rotulo="Servidor das telas" valor={r.api_telas?.perda_pct != null ? `${r.api_telas.perda_pct}% perda` : "—"} sub={r.api_telas?.lat_ms != null ? `${r.api_telas.lat_ms} ms` : undefined} tom={r.api_telas?.perda_pct == null ? "neutro" : r.api_telas.perda_pct < 5 ? "bom" : "atencao"} />
            <Kpi icon={Gauge} rotulo="Download" valor={a.download_mbps != null ? `${a.download_mbps} Mbps` : "—"} sub="medido 1x por dia" tom={a.download_mbps == null ? "neutro" : a.download_mbps >= 10 ? "bom" : a.download_mbps >= 5 ? "atencao" : "critico"} />
            {r.tipo === "wifi"
              ? <Kpi icon={Wifi} rotulo={`Wi-Fi ${r.wifi_banda || ""}`} valor={r.wifi_sinal_dbm != null ? `${r.wifi_sinal_dbm} dBm` : "—"} sub={[r.wifi_ssid, r.wifi_taxa_mbps ? `${r.wifi_taxa_mbps} Mbit/s` : null].filter(Boolean).join(" · ")} tom={r.wifi_sinal_dbm == null ? "neutro" : r.wifi_sinal_dbm > -67 ? "bom" : r.wifi_sinal_dbm > -75 ? "atencao" : "critico"} />
              : <Kpi icon={Cable} rotulo="Conexão" valor={r.tipo === "cabo" ? "Cabo" : "—"} sub={[r.iface, r.link_mbps ? `${r.link_mbps} Mbit/s` : null, r.ip_publico ? `IP ${r.ip_publico}` : null].filter(Boolean).join(" · ")} tom={r.tipo ? "bom" : "neutro"} />}
            <Kpi icon={m.monitor_conectado === false || m.monitor_ligado === false ? MonitorX : MonitorCheck} rotulo="Monitor" valor={m.monitor_conectado === false ? "Desconectado" : m.monitor_ligado === false ? "Desligado" : m.monitor_conectado ? "Ligado" : "—"} sub={m.resolucao || undefined} tom={m.monitor_conectado === false || m.monitor_ligado === false ? "critico" : m.monitor_conectado ? "bom" : "neutro"} />
            <Kpi icon={p.main_rodando === false ? Square : Play} rotulo="Player" valor={p.main_rodando === false ? "Parado" : p.main_rodando ? "Rodando" : "—"} sub={p.main_ha_min != null ? `há ${p.main_ha_min >= 120 ? Math.round(p.main_ha_min / 60) + " h" : p.main_ha_min + " min"} · ${p.videos_no_cache ?? "?"} vídeos` : undefined} tom={p.main_rodando === false ? "critico" : p.main_rodando ? "bom" : "neutro"} />
            <Kpi icon={HardDrive} rotulo="Disco" valor={s.disco_uso_pct != null ? `${s.disco_uso_pct}%` : "—"} sub={[s.disco_total_gb ? `${s.disco_total_gb} GB` : null, p.disco_gravavel === false ? "SOMENTE LEITURA" : null].filter(Boolean).join(" · ")} tom={p.disco_gravavel === false || s.disco_uso_pct >= 90 ? "critico" : s.disco_uso_pct >= 80 ? "atencao" : s.disco_uso_pct != null ? "bom" : "neutro"} />
            <Kpi icon={Activity} rotulo="CPU" valor={a.cpu?.cpu_uso_pct != null ? `${a.cpu.cpu_uso_pct}%` : "—"} sub={a.cpu?.top?.[0] ? `maior: ${a.cpu.top[0].proc} ${a.cpu.top[0].cpu}%` : undefined} tom={a.cpu?.cpu_uso_pct == null ? "neutro" : a.cpu.cpu_uso_pct < 75 ? "bom" : a.cpu.cpu_uso_pct < 90 ? "atencao" : "critico"} />
            <Kpi icon={MemoryStick} rotulo="Memória" valor={s.ram_uso_pct != null ? `${s.ram_uso_pct}%` : "—"} sub={[s.ram_total_gb ? `${s.ram_total_gb} GB` : null, s.load1 != null ? `carga ${s.load1}` : null].filter(Boolean).join(" · ")} tom={s.ram_uso_pct == null ? "neutro" : s.ram_uso_pct < 85 ? "bom" : "atencao"} />
            <Kpi icon={Clock} rotulo="Ligado há" valor={s.uptime_h != null ? (s.uptime_h >= 48 ? `${Math.round(s.uptime_h / 24)} dias` : `${s.uptime_h} h`) : "—"} sub={s.boots_24h != null ? `${s.boots_24h} partida(s) em 24 h · relógio ${s.ntp_ok ? "ok" : "fora"}` : undefined} tom={(s.boots_24h || 0) >= 2 || s.ntp_ok === false ? "atencao" : s.uptime_h != null ? "bom" : "neutro"} />
            <Kpi icon={Server} rotulo="Hardware" valor={s.produto || s.fabricante || "—"} sub={s.cpu || undefined} />
          </div>
        </div>
      )}

      {/* gráficos */}
      {serie.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Grafico titulo="Perda de pacotes" unidade="%" dominio={[0, 100]} dados={serie} linhas={[{ k: "perda_net", nome: "Internet", cor: "#ef4444" }, { k: "perda_gw", nome: "Roteador", cor: "#f59e0b" }, { k: "perda_api", nome: "Servidor das telas", cor: "#8b5cf6" }]} />
          <Grafico titulo="Latência da internet" unidade=" ms" dados={serie} linhas={[{ k: "lat_net", nome: "Latência", cor: "#3b82f6" }, { k: "jitter", nome: "Variação", cor: "#8b5cf6" }]} />
          <Grafico titulo="Temperatura do NUC" unidade="°C" dados={serie} linhas={[{ k: "temp", nome: "Temperatura", cor: "#f97316" }]} />
          {serie.some((x: any) => typeof x.sinal === "number")
            ? <Grafico titulo="Sinal do Wi-Fi" unidade=" dBm" dados={serie} linhas={[{ k: "sinal", nome: "Sinal", cor: "#10b981" }]} />
            : <Grafico titulo="CPU e memória" unidade="%" dominio={[0, 100]} dados={serie} linhas={[{ k: "cpu", nome: "CPU", cor: "#ef4444" }, { k: "ram", nome: "RAM", cor: "#0ea5e9" }]} />}
        </div>
      )}

      {/* log */}
      <div className="rounded-xl border border-module bg-module-card">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-module">
          <p className="text-sm font-medium text-module-primary">Log do painel <span className="text-module-secondary font-normal">({eventos.length})</span></p>
          <div className="flex gap-1">
            {([["problemas", "Problemas"], ["quedas", "Quedas"], ["todos", "Tudo"]] as const).map(([k, rot]) => (
              <Button key={k} size="sm" variant={filtro === k ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setFiltro(k)}>{rot}</Button>
            ))}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
          {eventos.length === 0 && <p className="p-4 text-sm text-module-secondary">Nenhum evento neste período.</p>}
          {eventos.map((e: any, i: number) => {
            const n = NIVEL[e.nivel as Nivel] || NIVEL.info;
            const Icone = n.icone;
            return (
              <div key={i} className={cn("flex gap-3 p-3 border-l-4", n.cor)}>
                <Icone className={cn("h-4 w-4 mt-0.5 shrink-0", corNivel[e.nivel as Nivel])} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-medium text-module-primary">{e.titulo}</p>
                    <p className="text-xs text-module-secondary">{hora(e.em)}{e.fim ? ` → ${hora(e.fim, false)}` : ""}</p>
                  </div>
                  {e.detalhe && <p className="text-xs text-module-secondary mt-0.5 break-words">{e.detalhe}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
